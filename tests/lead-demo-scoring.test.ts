import { describe, expect, it } from 'vitest';
import {
  BUILDING_CACHE,
  COVERAGE,
  classifyIntent,
  detectComuna,
  scoreLead,
} from '../src/scripts/lead-demo-scoring';

describe('detectComuna', () => {
  it('finds a covered comuna mentioned anywhere in the message', () => {
    expect(detectComuna('Necesito fibra en Las Condes, dpto 803')).toBe('las condes');
  });

  it('returns null when no known comuna is mentioned', () => {
    expect(detectComuna('hola, quiero información')).toBeNull();
  });

  it('is case- and position-insensitive', () => {
    expect(detectComuna('PROVIDENCIA es mi comuna')).toBe('providencia');
  });
});

describe('classifyIntent', () => {
  it('classifies urgency and contract words as high intent', () => {
    expect(classifyIntent('necesito instalar urgente para teletrabajo')).toBe('high');
  });

  it('classifies price questions as medium intent', () => {
    expect(classifyIntent('hola, cuánto cuesta el plan?')).toBe('medium');
  });

  it('falls back to low intent for vague messages', () => {
    expect(classifyIntent('hola, info porfa')).toBe('low');
  });
});

describe('scoreLead — mirrors the real pipeline order', () => {
  it('feasible address + high intent → HOT', () => {
    const r = scoreLead('Necesito instalar fibra urgente en Las Condes, dpto 803');
    expect(r.tier).toBe('HOT');
    expect(r.feasible).toBe(true);
    expect(r.comuna).toBe('las condes');
  });

  it('feasible address + price question → WARM', () => {
    const r = scoreLead('Cuánto cuesta el plan? Vivo en Providencia');
    expect(r.tier).toBe('WARM');
    expect(r.intent).toBe('medium');
  });

  it('no coverage → UNFEASIBLE and intent classification is skipped (saves the GPT call)', () => {
    const r = scoreLead('Quiero contratar urgente en Melipilla');
    expect(r.tier).toBe('UNFEASIBLE');
    expect(r.feasible).toBe(false);
    expect(r.intent).toBe('skipped');
  });

  it('no address → cannot check feasibility; high intent caps at WARM and flags needsAddress', () => {
    const r = scoreLead('necesito contratar urgente');
    expect(r.tier).toBe('WARM');
    expect(r.feasible).toBeNull();
    expect(r.needsAddress).toBe(true);
  });

  it('no address + vague message → COLD', () => {
    const r = scoreLead('hola, info');
    expect(r.tier).toBe('COLD');
    expect(r.needsAddress).toBe(true);
  });

  it('building-level cache hit reports ~30ms; miss reports ~3s', () => {
    const hit = scoreLead('urgente en Las Condes');
    const miss = scoreLead('urgente en Ñuñoa');
    expect(BUILDING_CACHE.has('las condes')).toBe(true);
    expect(BUILDING_CACHE.has('ñuñoa')).toBe(false);
    expect(hit.cached).toBe(true);
    expect(hit.feasibilityMs).toBe(30);
    expect(miss.cached).toBe(false);
    expect(miss.feasibilityMs).toBe(3000);
  });

  it('coverage map stays consistent with the demo copy', () => {
    expect(COVERAGE['las condes']).toBe('covered');
    expect(COVERAGE['melipilla']).toBe('none');
  });
});
