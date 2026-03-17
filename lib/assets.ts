import { join } from 'path';

export function createPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}
