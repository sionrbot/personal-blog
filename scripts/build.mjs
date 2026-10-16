import { rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

for (const path of ['dist', '.astro', '.cache/vite']) {
  await rm(path, { recursive: true, force: true });
}
const cli = fileURLToPath(
  new URL('./bin/astro.mjs', import.meta.resolve('astro/package.json')),
);
const result = spawnSync(process.execPath, [cli, 'build'], {
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
