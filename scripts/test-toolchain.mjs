import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await mkdtemp(join(tmpdir(), 'blog-toolchain-'));
const bin = (name) => join(root, 'node_modules', '.bin', name);

function run(command, args, cwd = temporary) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: 120_000,
    env: { ...process.env, CI: 'true', NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  if (result.error) throw result.error;
  assert.equal(result.signal, null, `${command} terminated: ${result.signal}`);
  return {
    status: result.status,
    output: `${result.stdout}\n${result.stderr}`,
  };
}

function expectSuccess(result, label) {
  assert.equal(result.status, 0, `${label}\n${result.output}`);
}

async function put(relative, source) {
  const path = join(temporary, relative);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, source);
}

try {
  for (const name of [
    'package.json',
    'eslint.config.mjs',
    'stylelint.config.mjs',
    '.prettierrc.json',
    '.prettierignore',
    '.markdownlint-cli2.jsonc',
  ]) {
    await copyFile(join(root, name), join(temporary, name));
  }
  await symlink(
    join(root, 'node_modules'),
    join(temporary, 'node_modules'),
    'dir',
  );

  const articleHeader = '---\ntitle: "工具链样本"\n---\n\n';
  const lintProbes = [
    {
      name: 'Astro template',
      file: 'src/probe.astro',
      command: 'eslint',
      rule: /astro\/no-conflict-set-directives/,
      bad: '<div set:text="replacement">conflicting child</div>\n',
      good: '<div set:text="replacement" />\n',
    },
    {
      name: 'TypeScript',
      file: 'src/probe.ts',
      command: 'eslint',
      rule: /@typescript-eslint\/no-unused-vars/,
      bad: 'const unusedProbe: number = 1;\n',
      good: 'export const probe: number = 1;\n',
    },
    {
      name: 'CSS',
      file: 'src/probe.css',
      command: 'stylelint',
      rule: /property-no-unknown/,
      bad: '.probe {\n  unknown-probe-property: red;\n}\n',
      good: '.probe {\n  color: red;\n}\n',
    },
    {
      name: 'Astro inline CSS',
      file: 'src/style-probe.astro',
      command: 'stylelint',
      rule: /property-no-unknown/,
      bad: '<style>\n  .probe {\n    unknown-probe-property: red;\n  }\n</style>\n',
      good: '<style>\n  .probe {\n    color: red;\n  }\n</style>\n',
    },
    {
      name: 'article Markdown with frontmatter and H2',
      file: 'src/content/posts/probe.md',
      command: 'markdownlint-cli2',
      rule: /MD022/,
      bad: `${articleHeader}## 内容\n正文。\n`,
      good: `${articleHeader}## 内容\n\n正文。\n`,
    },
    {
      name: 'engineering Markdown',
      file: 'docs/probe.md',
      command: 'markdownlint-cli2',
      rule: /MD022/,
      bad: '# 工程样本\n正文。\n',
      good: '# 工程样本\n\n正文。\n',
    },
  ];

  for (const probe of lintProbes) {
    await put(probe.file, probe.bad);
    const failed = run(bin(probe.command), [probe.file]);
    assert.notEqual(
      failed.status,
      0,
      `${probe.name}: bad input unexpectedly passed`,
    );
    assert.match(
      failed.output,
      probe.rule,
      `${probe.name}: wrong failure\n${failed.output}`,
    );
    await put(probe.file, probe.good);
    expectSuccess(
      run(bin(probe.command), [probe.file]),
      `${probe.name}: corrected input`,
    );
    console.log(
      `PASS lint: ${probe.name} (expected rule failed; correction passed)`,
    );
  }

  const formatProbes = [
    [
      'Astro template',
      'src/format.astro',
      '<div class="probe"    >formatted</div>\n',
    ],
    ['TypeScript', 'src/format.ts', 'export const probe={value:1};\n'],
    ['CSS', 'src/format.css', '.probe{color:red}\n'],
    [
      'Astro inline CSS',
      'src/format-style.astro',
      '<style>.probe{color:red}</style>\n',
    ],
    [
      'article Markdown',
      'src/content/posts/format.md',
      `${articleHeader}##    内容\n\n正文。\n`,
    ],
    ['engineering Markdown', 'docs/format.md', '#    工程样本\n\n正文。\n'],
  ];
  for (const [name, file, bad] of formatProbes) {
    await put(file, bad);
    const failed = run(bin('prettier'), ['--check', file]);
    assert.equal(
      failed.status,
      1,
      `${name}: expected a format mismatch\n${failed.output}`,
    );
    assert.ok(
      failed.output.includes(file),
      `${name}: missing file diagnostic\n${failed.output}`,
    );
    expectSuccess(
      run(bin('prettier'), ['--write', file]),
      `${name}: format temporary input`,
    );
    expectSuccess(
      run(bin('prettier'), ['--check', file]),
      `${name}: formatted input`,
    );
    console.log(`PASS format: ${name} (mismatch failed; correction passed)`);
  }

  // Keep the package-manager failure probe away from the node_modules symlink.
  const installDirectory = join(temporary, 'frozen-install');
  await mkdir(installDirectory);
  const manifest = JSON.parse(
    await readFile(join(root, 'package.json'), 'utf8'),
  );
  manifest.dependencies = {
    ...manifest.dependencies,
    astro: '0.0.0-toolchain-probe',
  };
  await writeFile(
    join(installDirectory, 'package.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await copyFile(
    join(root, 'pnpm-lock.yaml'),
    join(installDirectory, 'pnpm-lock.yaml'),
  );
  await copyFile(
    join(root, 'pnpm-workspace.yaml'),
    join(installDirectory, 'pnpm-workspace.yaml'),
  );
  const frozen = run(
    'pnpm',
    ['install', '--frozen-lockfile', '--offline', '--ignore-scripts'],
    installDirectory,
  );
  assert.notEqual(
    frozen.status,
    0,
    'frozen install unexpectedly accepted a mismatched manifest',
  );
  assert.match(
    frozen.output,
    /ERR_PNPM_OUTDATED_LOCKFILE/,
    `wrong install failure\n${frozen.output}`,
  );
  assert.match(
    frozen.output,
    /astro/,
    `failure did not identify the changed dependency\n${frozen.output}`,
  );
  console.log(
    'PASS frozen install: manifest mismatch rejected with ERR_PNPM_OUTDATED_LOCKFILE',
  );

  await put(
    'probe.test.ts',
    `import { expect, test } from 'vitest';
import { parseFragment } from 'parse5';
import postcss from 'postcss';

test('installed HTML and CSS parsers cooperate with Vitest', () => {
  const fragment = parseFragment('<a href="/posts/probe/">Read</a>');
  const anchor = fragment.childNodes[0];
  expect('tagName' in anchor && anchor.tagName).toBe('a');
  expect('attrs' in anchor && anchor.attrs).toContainEqual({ name: 'href', value: '/posts/probe/' });
  const stylesheet = postcss.parse('.probe { color: red }');
  const declarations: string[] = [];
  stylesheet.walkDecls((declaration) => { declarations.push(declaration.prop + ':' + declaration.value); });
  expect(declarations).toEqual(['color:red']);
});
`,
  );
  expectSuccess(
    run(bin('vitest'), ['run', 'probe.test.ts']),
    'Vitest / parse5 / PostCSS startup probe',
  );
  console.log(
    'PASS Vitest: HTML/CSS parser startup probe (not a business test)',
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await rm(temporary, { recursive: true, force: true });
}
