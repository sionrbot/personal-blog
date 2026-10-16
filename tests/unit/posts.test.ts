import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertUniquePostIds,
  isDateOnly,
  isPublished,
  postSchema,
  slugFromFilename,
} from '../../src/lib/posts';

const validPost = {
  title: 'Synthetic title',
  description: 'Synthetic description for rule tests.',
  pubDate: '2024-02-29',
  draft: true,
};

describe('post metadata contract', () => {
  it('trims text, preserves date-only values, and accepts both boolean states', () => {
    expect(
      postSchema.parse({
        ...validPost,
        title: '  Title  ',
        description: '\nSummary\t',
      }),
    ).toEqual({
      title: 'Title',
      description: 'Summary',
      pubDate: '2024-02-29',
      draft: true,
    });
    expect(postSchema.parse({ ...validPost, draft: false }).draft).toBe(false);
  });

  it.each(['title', 'description', 'pubDate', 'draft'] as const)(
    'requires %s',
    (field) => {
      const input: Record<string, unknown> = { ...validPost };
      delete input[field];
      const result = postSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success)
        expect(
          result.error.issues.some((issue) => issue.path[0] === field),
        ).toBe(true);
    },
  );

  it.each([
    ['title', 123],
    ['description', false],
    ['pubDate', new Date('2024-02-29T00:00:00Z')],
    ['draft', 'false'],
    ['draft', 'true'],
    ['draft', 0],
    ['draft', null],
  ])('rejects wrong type for %s: %s', (field, value) => {
    expect(
      postSchema.safeParse({ ...validPost, [field as string]: value }).success,
    ).toBe(false);
  });

  it.each(['title', 'description'] as const)(
    'rejects empty or whitespace-only %s',
    (field) => {
      for (const value of ['', ' ', '\n\t']) {
        expect(
          postSchema.safeParse({ ...validPost, [field]: value }).success,
        ).toBe(false);
      }
    },
  );

  it('rejects unknown keys and validates malformed drafts as strictly as published posts', () => {
    expect(
      postSchema.safeParse({ ...validPost, slug: 'custom-url' }).success,
    ).toBe(false);
    for (const draft of [true, false]) {
      expect(
        postSchema.safeParse({ ...validPost, pubDate: '2026-02-30', draft })
          .success,
      ).toBe(false);
    }
  });

  it('keeps future dates valid without changing the explicit publication state', () => {
    for (const draft of [true, false]) {
      const data = postSchema.parse({
        ...validPost,
        pubDate: '9999-12-31',
        draft,
      });
      expect(data.pubDate).toBe('9999-12-31');
      expect(isPublished({ data })).toBe(!draft);
    }
  });

  it('ships a template with explicit draft true and a quoted date placeholder', () => {
    const template = readFileSync(
      new URL('../../templates/post.md', import.meta.url),
      'utf8',
    );
    expect(template).toMatch(/^---\n/);
    expect(template).toMatch(/^draft: true$/m);
    expect(template).toMatch(/^pubDate: ['"]YYYY-MM-DD['"]$/m);
    expect(template).toMatch(/^title:/m);
    expect(template).toMatch(/^description:/m);
    expect(template).toMatch(/^## /m);
  });
});

describe('date-only calendar validation', () => {
  it.each([
    '0001-01-01',
    '1900-02-28',
    '2000-02-29',
    '2024-02-29',
    '2026-04-30',
    '9999-12-31',
  ])('accepts %s without normalization', (value) => {
    expect(isDateOnly(value)).toBe(true);
    expect(postSchema.parse({ ...validPost, pubDate: value }).pubDate).toBe(
      value,
    );
  });

  it.each([
    '0000-01-01',
    '10000-01-01',
    '1900-02-29',
    '2100-02-29',
    '2026-02-29',
    '2026-02-30',
    '2026-04-31',
    '2026-00-01',
    '2026-13-01',
    '2026-01-00',
    '2026-01-32',
    '2026-2-01',
    '2026-02-1',
    ' 2026-02-01',
    '2026-02-01 ',
    '2026-02-01T00:00:00Z',
    '2026/02/01',
    '',
  ])('rejects %s', (value) => {
    expect(isDateOnly(value)).toBe(false);
    expect(postSchema.safeParse({ ...validPost, pubDate: value }).success).toBe(
      false,
    );
  });

  it.each(['UTC', 'Asia/Singapore', 'America/Los_Angeles'])(
    'preserves the exact date in a separate process under %s',
    (timezone) => {
      const moduleUrl = new URL('../../src/lib/posts.ts', import.meta.url).href;
      const source = `
        const { postSchema, isDateOnly } = await import(${JSON.stringify(moduleUrl)});
        const dates = ['0001-01-01', '2024-02-29', '2026-03-08', '2026-11-01', '9999-12-31'];
        const parsed = dates.map(pubDate => postSchema.parse({ title: 'Fixture', description: 'Fixture', pubDate, draft: true }).pubDate);
        process.stdout.write(JSON.stringify({ dates: parsed, invalid: isDateOnly('2026-02-30') }));
      `;
      const output = execFileSync(
        process.execPath,
        ['--input-type=module', '-e', source],
        {
          encoding: 'utf8',
          env: { ...process.env, TZ: timezone },
        },
      );
      expect(JSON.parse(output)).toEqual({
        dates: [
          '0001-01-01',
          '2024-02-29',
          '2026-03-08',
          '2026-11-01',
          '9999-12-31',
        ],
        invalid: false,
      });
    },
  );
});

describe('flat filename identifiers', () => {
  it.each([
    ['post.md', 'post'],
    ['why-this-blog.md', 'why-this-blog'],
    ['2026-01.md', '2026-01'],
  ])('derives %s from the filename', (filename, expected) =>
    expect(slugFromFilename(filename)).toBe(expected),
  );

  it.each([
    'Title.md',
    'post.MD',
    'post.mdx',
    'post.txt',
    '.hidden.md',
    'nested/post.md',
    '../post.md',
    'post_name.md',
    'post--name.md',
    '-post.md',
    'post-.md',
    'post name.md',
    '文章.md',
    '.md',
  ])('rejects %s explicitly', (filename) => {
    expect(() => slugFromFilename(filename)).toThrow('Invalid post filename');
  });

  it('rejects duplicate in-memory identifiers and accepts unique or empty collections', () => {
    expect(() => assertUniquePostIds([{ id: 'same' }, { id: 'same' }])).toThrow(
      'Duplicate post id: same',
    );
    expect(() =>
      assertUniquePostIds([{ id: 'first' }, { id: 'second' }]),
    ).not.toThrow();
    expect(() => assertUniquePostIds([])).not.toThrow();
  });
});
