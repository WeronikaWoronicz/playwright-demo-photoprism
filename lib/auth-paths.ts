export function getAdminAuthPath(workerIndex: number | string): string {
  return `playwright/.auth/adminState-worker-${workerIndex}.json`;
}
