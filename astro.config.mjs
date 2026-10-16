import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkPosts from './src/lib/remark-posts.mjs';

const repository = process.env.GITHUB_REPOSITORY ?? 'sionrbot/personal-blog';
const bases = {
  'sionrbot/personal-blog': '/personal-blog',
  'sionrbot/personal-blog-acceptance': '/personal-blog-acceptance',
};
if (!(repository in bases))
  throw new Error(`Unrecognized deployment repository: ${repository}`);

export default defineConfig({
  site: 'https://sionrbot.github.io',
  base: bases[repository],
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  server: { host: '127.0.0.1' },
  vite: { cacheDir: './.cache/vite' },
  markdown: {
    processor: unified({
      remarkPlugins: [[remarkPosts, { base: bases[repository] }]],
    }),
  },
});
