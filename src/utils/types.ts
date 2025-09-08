export type BaseUnit = "g" | "ml" | "piece";
export type Unit = "kg" | "g" | "l" | "ml" | "piece" | `pack:${string}`;

export type PackDef = {
  id: string;
  name: string;
  baseUnit: BaseUnit;
  qty: number;
  createdAt: string;
  updatedAt: string;
};

export type CountItem = {
  id: string;
  name: string;
  price: number;
  cost: number;
  createdAt: string;
  updatedAt: string;
};

export type CountRecord = {
  id: string;
  date: string;
  countItemId: string;
  opening?: number;
  additions: number;
  closing: number;
  waste: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  quantity: number;
};

export type MaterialItem = {
  id: string;
  name: string;
  unit: Unit;
  lastCost: number;
  createdAt: string;
  updatedAt: string;
};

export type UsageRecord = {
  id: string;
  date: string;
  materialId: string;
  type: "use" | "waste";
  quantity: number;
  opening?: number;
  received: number;
  closing: number;
  createdAt: string;
  updatedAt: string;
};

export type BomLine = { materialId: string; qty: number; unit: Unit };
export type BomMap = Record<string, BomLine[]>;

// أنواع إضافية للميزات الجديدة
export type ExpenseCategory = {
  id: string;
  name: string;
  monthlyBudget?: number;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseRecord = {
  id: string;
  date: string;
  categoryId: string;
  amount: number;
  description: string;
  isRecurring?: boolean;
  recurringInterval?: "monthly" | "weekly" | "daily";
  createdAt: string;
  updatedAt: string;
};

export type SupplierPrice = {
  id: string;
  supplierId: string;
  materialId: string;
  price: number;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type Supplier = {
  id: string;
  name: string;
  contact?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

