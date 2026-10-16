import { defineCollection } from 'astro:content';
import { postLoader } from './lib/post-loader';
import { postSchema } from './lib/posts';

export const collections = {
  posts: defineCollection({ loader: postLoader(), schema: postSchema }),
};
