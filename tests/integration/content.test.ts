import { spawnSync } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, expect, test } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const reports: { name: string; status: number | null; output: string }[] = [];
const valid = await readFile(
  join(root, 'tests/fixtures/content/valid-post.md'),
  'utf8',
);

async function put(directory: string, path: string, value: string) {
  await mkdir(dirname(join(directory, path)), { recursive: true });
  await writeFile(join(directory, path), value);
}

async function isolated(run: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), 'blog-content-'));
  try {
    for (const path of [
      'src',
      'scripts/build.mjs',
      'astro.config.mjs',
      'package.json',
      'tsconfig.json',
    ]) {
      await cp(join(root, path), join(directory, path), {
        recursive: true,
        filter: (source) => source !== join(root, 'src/content'),
      });
    }
    // Never test by editing or copying real articles into fixtures or reports.
    await rm(join(directory, 'src/content'), { recursive: true, force: true });
    await mkdir(join(directory, 'src/content/posts'), { recursive: true });
    await symlink(
      join(root, 'node_modules'),
      join(directory, 'node_modules'),
      'dir',
    );
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function build(directory: string, name: string, timezone = 'UTC') {
  const env = { ...process.env };
  // Vitest injects Vite's default BASE_URL and MODE into process.env. The
  // child must receive Astro's actual deployment config, not the test runner's.
  for (const key of [
    'BASE_URL',
    'MODE',
    'DEV',
    'PROD',
    'SSR',
    'VITEST',
    'VITEST_WORKER_ID',
    'VITEST_POOL_ID',
  ])
    delete env[key];
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 90_000,
    env: {
      ...env,
      NODE_ENV: 'production',
      TZ: timezone,
      ASTRO_TELEMETRY_DISABLED: '1',
      CI: 'true',
      NO_COLOR: '1',
      FORCE_COLOR: '0',
    },
  });
  const output = `${result.stdout}\n${result.stderr}`.replaceAll(
    directory,
    '<isolated-project>',
  );
  reports.push({ name, status: result.status, output });
  expect(result.error, output).toBeUndefined();
  expect(result.signal, output).toBeNull();
  return { status: result.status, output };
}

function success(result: ReturnType<typeof build>) {
  expect(result.status, result.output).toBe(0);
}

afterAll(async () => {
  await mkdir(join(root, 'test-results/content'), { recursive: true });
  await writeFile(
    join(root, 'test-results/content/builds.json'),
    JSON.stringify(reports, null, 2) + '\n',
  );
});

test.each(['UTC', 'Asia/Singapore', 'America/Los_Angeles'])(
  'real loader, rendered URLs and date-only in %s',
  async (timezone) => {
    await isolated(async (directory) => {
      await put(directory, 'src/content/posts/leap-post.md', valid);
      await put(
        directory,
        'src/content/posts/future-post.md',
        valid.replaceAll('2024-02-29', '9999-12-31'),
      );
      await put(
        directory,
        'src/content/posts/future-draft.md',
        valid
          .replace('draft: false', 'draft: true')
          .replace('2024-02-29', '9999-12-31'),
      );
      await mkdir(join(directory, 'src/pages/posts'), { recursive: true });
      const route = (
        await readFile(
          join(root, 'tests/fixtures/content/post-route.astro'),
          'utf8',
        )
      ).replaceAll('../../../src/lib/', '../../lib/');
      await put(directory, 'src/pages/posts/[id].astro', route);
      await put(
        directory,
        'src/pages/collection.json.ts',
        `import { getCollection } from 'astro:content';\nexport async function GET() { return new Response(JSON.stringify(await getCollection('posts'))); }\n`,
      );
      success(build(directory, `positive-${timezone}`, timezone));
      const entries = JSON.parse(
        await readFile(join(directory, 'dist/collection.json'), 'utf8'),
      );
      expect(entries.map((entry: { id: string }) => entry.id).sort()).toEqual([
        'future-draft',
        'future-post',
        'leap-post',
      ]);
      const leap = entries.find(
        (entry: { id: string }) => entry.id === 'leap-post',
      );
      expect(leap.data).toEqual({
        title: '合成管线样本',
        description: '仅用于可重复测试。',
        pubDate: '2024-02-29',
        draft: false,
      });
      const html = await readFile(
        join(directory, 'dist/posts/leap-post/index.html'),
        'utf8',
      );
      const base =
        process.env.GITHUB_REPOSITORY === 'sionrbot/personal-blog-acceptance'
          ? '/personal-blog-acceptance'
          : '/personal-blog';
      for (const url of [
        `${base}/`,
        `${base}/posts/leap-post/`,
        `${base}/posts/future-post/#%E5%90%88%E6%88%90%E6%AD%A3%E6%96%87`,
        `${base}/post-assets/leap-post/probe.txt`,
        `${base}/shared/probe.txt`,
        'https://example.com/reference',
      ]) {
        expect(html).toContain(`href="${url}"`);
      }
      expect(html).toContain(`src="${base}/post-assets/leap-post/probe.png"`);
      expect(html).toContain('<time>2024-02-29</time>');
      expect(
        await readFile(
          join(directory, 'dist/posts/future-post/index.html'),
          'utf8',
        ),
      ).toContain('9999-12-31');
      await expect(
        readFile(join(directory, 'dist/posts/future-draft/index.html')),
      ).rejects.toThrow(/ENOENT/);
      if (timezone === 'UTC') {
        await put(
          directory,
          'src/content/posts/leap-post.md',
          valid.replace('合成管线样本', '修改后的合成标题'),
        );
        success(build(directory, 'title-change-stable-url', timezone));
        const changed = await readFile(
          join(directory, 'dist/posts/leap-post/index.html'),
          'utf8',
        );
        expect(changed).toContain('<title>修改后的合成标题</title>');
        expect(changed).toContain(`href="${base}/posts/leap-post/"`);
      }
    });
  },
  90_000,
);

const metadataFailures: [string, string, string][] = [];
for (const field of ['title', 'description', 'pubDate', 'draft']) {
  metadataFailures.push([
    `missing-${field}`,
    valid.replace(new RegExp(`^${field}:.*\\n`, 'm'), ''),
    field,
  ]);
  metadataFailures.push([
    `type-${field}`,
    valid.replace(
      new RegExp(`^${field}:.*$`, 'm'),
      `${field}: ${field === 'draft' ? '"false"' : '42'}`,
    ),
    field,
  ]);
}
for (const field of ['title', 'description'])
  metadataFailures.push([
    `blank-${field}`,
    valid.replace(new RegExp(`^${field}:.*$`, 'm'), `${field}: '   '`),
    field,
  ]);
for (const date of [
  '2026-02-30',
  '2025-02-29',
  '1900-02-29',
  '0000-01-01',
  '2026-13-01',
  '2026-00-01',
  '2026-01-00',
  '2026-04-31',
  '2026-1-01',
  '2026-10-16T00:00:00Z',
  ' 2026-10-16 ',
])
  metadataFailures.push([
    `date-${date.trim().replaceAll(':', '-')}`,
    valid.replace('2024-02-29', date),
    'pubDate',
  ]);
metadataFailures.push([
  'unknown-key',
  valid.replace('draft: false', 'draft: false\nauthor: synthetic'),
  'author',
]);
metadataFailures.push([
  'slug-override',
  valid.replace('draft: false', 'draft: false\nslug: different'),
  'slug',
]);
metadataFailures.push([
  'invalid-draft',
  valid
    .replace('draft: false', 'draft: true')
    .replace('2024-02-29', '2026-02-30'),
  'pubDate',
]);

test.each(metadataFailures)(
  'real build rejects %s at the expected file and field',
  async (name, body, field) => {
    await isolated(async (directory) => {
      await put(directory, 'src/content/posts/broken-post.md', body);
      const result = build(directory, name);
      expect(result.status, result.output).not.toBe(0);
      expect(result.output).toContain('broken-post');
      expect(result.output).toContain(field);
      expect(result.output).toMatch(
        /InvalidContentEntryDataError|does not match collection schema/,
      );
    });
  },
  90_000,
);

test.each([
  'Upper.md',
  'wrong.MD',
  'two--hyphens.md',
  '.hidden.md',
  'readme.txt',
  'nested',
  'linked.md',
])(
  'real build rejects directory entry %s',
  async (name) => {
    await isolated(async (directory) => {
      if (name === 'nested')
        await put(directory, 'src/content/posts/nested/post.md', valid);
      else if (name === 'linked.md') {
        await put(directory, 'linked-source.md', valid);
        await symlink(
          join(directory, 'linked-source.md'),
          join(directory, 'src/content/posts/linked.md'),
        );
      } else await put(directory, `src/content/posts/${name}`, valid);
      const result = build(directory, `file-${name}`);
      expect(result.status, result.output).not.toBe(0);
      expect(result.output).toContain(name);
      expect(result.output).toMatch(/Invalid post (filename|entry)/);
    });
  },
  90_000,
);

test.each([
  ['raw-html', '\n<div>raw HTML</div>\n', 'Raw HTML'],
  ['h1', '\n# Heading\n', 'headings'],
  ['relative-link', '\n[bad](./other.md)\n', 'Invalid URL path'],
  [
    'prefixed-link',
    '\n[bad](/personal-blog/posts/leap-post/)\n',
    'Unsupported Markdown URL',
  ],
  ['script-link', '\n[bad](javascript:alert)\n', 'Unsupported Markdown URL'],
])(
  'invalid draft body cannot pass through swallowed render errors: %s',
  async (name, body, diagnostic) => {
    await isolated(async (directory) => {
      await put(
        directory,
        'src/content/posts/broken-body.md',
        valid.replace('draft: false', 'draft: true') + body,
      );
      const result = build(directory, name);
      expect(result.status, result.output).not.toBe(0);
      expect(result.output).toContain('broken-body.md');
      expect(result.output).toContain(diagnostic);
      expect(result.output).toContain('Invalid post body');
    });
  },
  90_000,
);

test('template requires author fields; completed template stays a validated draft', async () => {
  await isolated(async (directory) => {
    const template = await readFile(join(root, 'templates/post.md'), 'utf8');
    await put(directory, 'src/content/posts/template-probe.md', template);
    const invalid = build(directory, 'unfilled-template');
    expect(invalid.status, invalid.output).not.toBe(0);
    expect(invalid.output).toContain('template-probe');
    expect(invalid.output).toContain('title');
    const filled = template
      .replace("title: ''", "title: '合成模板测试'")
      .replace("description: ''", "description: '仅供测试'")
      .replace('YYYY-MM-DD', '2000-02-29');
    await put(directory, 'src/content/posts/template-probe.md', filled);
    success(build(directory, 'filled-template'));
  });
}, 90_000);

test('real build rejects a symlink used as the posts directory', async () => {
  await isolated(async (directory) => {
    await rm(join(directory, 'src/content/posts'), { recursive: true });
    await put(directory, 'outside-posts/linked-post.md', valid);
    await symlink(
      join(directory, 'outside-posts'),
      join(directory, 'src/content/posts'),
      'dir',
    );
    const result = build(directory, 'symlink-post-directory');
    expect(result.status, result.output).not.toBe(0);
    expect(result.output).toContain('Invalid post directory');
    expect(result.output).toContain('src/content/posts');
  });
}, 90_000);
