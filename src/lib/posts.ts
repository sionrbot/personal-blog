import { z } from 'astro/zod';

export function isDateOnly(value: string): boolean {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= days[month - 1];
}

export const postSchema = z.strictObject({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  pubDate: z
    .string()
    .refine(isDateOnly, 'Expected a real YYYY-MM-DD date (0001–9999)'),
  draft: z.boolean(),
});

export function slugFromFilename(filename: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(filename)) {
    throw new Error(
      `Invalid post filename: ${filename}; expected lowercase flat kebab-case.md`,
    );
  }
  return filename.slice(0, -3);
}

export function assertUniquePostIds(entries: Iterable<{ id: string }>): void {
  const seen = new Set<string>();
  for (const { id } of entries) {
    if (seen.has(id)) throw new Error(`Duplicate post id: ${id}`);
    seen.add(id);
  }
}

export function isPublished(post: { data: { draft: boolean } }): boolean {
  return post.data.draft === false;
}
