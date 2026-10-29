import type { Api } from './Api';
import { createLocalApi } from './LocalApi';
import { demoOverride, now } from '~/lib/clock';

export type * from './Api';

let api: Api | null = null;

/** Demo clock override, kept for callers that need to know whether one is active. */
export function demoNow(): number | null {
  return demoOverride();
}

/** The app-wide Api. Swap with setApi() when a real backend exists. */
export function getApi(): Api {
  return (api ??= createLocalApi({ now }));
}

export function setApi(next: Api): void {
  api = next;
}
