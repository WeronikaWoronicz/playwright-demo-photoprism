export function getAdminAuthPath(workerIndex: number | string): string {
  return `playwright/.auth/adminState-worker-${workerIndex}.json`;
}

export function getUserAuthPath(workerIndex: number | string): string {
  return `playwright/.auth/userState-worker-${workerIndex}.json`;
}
