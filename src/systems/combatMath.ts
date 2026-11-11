export interface DamageInput {
  base: number;
  power: number;
  defence: number;
  multiplier?: number;
  critical?: boolean;
}

export function calculateDamage(input: DamageInput): number {
  const base = Number.isFinite(input.base) ? Math.max(0, input.base) : 0;
  const power = Number.isFinite(input.power) ? Math.max(0, input.power) : 0;
  const defence = Number.isFinite(input.defence) ? Math.max(0, input.defence) : 0;
  const multiplier = Number.isFinite(input.multiplier ?? 1)
    ? Math.max(0, input.multiplier ?? 1)
    : 1;
  const critical = input.critical === true ? 1.5 : 1;
  return Math.max(0, Math.round((base + power - defence) * multiplier * critical));
}