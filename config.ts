import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const get_from_env_or_throw = (name: string) => {
  if (process.env[name]) return process.env[name]!;
  throw new Error(`Missing required config env variable: ${name}`);
};

function readPortMap(): Record<string, number> | null {
  const portMapPath = join(process.cwd(), '.worker-ports.json');
  if (!existsSync(portMapPath)) return null;
  try {
    return JSON.parse(readFileSync(portMapPath, 'utf-8')) as Record<string, number>;
  } catch {
    return null;
  }
}

export function getWorkerBaseUrl(workerIndex: number): string {
  const portMap = readPortMap();
  if (portMap) {
    const port = portMap[String(workerIndex)];
    if (port) return `http://127.0.0.1:${port}`;
  }
  return process.env['BASE_URL'] ?? 'http://127.0.0.1:2342';
}

function resolveBaseUrl(): string {
  const portMap = readPortMap();
  if (portMap) {
    const port = portMap[process.env['TEST_PARALLEL_INDEX'] ?? '0'];
    if (port) return `http://127.0.0.1:${port}`;
  }
  return get_from_env_or_throw('BASE_URL');
}

export const BASE_URL = resolveBaseUrl();

export const photoprism = {
  username: get_from_env_or_throw('PHOTOPRISM_USERNAME'),
  password: get_from_env_or_throw('PHOTOPRISM_PASSWORD'),
};

const __CI_GATE_FAILURE__: string = 1;
