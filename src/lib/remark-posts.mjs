import { withBase } from './urls.ts';

// Authored links use logical paths. Existing hosted absolute URLs are preserved
// for the later artifact checker to verify against the actual deployment base.
export function transformPostUrl(value, base, image = false) {
  if (/\s|\\/.test(value)) throw new Error(`Invalid Markdown URL: ${value}`);
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw new Error(`Invalid URL encoding: ${value}`);
  }
  if (
    decoded.split(/[/?#]/).some((part) => part === '.' || part === '..') ||
    decoded.includes('\\') ||
    [...decoded].some((character) => character.codePointAt(0) < 32)
  ) {
    throw new Error(`Invalid URL path: ${value}`);
  }
  if (value.startsWith('#') && !image) return value;
  if (/^https:\/\//.test(value) && !image) {
    const url = new URL(value);
    if (!url.hostname || url.username || url.password)
      throw new Error(`Invalid HTTPS URL: ${value}`);
    return value;
  }
  if (/^(mailto|tel):\S+$/.test(value) && !image) return value;
  const page = /^(?:\/|\/posts\/[a-z0-9]+(?:-[a-z0-9]+)*\/)(?:#[^\s]*)?$/;
  const asset =
    /^\/(?:post-assets\/[a-z0-9]+(?:-[a-z0-9]+)*|shared)\/[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+$/;
  if ((!image && page.test(value)) || asset.test(value))
    return withBase(value, base);
  throw new Error(
    `Unsupported Markdown URL: ${value}; use a logical-root page or local asset URL`,
  );
}

export default function remarkPosts({ base }) {
  return (tree, file) => {
    let previousDepth = 1;
    const definitions = new Map();
    function visit(node) {
      if (node.type === 'definition')
        definitions.set(node.identifier, node.url);
      for (const child of node.children ?? []) visit(child);
    }
    visit(tree);
    function transform(node) {
      try {
        if (node.type === 'html')
          throw new Error('Raw HTML is not allowed in post Markdown');
        if (node.type === 'heading') {
          if (node.depth < 2 || node.depth > previousDepth + 1) {
            throw new Error(
              'Post headings must start at H2 and must not skip levels',
            );
          }
          previousDepth = node.depth;
        }
        if (node.type === 'imageReference') {
          const definition = definitions.get(node.identifier);
          if (definition) transformPostUrl(definition, base, true);
        }
        if (['link', 'image', 'definition'].includes(node.type)) {
          node.url = transformPostUrl(node.url, base, node.type === 'image');
        }
      } catch (error) {
        file.fail(error.message, node);
      }
      for (const child of node.children ?? []) transform(child);
    }
    transform(tree);
  };
}
