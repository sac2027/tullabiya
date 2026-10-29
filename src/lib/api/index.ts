import type { Api } from './Api';
import { createLocalApi } from './LocalApi';

export type * from './Api';

let api: Api | null = null;

/** The app-wide Api. Swap with setApi() when a real backend exists. */
export function getApi(): Api {
  return (api ??= createLocalApi());
}

export function setApi(next: Api): void {
  api = next;
}
