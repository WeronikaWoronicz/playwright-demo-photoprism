import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import * as http from 'http';
import { join } from 'path';

const execAsync = promisify(exec);

export type WorkerPortMap = Record<string, number>;

const BASE_PORT = 12342;
const composePath = join(process.cwd(), 'sut', 'compose.worker.yml');

export async function startWorkerContainers(workerCount: number): Promise<WorkerPortMap> {
  const portMap: WorkerPortMap = {};
  for (let i = 0; i < workerCount; i++) {
    portMap[String(i)] = BASE_PORT + i;
  }

  await Promise.all(
    Array.from({ length: workerCount }, (_, i) => {
      const port = portMap[String(i)] as number;
      return execAsync(`docker compose -f "${composePath}" -p pw-worker-${i} up -d`, {
        env: { ...process.env, WORKER_INDEX: String(i), WORKER_PORT: String(port) },
      });
    })
  );

  return portMap;
}

export async function stopWorkerContainers(workerCount: number): Promise<void> {
  await Promise.all(
    Array.from({ length: workerCount }, (_, i) =>
      execAsync(`docker compose -f "${composePath}" -p pw-worker-${i} down -v`).catch(() => {})
    )
  );
}

export async function stopAllKnownWorkers(): Promise<void> {
  let names: string[] = [];
  try {
    const { stdout } = await execAsync('docker compose ls --format json --all');
    const projects = JSON.parse(stdout) as Array<{ Name: string }>;
    names = projects.map((p) => p.Name).filter((n) => /^pw-worker-\d+$/.test(n));
  } catch {}
  await Promise.all(
    names.map((name) => execAsync(`docker compose -f "${composePath}" -p "${name}" down -v`).catch(() => {}))
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
