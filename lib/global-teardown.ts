import { stopWorkerContainers, cleanupPortMap } from './docker-worker.js';
import { existsSync, rmSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export default async function globalTeardown(): Promise<void> {
  if (process.env['PLAYWRIGHT_DOCKER_WORKERS'] !== 'true') {
    return;
  }

  let workerCount = 1;

  const portMapPath = join(process.cwd(), '.worker-ports.json');
  if (existsSync(portMapPath)) {
    const raw = JSON.parse(readFileSync(portMapPath, 'utf-8')) as Record<string, number>;
    workerCount = Object.keys(raw).length;
  } else if (process.env['WORKER_COUNT']) {
    workerCount = parseInt(process.env['WORKER_COUNT'], 10) || 1;
  }

  await stopWorkerContainers(workerCount);
  cleanupPortMap();

  const sutDir = join(process.cwd(), 'sut');
  if (existsSync(sutDir)) {
    const prefixes = ['originals-worker-', 'storage-worker-', 'database-worker-'];
    for (const entry of readdirSync(sutDir)) {
      if (prefixes.some((p) => entry.startsWith(p))) {
        try {
          rmSync(join(sutDir, entry), { recursive: true, force: true });
        } catch {
          try {
            execSync(`docker run --rm -v "${join(sutDir, entry)}:/todel" alpine sh -c "rm -rf /todel"`, {
              stdio: 'pipe',
            });
          } catch {}
        }
      }
    }
  }
}
