import type { Unit, BaseUnit, PackDef } from './types';

// =============== التخزين ===============
export const LS_PACKS = "waves/unit_packs";
export const LS_COUNT_ITEMS = "waves/count_items";
export const LS_COUNT_RECORDS = "waves/count_records";
export const LS_MATERIALS = "waves/material_items";
export const LS_USAGE = "waves/usage_records";
export const LS_BOM = "waves/bom_map";
export const LS_ONBOARD = "waves/onboard_done";

export function load<T>(k: string, fb: T): T {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : fb;
  } catch {
    return fb;
  }
}
export function save<T>(k: string, v: T) {
  localStorage.setItem(k, JSON.stringify(v));
}

// =============== وحدات/تحويلات ===============
const MASS_TO_G: Record<"kg" | "g", number> = { kg: 1000, g: 1 };
const VOL_TO_ML: Record<"l" | "ml", number> = { l: 1000, ml: 1 };
export const isPack = (u: Unit): u is `pack:${string}` =>
  typeof u === "string" && u.startsWith("pack:");
export const unitFamily = (u: Unit | BaseUnit): BaseUnit =>
  u === "g" || u === "kg" ? "g" : u === "ml" || u === "l" ? "ml" : "piece";

export function loadPacks(): PackDef[] {
  try {
    const r = localStorage.getItem(LS_PACKS);
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}
export function savePacks(p: PackDef[]) {
  localStorage.setItem(LS_PACKS, JSON.stringify(p));
}
export function seedPacks() {
  if (loadPacks().length) return;
  const now = new Date().toISOString();
  savePacks([
    {
      id: "PKG-BREAD-BUNDLE",
      name: "ربطة خبز (10 حبات)",
      baseUnit: "piece",
      qty: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "PKG-FRIES-BOX",
      name: "علبة بطاطس 2.5كجم",
      baseUnit: "g",
      qty: 2500,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "PKG-GAL-XL",
      name: "جالون كبير 3.78L",
      baseUnit: "ml",
      qty: 3780,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "PKG-GAL-S",
      name: "جالون صغير 2.0L",
      baseUnit: "ml",
      qty: 2000,
      createdAt: now,
      updatedAt: now,
    },
  ]);
}
export function toBase(qty: number, unit: Unit, packs: PackDef[]) {
  if (isPack(unit)) {
    const pk = packs.find((p) => `pack:${p.id}` === unit);
    if (!pk) throw new Error("Pack not found");
    return { qty: qty * pk.qty, unit: pk.baseUnit as BaseUnit };
  }
  if (unit === "kg" || unit === "g")
    return { qty: qty * MASS_TO_G[unit], unit: "g" as BaseUnit };
  if (unit === "l" || unit === "ml")
    return { qty: qty * VOL_TO_ML[unit], unit: "ml" as BaseUnit };
  return { qty, unit: "piece" as BaseUnit };
}

// =============== أدوات عامة ===============
export const fmt = (num: number): string => {
  return new Intl.NumberFormat("ar-SA", { 
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(num);
};

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const monthStartISO = () =>
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
export const makeId = () =>
  (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  ).toUpperCase();

