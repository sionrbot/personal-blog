import { lstat, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { glob, type Loader } from 'astro/loaders';
import { assertUniquePostIds, slugFromFilename } from './posts';

export async function validatePostDirectory(directory: URL): Promise<void> {
  const stat = await lstat(fileURLToPath(directory).replace(/\/$/, '')).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    },
  );
  if (!stat) return; // No real article yet is a valid empty collection.
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(
      `Invalid post directory: ${directory.pathname}; expected a real directory`,
    );
  }
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || entry.isSymbolicLink()) {
      throw new Error(
        `Invalid post entry: ${entry.name}; expected a top-level regular .md file`,
      );
    }
    slugFromFilename(entry.name);
  }
  assertUniquePostIds(
    entries.map((entry) => ({ id: slugFromFilename(entry.name) })),
  );
}

export function postLoader(): Loader {
  const loader = glob({
    base: './src/content/posts',
    pattern: '*.md',
    generateId: ({ entry }) => slugFromFilename(entry),
  });
  return {
    name: 'validated-posts',
    async load(context) {
      await validatePostDirectory(
        new URL('./src/content/posts/', context.config.root),
      );
      await loader.load(context);
      assertUniquePostIds(context.store.values());
      // Astro's glob logs Markdown render errors instead of rejecting load().
      // Do not let an invalid body (including a draft) become a successful build.
      for (const entry of context.store.values()) {
        if (!entry.rendered)
          throw new Error(`Invalid post body: ${entry.filePath}`);
      }
    },
  };
}
