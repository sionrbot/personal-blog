import { rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

for (const path of ['dist', '.astro', 'node_modules/.vite']) {
  await rm(path, { recursive: true, force: true });
}
const result = spawnSync('pnpm', ['exec', 'astro', 'build'], {
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
