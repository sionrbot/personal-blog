import { spawnSync } from 'node:child_process';

// Stage gate through R1-02; the complete R1-06 verify is not implemented yet.
for (const command of [
  'format:check',
  'lint',
  'check',
  'test:toolchain',
  'test:unit',
  'test:integration',
  'build',
  'test:e2e:bootstrap',
]) {
  const result = spawnSync('pnpm', [command], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
