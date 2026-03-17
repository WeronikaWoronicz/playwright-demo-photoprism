import { stopWorkerContainers, cleanupPortMap } from './docker-worker.js';
import { existsSync, rmSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export default async function globalTeardown(): Promise<void> {
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
        rmSync(join(sutDir, entry), { recursive: true, force: true });
      }
    }
  }
}
