// Pure scoring logic for the interactive Lead Scoring demo embedded in the
// case study. This is a SIMULATION of the production pipeline's decision
// order (feasibility → intent → tier) using static rules — no GPT calls.
// Kept pure and framework-free so it can be unit-tested and imported from
// the Astro component's client script.

export type Tier = 'HOT' | 'WARM' | 'COLD' | 'UNFEASIBLE';
export type Intent = 'high' | 'medium' | 'low' | 'skipped';

export interface ScoreResult {
  tier: Tier;
  /** Detected comuna (normalized) or null when the message has no address. */
  comuna: string | null;
  /** null = could not check (no address in message). */
  feasible: boolean | null;
  /** Building-level cache hit, as in the real 60-day cache. */
  cached: boolean;
  /** Simulated feasibility lookup latency: 30ms cached, 3000ms on miss. */
  feasibilityMs: number;
  intent: Intent;
  needsAddress: boolean;
}

/** Mock coverage map. Mirrors the demo copy — keep both in sync. */
export const COVERAGE: Record<string, 'covered' | 'none'> = {
  'las condes': 'covered',
  providencia: 'covered',
  ñuñoa: 'covered',
  vitacura: 'covered',
  'santiago centro': 'covered',
  melipilla: 'none',
  lampa: 'none',
};

/** Buildings already resolved within the 60-day cache window. */
export const BUILDING_CACHE = new Set(['las condes', 'providencia', 'vitacura']);

const HIGH_INTENT = [
  'urgente',
  'contratar',
  'instalar',
  'teletrabajo',
  'necesito',
  'cuándo pueden',
  'cuando pueden',
];
const MEDIUM_INTENT = ['precio', 'plan', 'cuánto', 'cuanto', 'cuesta', 'valor', 'tarifa'];

export function detectComuna(message: string): string | null {
  const normalized = message.toLowerCase();
  for (const comuna of Object.keys(COVERAGE)) {
    if (normalized.includes(comuna)) return comuna;
  }
  return null;
}

export function classifyIntent(message: string): Exclude<Intent, 'skipped'> {
  const normalized = message.toLowerCase();
  if (HIGH_INTENT.some((kw) => normalized.includes(kw))) return 'high';
  if (MEDIUM_INTENT.some((kw) => normalized.includes(kw))) return 'medium';
  return 'low';
}

export function scoreLead(message: string): ScoreResult {
  const comuna = detectComuna(message);
  const cached = comuna !== null && BUILDING_CACHE.has(comuna);
  const feasibilityMs = cached ? 30 : 3000;

  // Feasibility gate runs FIRST: an unfeasible lead skips intent entirely
  // (in production this is what saves ~38% of GPT calls).
  if (comuna && COVERAGE[comuna] === 'none') {
    return {
      tier: 'UNFEASIBLE',
      comuna,
      feasible: false,
      cached,
      feasibilityMs,
      intent: 'skipped',
      needsAddress: false,
    };
  }

  const intent = classifyIntent(message);

  if (!comuna) {
    // Can't verify coverage → the bot would auto-ask for the address.
    // Without feasibility, even a high-intent lead caps at WARM.
    return {
      tier: intent === 'high' ? 'WARM' : 'COLD',
      comuna: null,
      feasible: null,
      cached: false,
      feasibilityMs: 0,
      intent,
      needsAddress: true,
    };
  }

  const tier: Tier = intent === 'high' ? 'HOT' : intent === 'medium' ? 'WARM' : 'COLD';
  return {
    tier,
    comuna,
    feasible: true,
    cached,
    feasibilityMs,
    intent,
    needsAddress: false,
  };
}
