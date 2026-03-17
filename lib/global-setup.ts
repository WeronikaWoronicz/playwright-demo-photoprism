import type { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { startWorkerContainers, stopWorkerContainers, waitForHealthy, writePortMap } from './docker-worker.js';

function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  if (!isDockerAvailable()) {
    console.log('Docker not available — running in single-instance mode');
    return;
  }

  const workerCount = config.workers ?? 1;

  try {
    await stopWorkerContainers(workerCount);
  } catch {}

  const portMap = await startWorkerContainers(workerCount);
  writePortMap(portMap);

  await Promise.all(Object.values(portMap).map((port) => waitForHealthy(port)));

  for (const [index, port] of Object.entries(portMap)) {
    console.log(`Worker ${index}: http://127.0.0.1:${port}`);
  }
}
