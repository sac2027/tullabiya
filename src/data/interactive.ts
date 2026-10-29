// The small slice of content the browser needs for the simulated backend.
// Raw JSON, validated at build time by src/data/index.ts, so islands skip zod.
import polls from './polls.json';
import hunts from './hunts.json';
import community from './community.json';
import type { Community, Hunt, Poll } from '~/lib/model';

export const POLLS = polls as unknown as Poll[];
export const HUNTS = hunts as unknown as Hunt[];
export const COMMUNITY = community as unknown as Community;
