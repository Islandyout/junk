import { describe, expect, it } from "vitest";
import { calculateDamage } from "./combatMath";

describe("calculateDamage", () => {
  it("applies power, defence and multiplier in a predictable order", () => {
    expect(calculateDamage({ base: 30, power: 10, defence: 5, multiplier: 1.2 })).toBe(42);
  });

  it("applies the critical multiplier after defence", () => {
    expect(calculateDamage({ base: 30, power: 10, defence: 5, critical: true })).toBe(53);
  });

  it("never returns negative damage", () => {
    expect(calculateDamage({ base: 5, power: 0, defence: 90 })).toBe(0);
  });

  it("safely handles invalid numeric input", () => {
    expect(calculateDamage({ base: Number.NaN, power: 10, defence: 0 })).toBe(10);
  });
});