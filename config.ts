import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const get_from_env_or_throw = (name: string) => {
  if (process.env[name]) return process.env[name]!;
  throw new Error(`Missing required config env variable: ${name}`);
};

function resolveBaseUrl(): string {
  const portMapPath = join(process.cwd(), '.worker-ports.json');
  if (existsSync(portMapPath)) {
    try {
      const portMap = JSON.parse(readFileSync(portMapPath, 'utf-8')) as Record<string, number>;
      const workerIndex = process.env['TEST_WORKER_INDEX'] ?? '0';
      const port = portMap[workerIndex];
      if (port) return `http://127.0.0.1:${port}`;
    } catch {
      // fall through to env var
    }
  }
  return get_from_env_or_throw('BASE_URL');
}

export const BASE_URL = resolveBaseUrl();

export const photoprism = {
  username: get_from_env_or_throw('PHOTOPRISM_USERNAME'),
  password: get_from_env_or_throw('PHOTOPRISM_PASSWORD'),
};
