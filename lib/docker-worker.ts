import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import * as http from 'http';
import { join } from 'path';

export type WorkerPortMap = Record<number, number>;

const BASE_PORT = 12342;
const composePath = join(process.cwd(), 'sut', 'compose.worker.yml');

export async function startWorkerContainers(workerCount: number): Promise<WorkerPortMap> {
  const portMap: WorkerPortMap = {};
  for (let i = 0; i < workerCount; i++) {
    portMap[i] = BASE_PORT + i;
  }

  await Promise.all(
    Array.from({ length: workerCount }, (_, i) => {
      const port = portMap[i] as number;
      return Promise.resolve(
        execSync(`docker compose -f "${composePath}" -p pw-worker-${i} up -d`, {
          stdio: 'pipe',
          env: { ...process.env, WORKER_INDEX: String(i), WORKER_PORT: String(port) },
        })
      );
    })
  );

  return portMap;
}

export async function stopWorkerContainers(workerCount: number): Promise<void> {
  await Promise.all(
    Array.from({ length: workerCount }, (_, i) =>
      Promise.resolve().then(() => {
        try {
          execSync(`docker compose -f "${composePath}" -p pw-worker-${i} down -v`, {
            stdio: 'pipe',
          });
        } catch {}
      })
    )
  );
}

function checkHealth(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    http
      .get(`http://127.0.0.1:${port}/api/v1/status`, (res) => {
        resolve(res.statusCode === 200);
        res.resume();
      })
      .on('error', () => resolve(false));
  });
}

export async function waitForHealthy(port: number, timeoutMs = 120000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkHealth(port)) return;
    await new Promise<void>((r) => setTimeout(r, 2000));
  }
  throw new Error(`PhotoPrism on port ${port} did not become healthy within ${timeoutMs}ms`);
}

export function writePortMap(portMap: WorkerPortMap): void {
  writeFileSync(join(process.cwd(), '.worker-ports.json'), JSON.stringify(portMap));
}

export function cleanupPortMap(): void {
  const p = join(process.cwd(), '.worker-ports.json');
  if (existsSync(p)) unlinkSync(p);
}
