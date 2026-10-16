/** Apply the deployment base to an authored logical-root URL exactly once. */
export function withBase(path: string, base: string): string {
  const prefix = base === '/' ? '' : base.replace(/\/$/, '');
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error(`Expected a logical-root URL: ${path}`);
  }
  return `${prefix}${path}`;
}

export function postUrl(id: string, base: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    throw new Error(`Invalid post id: ${id}`);
  return withBase(`/posts/${id}/`, base);
}
