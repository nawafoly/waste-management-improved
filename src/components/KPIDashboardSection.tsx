import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { load, LS_COUNT_ITEMS, LS_COUNT_RECORDS, LS_MATERIALS, LS_USAGE, fmt } from "../utils/helpers";
import type { CountItem, CountRecord, MaterialItem, UsageRecord } from "../utils/types";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function KPIDashboardSection() {
  const countItems = load<CountItem[]>(LS_COUNT_ITEMS, []);
  const countRecords = load<CountRecord[]>(LS_COUNT_RECORDS, []);
  const materialItems = load<MaterialItem[]>(LS_MATERIALS, []);
  const usageRecords = load<UsageRecord[]>(LS_USAGE, []);

  // COGS %
  const cogsPercentage = useMemo(() => {
    const totalSalesRevenue = countRecords.reduce((sum, record) => {
      const item = countItems.find(i => i.id === record.countItemId);
      return sum + (item ? record.quantity * item.price : 0);
    }, 0);

    const totalCostOfGoodsSold = countRecords.reduce((sum, record) => {
      const item = countItems.find(i => i.id === record.countItemId);
      return sum + (item ? record.quantity * item.cost : 0);
    }, 0);

    if (totalSalesRevenue === 0) return 0;
    return (totalCostOfGoodsSold / totalSalesRevenue) * 100;
  }, [countItems, countRecords]);

  // Top 5 Most Profitable Products
  const top5ProfitableProducts = useMemo(() => {
    const productProfit: { [key: string]: number } = {};
    countRecords.forEach(record => {
      const item = countItems.find(i => i.id === record.countItemId);
      if (item) {
        const profit = record.quantity * (item.price - item.cost);
        productProfit[item.name] = (productProfit[item.name] || 0) + profit;
      }
    });
    return Object.entries(productProfit)
      .sort(([, profitA], [, profitB]) => profitB - profitA)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value })); // Format for Recharts
  }, [countItems, countRecords]);

  // Most Wasted Materials
  const mostWastedMaterials = useMemo(() => {
    const materialWaste: { [key: string]: number } = {};
    usageRecords.forEach(record => {
      const material = materialItems.find(m => m.id === record.materialId);
      if (material && record.type === "waste") {
        materialWaste[material.name] = (materialWaste[material.name] || 0) + record.quantity;
      }
    });
    return Object.entries(materialWaste)
      .sort(([, wasteA], [, wasteB]) => wasteB - wasteA)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value })); // Format for Recharts
  }, [materialItems, usageRecords]);

  // Waste Rate per Material
  const wasteRatePerMaterial = useMemo(() => {
    const materialUsage: { [key: string]: { totalUsed: number; totalWaste: number } } = {};
    usageRecords.forEach(record => {
      const material = materialItems.find(m => m.id === record.materialId);
      if (material) {
        if (!materialUsage[material.name]) {
          materialUsage[material.name] = { totalUsed: 0, totalWaste: 0 };
        }
        if (record.type === "use") {
          materialUsage[material.name].totalUsed += record.quantity;
        } else if (record.type === "waste") {
          materialUsage[material.name].totalWaste += record.quantity;
        }
      }
    });

    const rates: { material: string; rate: number }[] = [];
    Object.entries(materialUsage).forEach(([materialName, data]) => {
      if (data.totalUsed > 0) {
        rates.push({
          material: materialName,
          rate: (data.totalWaste / data.totalUsed) * 100,
        });
      }
    });
    return rates.sort((a, b) => b.rate - a.rate);
  }, [materialItems, usageRecords]);

  // Top 5 Selling Products/Services
  const top5SellingProducts = useMemo(() => {
    const productSales: { [key: string]: number } = {};
    countRecords.forEach(record => {
      const item = countItems.find(i => i.id === record.countItemId);
      if (item) {
        productSales[item.name] = (productSales[item.name] || 0) + record.quantity;
      }
    });
    return Object.entries(productSales)
      .sort(([, quantityA], [, quantityB]) => quantityB - quantityA)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value })); // Format for Recharts
  }, [countItems, countRecords]);

  // Monthly Performance Comparison (Current vs Previous Month)
  const monthlyPerformance = useMemo(() => {
    const currentMonthSales = countRecords.reduce((sum, record) => {
      const recordDate = new Date(record.date);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
        const item = countItems.find(i => i.id === record.countItemId);
        return sum + (item ? record.quantity * item.price : 0);
      }
      return sum;
    }, 0);

    const previousMonthSales = countRecords.reduce((sum, record) => {
      const recordDate = new Date(record.date);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
      }
      if (recordDate.getMonth() === prevMonth && recordDate.getFullYear() === prevYear) {
        const item = countItems.find(i => i.id === record.countItemId);
        return sum + (item ? record.quantity * item.price : 0);
      }
      return sum;
    }, 0);

    return {
      currentMonthSales,
      previousMonthSales,
      salesGrowth: previousMonthSales === 0 ? 0 : ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100,
    };
  }, [countItems, countRecords]);

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>لوحة مؤشرات الأداء الرئيسية (KPIs)</h2>
      <p className="muted" style={{ marginBottom: 12, fontSize: 12 }}>
        مؤشرات أداء رئيسية لربحية وكفاءة العمليات.
      </p>

      <div className="grid grid-2">
        <div className="kpi">
          <div>
            <div className="muted">نسبة التكلفة للمبيعات (COGS %)</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(cogsPercentage)}%</div>
          </div>
        </div>
        <div className="kpi">
          <div>
            <div className="muted">نمو المبيعات الشهرية</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(monthlyPerformance.salesGrowth)}%</div>
            <p className="muted" style={{ fontSize: 12 }}>
              الشهر الحالي: {fmt(monthlyPerformance.currentMonthSales)} | الشهر السابق: {fmt(monthlyPerformance.previousMonthSales)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>أفضل 5 منتجات ربحًا</h3>
          {top5ProfitableProducts.length === 0 ? (
            <p className="muted">لا توجد بيانات كافية.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={top5ProfitableProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {top5ProfitableProducts.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => fmt(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>أفضل 5 منتجات مبيعًا</h3>
          {top5SellingProducts.length === 0 ? (
            <p className="muted">لا توجد بيانات كافية.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={top5SellingProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} وحدة`} />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>المواد الأكثر هدرًا</h3>
          {mostWastedMaterials.length === 0 ? (
            <p className="muted">لا توجد بيانات كافية.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mostWastedMaterials}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} وحدة`} />
                <Legend />
                <Bar dataKey="value" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>معدل الهدر لكل مادة</h3>
          <ol>
            {wasteRatePerMaterial.length === 0 ? (
              <li className="muted">لا توجد بيانات كافية.</li>
            ) : (
              wasteRatePerMaterial.map(({ material, rate }) => (
                <li key={material}>{material}: {fmt(rate)}%</li>
              ))
            )}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default KPIDashboardSection;

