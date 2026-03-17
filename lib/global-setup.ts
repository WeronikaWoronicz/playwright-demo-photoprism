import type { FullConfig } from '@playwright/test';
import { startWorkerContainers, stopAllKnownWorkers, waitForHealthy, writePortMap } from './docker-worker.js';

export default async function globalSetup(config: FullConfig): Promise<void> {
  if (process.env['PLAYWRIGHT_DOCKER_WORKERS'] !== 'true') {
    return;
  }

  const workerCount = config.workers ?? 4;
  if (workerCount < 4) {
    console.warn(`Warning: workers=${workerCount} — recommended minimum is 4 for meaningful parallel isolation`);
  }

  await stopAllKnownWorkers();

  const portMap = await startWorkerContainers(workerCount);
  writePortMap(portMap);

  await Promise.all(Object.values(portMap).map((port) => waitForHealthy(port)));

  for (const [index, port] of Object.entries(portMap)) {
    console.log(`Worker ${index}: http://127.0.0.1:${port}`);
  }
}
