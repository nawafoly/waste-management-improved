import { useMemo } from "react";
import { load, LS_COUNT_ITEMS, LS_COUNT_RECORDS, LS_MATERIALS, LS_USAGE, fmt } from "../utils/helpers";
import type { CountItem, CountRecord, MaterialItem, UsageRecord } from "../utils/types";

function StickyHeader() {
  const countItems = load<CountItem[]>(LS_COUNT_ITEMS, []);
  const countRecords = load<CountRecord[]>(LS_COUNT_RECORDS, []);
  const materialItems = load<MaterialItem[]>(LS_MATERIALS, []);
  const usageRecords = load<UsageRecord[]>(LS_USAGE, []);

  const summary = useMemo(() => {
    // حساب إجمالي المبيعات
    const totalSales = countRecords.reduce((sum, record) => {
      const item = countItems.find(i => i.id === record.countItemId);
      return sum + (item ? record.quantity * item.price : 0);
    }, 0);

    // حساب إجمالي التكاليف
    const totalCosts = countRecords.reduce((sum, record) => {
      const item = countItems.find(i => i.id === record.countItemId);
      return sum + (item ? record.quantity * item.cost : 0);
    }, 0);

    // حساب إجمالي الهدر
    const totalWaste = usageRecords.reduce((sum, record) => {
      if (record.type === "waste") {
        const material = materialItems.find(m => m.id === record.materialId);
        return sum + (material ? record.quantity * material.lastCost : 0);
      }
      return sum;
    }, 0);

    // حساب الربح
    const totalProfit = totalSales - totalCosts;

    return {
      sales: totalSales,
      costs: totalCosts,
      profit: totalProfit,
      waste: totalWaste,
    };
  }, [countItems, countRecords, materialItems, usageRecords]);

  return (
    <div className="sticky-header">
      <div className="sticky-summary">
        <div className="summary-item">
          <span className="summary-label">المبيعات</span>
          <span className="summary-value">{fmt(summary.sales)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">التكاليف</span>
          <span className="summary-value">{fmt(summary.costs)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">الربح</span>
          <span className="summary-value profit">{fmt(summary.profit)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">الهدر</span>
          <span className="summary-value waste">{fmt(summary.waste)}</span>
        </div>
      </div>
    </div>
  );
}

export default StickyHeader;

