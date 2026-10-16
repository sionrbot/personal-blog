import { describe, expect, it } from 'vitest';
import { postUrl, withBase } from '../../src/lib/urls';
import remarkPosts, { transformPostUrl } from '../../src/lib/remark-posts.mjs';

describe('logical-root URL helpers', () => {
  it.each([
    ['/', '/', '/'],
    ['/', '/personal-blog/', '/personal-blog/'],
    ['/posts/stable-id/', '/', '/posts/stable-id/'],
    [
      '/posts/stable-id/#section',
      '/personal-blog/',
      '/personal-blog/posts/stable-id/#section',
    ],
  ])('resolves %s under %s', (path, base, expected) =>
    expect(withBase(path, base)).toBe(expected),
  );

  it.each(['relative', '../post', 'https://example.com', '//example.com'])(
    'rejects non-logical path %s',
    (path) => {
      expect(() => withBase(path, '/personal-blog/')).toThrow();
    },
  );

  it('creates the fixed filename-based URL independently of article title', () => {
    expect(postUrl('stable-id', '/')).toBe('/posts/stable-id/');
    expect(postUrl('stable-id', '/personal-blog/')).toBe(
      '/personal-blog/posts/stable-id/',
    );
    expect(() => postUrl('Bad Id', '/')).toThrow();
    expect(() => postUrl('../post', '/')).toThrow();
  });
});

describe('Markdown URL conversion', () => {
  it.each([
    ['/', '/personal-blog/'],
    ['/#intro', '/personal-blog/#intro'],
    ['/posts/hello-world/', '/personal-blog/posts/hello-world/'],
    [
      '/posts/hello-world/#%E4%B8%AD%E6%96%87',
      '/personal-blog/posts/hello-world/#%E4%B8%AD%E6%96%87',
    ],
    [
      '/post-assets/hello-world/photo.png',
      '/personal-blog/post-assets/hello-world/photo.png',
    ],
    ['/shared/logo.svg', '/personal-blog/shared/logo.svg'],
    ['#intro', '#intro'],
    ['#', '#'],
    ['https://example.com/posts/hello/', 'https://example.com/posts/hello/'],
    ['mailto:author@example.com', 'mailto:author@example.com'],
    ['tel:+6512345678', 'tel:+6512345678'],
  ])('converts %s exactly once', (input, expected) => {
    expect(transformPostUrl(input, '/personal-blog/')).toBe(expected);
  });

  it('preserves logical URLs when deployed at the origin root', () => {
    expect(transformPostUrl('/posts/hello-world/', '/')).toBe(
      '/posts/hello-world/',
    );
    expect(transformPostUrl('/shared/photo.png', '/', true)).toBe(
      '/shared/photo.png',
    );
  });

  it.each([
    '/personal-blog/posts/hello/',
    'hello.md',
    '../hello.md',
    './image.png',
    'posts/hello/',
    '/posts/Hello/',
    '/posts/hello',
    '//example.com',
    'http://example.com',
    'javascript:alert(1)',
    'file:///tmp/file',
    'data:text/plain,hello',
    'blob:example',
    '/shared/../secret.png',
    '/shared/%2e%2e/secret.png',
    '/shared/%5csecret.png',
    '/shared/%00.png',
    '/shared/%zz.png',
    'https://user:password@example.com',
    '/shared/has space.png',
  ])('rejects unsupported or ambiguous author URL %s', (input) => {
    expect(() => transformPostUrl(input, '/personal-blog/')).toThrow();
  });

  it.each([
    'https://example.com/photo.png',
    'mailto:author@example.com',
    'tel:123',
    '#section',
    '/posts/hello/',
  ])('rejects a non-local image URL %s', (input) =>
    expect(() => transformPostUrl(input, '/', true)).toThrow(),
  );

  it('accepts local image assets with the deployment base', () => {
    expect(
      transformPostUrl('/post-assets/hello/photo.png', '/personal-blog/', true),
    ).toBe('/personal-blog/post-assets/hello/photo.png');
  });
});

type Node = {
  type: string;
  depth?: number;
  identifier?: string;
  url?: string;
  children?: Node[];
};

function transformTree(children: Node[]) {
  const tree = { type: 'root', children };
  remarkPosts({ base: '/personal-blog/' })(tree, {
    fail(message: string) {
      throw new Error(message);
    },
  });
  return tree;
}

describe('remark post contract', () => {
  it('converts both ordinary links and local images in the tree', () => {
    const tree = transformTree([
      { type: 'link', url: '/posts/hello/' },
      { type: 'image', url: '/shared/photo.png' },
    ]);
    expect(tree.children.map((node) => node.url)).toEqual([
      '/personal-blog/posts/hello/',
      '/personal-blog/shared/photo.png',
    ]);
  });

  it.each([true, false])(
    'supports image references regardless of definition order: before=%s',
    (before) => {
      const definition = {
        type: 'definition',
        identifier: 'photo',
        url: '/shared/photo.png',
      };
      const reference = { type: 'imageReference', identifier: 'photo' };
      transformTree(before ? [definition, reference] : [reference, definition]);
      expect(definition.url).toBe('/personal-blog/shared/photo.png');
    },
  );

  it('rejects remote reference images as well as inline images', () => {
    expect(() =>
      transformTree([
        { type: 'imageReference', identifier: 'remote' },
        {
          type: 'definition',
          identifier: 'remote',
          url: 'https://example.com/photo.png',
        },
      ]),
    ).toThrow();
  });

  it('accepts H2, nested headings and returning to a higher level', () => {
    expect(() =>
      transformTree(
        [2, 3, 4, 2, 3].map((depth) => ({ type: 'heading', depth })),
      ),
    ).not.toThrow();
  });

  it.each([[1], [3], [2, 4]])('rejects heading depths %s', (...depths) => {
    expect(() =>
      transformTree(depths.map((depth) => ({ type: 'heading', depth }))),
    ).toThrow('headings');
  });

  it('rejects raw HTML', () => {
    expect(() => transformTree([{ type: 'html' }])).toThrow('Raw HTML');
  });
});
