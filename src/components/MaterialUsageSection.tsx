import React, { useEffect, useMemo, useState } from "react";
import type { MaterialItem, UsageRecord, PackDef, BomMap, Unit, BaseUnit } from "../utils/types";
import { load, save, LS_MATERIALS, LS_USAGE, LS_BOM, LS_PACKS, todayISO, monthStartISO, makeId, fmt } from "../utils/helpers";

function MaterialUsageSection() {
  const [materials, setMaterials] = useState<MaterialItem[]>(
    load(LS_MATERIALS, [])
  );
  const [usage, setUsage] = useState<UsageRecord[]>(load(LS_USAGE, []));
  const [bom, setBom] = useState<BomMap>(load(LS_BOM, {}));
  const [packs, setPacks] = useState<PackDef[]>(load(LS_PACKS, []));

  const [name, setName] = useState("مادة خام (مثال: دجاج)");
  const [unit, setUnit] = useState<Unit>("kg");
  const [lastCost, setLastCost] = useState<number>(0);

  const [date, setDate] = useState<string>(todayISO());
  const [materialId, setMaterialId] = useState<string>("");
  const [opening, setOpening] = useState<string>("");
  const [received, setReceived] = useState<number>(0);
  const [closing, setClosing] = useState<number>(0);
  const [recordType, setRecordType] = useState<"use" | "waste">("use"); // New state for type
  const [quantity, setQuantity] = useState<number>(0); // New state for quantity

  const [from, setFrom] = useState<string>(monthStartISO());
  const [to, setTo] = useState<string>(todayISO());
  const [selMaterial, setSelMaterial] = useState<string>("");

  const [bomItemId, setBomItemId] = useState<string>("");
  const [bomMaterialId, setBomMaterialId] = useState<string>("");
  const [bomQty, setBomQty] = useState<number>(0);
  const [bomUnit, setBomUnit] = useState<Unit>("g");

  useEffect(() => save(LS_MATERIALS, materials), [materials]);
  useEffect(() => save(LS_USAGE, usage), [usage]);
  useEffect(() => save(LS_BOM, bom), [bom]);
  useEffect(() => save(LS_PACKS, packs), [packs]);

  const openingAuto = useMemo(() => {
    if (!materialId) return 0;
    const prev = usage
      .filter((r) => r.materialId === materialId && r.date < date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    return prev ? prev.closing : 0;
  }, [usage, materialId, date]);

  const openVal = opening.trim() !== "" ? Number(opening) : openingAuto;
  const used = Math.max(
    0,
    (openVal || 0) + (received || 0) - (closing || 0)
  );
  const sel = materials.find((i) => i.id === materialId);
  const cost = used * (sel?.lastCost ?? 0);

  function addMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert("أدخل اسم المادة");
    const now = new Date().toISOString();
    const mat: MaterialItem = {
      id: makeId(),
      name: name.trim(),
      unit,
      lastCost: Number(lastCost) || 0,
      createdAt: now,
      updatedAt: now,
    };
    setMaterials((p) => [...p, mat]);
    setName("مادة خام (مثال: دجاج)");
    setUnit("kg");
    setLastCost(0);
    if (!materialId) setMaterialId(mat.id);
  }
  function updateMaterial(id: string, patch: Partial<MaterialItem>) {
    setMaterials((p) =>
      p.map((i) =>
        i.id === id
          ? { ...i, ...patch, updatedAt: new Date().toISOString() }
          : i
      )
    );
  }
  function removeMaterial(id: string) {
    if (!confirm("حذف المادة؟")) return;
    setMaterials((p) => p.filter((i) => i.id !== id));
  }
  function addUsage(e: React.FormEvent) {
    e.preventDefault();
    if (!materialId) return alert("اختر المادة");
    if (!date) return alert("أدخل التاريخ");
    if (quantity <= 0) return alert("أدخل كمية صحيحة.");
    const now = new Date().toISOString();
    const rec: UsageRecord = {
      id: makeId(),
      date,
      materialId,
      type: recordType, // Added type
      quantity: Number(quantity), // Added quantity
      opening: opening.trim() !== "" ? Number(opening) : undefined,
      received: Number(received) || 0,
      closing: Number(closing) || 0,
      createdAt: now,
      updatedAt: now,
    };
    setUsage((p) => [rec, ...p]);
    setOpening("");
    setReceived(0);
    setClosing(0);
    setQuantity(0);
  }
  function removeUsage(id: string) {
    if (!confirm("حذف السجل؟")) return;
    setUsage((p) => p.filter((r) => r.id !== id));
  }

  function addPack(e: React.FormEvent) {
    e.preventDefault();
    const id = prompt("أدخل معرف الحزمة (مثال: PKG-BREAD-BUNDLE)");
    if (!id) return;
    const name = prompt("أدخل اسم الحزمة (مثال: ربطة خبز (10 حبات))");
    if (!name) return;
    const baseUnit = prompt("أدخل الوحدة الأساسية (g, ml, piece)") as BaseUnit;
    if (!baseUnit || !["g", "ml", "piece"].includes(baseUnit)) return;
    const qty = Number(prompt("أدخل الكمية في الوحدة الأساسية (مثال: 10)"));
    if (!qty) return;
    const now = new Date().toISOString();
    const pk: PackDef = {
      id: id.toUpperCase(),
      name,
      baseUnit,
      qty,
      createdAt: now,
      updatedAt: now,
    };
    setPacks((p) => [...p, pk]);
  }
  function removePack(id: string) {
    if (!confirm("حذف الحزمة؟")) return;
    setPacks((p) => p.filter((x) => x.id !== id));
  }

  function addBomLine(e: React.FormEvent) {
    e.preventDefault();
    if (!bomItemId || !bomMaterialId || !bomQty || !bomUnit) return;
    setBom((p) => ({
      ...p,
      [bomItemId]: [
        ...(p[bomItemId] || []),
        { materialId: bomMaterialId, qty: bomQty, unit: bomUnit },
      ],
    }));
    setBomMaterialId("");
    setBomQty(0);
    setBomUnit("g");
  }
  function removeBomLine(itemId: string, materialId: string) {
    setBom((p) => ({
      ...p,
      [itemId]: p[itemId].filter((x) => x.materialId !== materialId),
    }));
  }

  const byId = useMemo(
    () => new Map(materials.map((i) => [i.id, i] as const)),
    [materials]
  );
  const filtered = useMemo(() => {
    const f = new Date(from).getTime(),
      t = new Date(to).getTime();
    return usage
      .filter((r) => {
        const tt = new Date(r.date).getTime();
        return (
          tt >= f && tt <= t && (!selMaterial || r.materialId === selMaterial)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [usage, from, to, selMaterial]);

  const totals = useMemo(() => {
    let usedSum = 0,
      costSum = 0;
    filtered.forEach((r) => {
      const it = byId.get(r.materialId);
      const prev = usage
        .filter((x) => x.materialId === r.materialId && x.date < r.date)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const open = r.opening ?? (prev ? prev.closing : 0);
      const u = Math.max(
        0,
        (open || 0) + (r.received || 0) - (r.closing || 0)
      );
      usedSum += u;
      costSum += u * (it?.lastCost ?? 0);
    });
    return { usedSum, costSum };
  }, [filtered, usage, byId]);

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>إدارة المواد الخام (جرد داخلي)</h2>
      <p className="muted" style={{ marginBottom: 12, fontSize: 12 }}>
        سجّل لكل مادة: <b>أول اليوم</b> + <b>الوارد</b> − <b>آخر اليوم</b> ←
        يحسب <b>المستخدم</b> والتكلفة.
      </p>

      {/* إدارة المواد */}
      <div className="responsive-table" style={{ marginBottom: 12 }}>
        <table>
          <thead>
            <tr>
              <th>المادة</th>
              <th>الوحدة</th>
              <th>آخر تكلفة</th>
              <th className="no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="muted"
                  style={{ textAlign: "center", padding: "16px" }}
                >
                  لا توجد مواد بعد.
                </td>
              </tr>
            ) : (
              materials.map((i) => (
                <tr key={i.id}>
                  <td>
                    <input
                      className="input"
                      value={i.name}
                      onChange={(e) =>
                        updateMaterial(i.id, { name: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <select
                      className="select"
                      value={i.unit}
                      onChange={(e) =>
                        updateMaterial(i.id, { unit: e.target.value as Unit })
                      }
                    >
                      <option value="kg">كجم</option>
                      <option value="g">جم</option>
                      <option value="l">لتر</option>
                      <option value="ml">مل</option>
                      <option value="piece">حبة</option>
                      {packs.map((p) => (
                        <option key={p.id} value={`pack:${p.id}`}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      value={i.lastCost}
                      onChange={(e) =>
                        updateMaterial(i.id, {
                          lastCost: Number(e.target.value),
                        })
                      }
                    />
                  </td>
                  <td className="no-print">
                    <button
                      className="btn danger"
                      onClick={() => removeMaterial(i.id)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={addMaterial}
        className="grid grid-4"
        style={{ marginBottom: 16 }}
      >
        <div>
          <label className="muted">اسم المادة</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="muted">الوحدة</label>
          <select
            className="select"
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
          >
            <option value="kg">كجم</option>
            <option value="g">جم</option>
            <option value="l">لتر</option>
            <option value="ml">مل</option>
            <option value="piece">حبة</option>
            {packs.map((p) => (
              <option key={p.id} value={`pack:${p.id}`}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="muted">آخر تكلفة</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={lastCost}
            onChange={(e) => setLastCost(Number(e.target.value))}
          />
        </div>
        <div style={{ alignSelf: "end" }}>
          <button className="btn" type="submit">
            إضافة مادة
          </button>
        </div>
      </form>

      {/* إدارة الحزم */}
      <div className="responsive-table" style={{ marginBottom: 12 }}>
        <table>
          <thead>
            <tr>
              <th>المعرف</th>
              <th>الاسم</th>
              <th>الكمية (بالوحدة الأساسية)</th>
              <th>الوحدة الأساسية</th>
              <th className="no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {packs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="muted"
                  style={{ textAlign: "center", padding: "16px" }}
                >
                  لا توجد حزم بعد.
                </td>
              </tr>
            ) : (
              packs.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.qty}</td>
                  <td>{p.baseUnit}</td>
                  <td className="no-print">
                    <button
                      className="btn danger"
                      onClick={() => removePack(p.id)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button className="btn secondary" onClick={addPack}>
        إضافة حزمة جديدة
      </button>

      {/* نموذج اليوم */}
      <form onSubmit={addUsage} className="grid grid-4">
        <div>
          <label className="muted">التاريخ</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="muted">المادة</label>
          <select
            className="select"
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
          >
            <option value="">اختر...</option>
            {materials.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="muted">النوع</label>
          <select
            className="select"
            value={recordType}
            onChange={(e) => setRecordType(e.target.value as "use" | "waste")}
          >
            <option value="use">استخدام</option>
            <option value="waste">هدر</option>
          </select>
        </div>
        <div>
          <label className="muted">الكمية</label>
          <input
            className="input"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="muted">أول اليوم (اختياري)</label>
          <input
            className="input"
            type="number"
            placeholder={`افتراضي: ${openingAuto}`}
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
          />
        </div>
        <div>
          <label className="muted">الوارد</label>
          <input
            className="input"
            type="number"
            value={received}
            onChange={(e) => setReceived(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="muted">آخر اليوم</label>
          <input
            className="input"
            type="number"
            value={closing}
            onChange={(e) => setClosing(Number(e.target.value))}
          />
        </div>
        <div className="row-actions" style={{ gridColumn: "1 / -1" }}>
          <div className="kpi" style={{ flex: 1 }}>
            <div>
              <div className="muted">المستخدم (محسوب)</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{used}</div>
            </div>
          </div>
          <div className="kpi" style={{ flex: 1 }}>
            <div>
              <div className="muted">التكلفة</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {fmt(cost)}
              </div>
            </div>
          </div>
          <button className="btn" type="submit">
            إضافة سجل
          </button>
        </div>
      </form>

      {/* سجلات اليوم */}
      <div className="responsive-table" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>المادة</th>
              <th>النوع</th>
              <th>الكمية</th>
              <th>أول اليوم</th>
              <th>الوارد</th>
              <th>آخر اليوم</th>
              <th>المستخدم</th>
              <th>التكلفة</th>
              <th className="no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="muted"
                  style={{ textAlign: "center", padding: "16px" }}
                >
                  لا توجد سجلات بعد.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const it = byId.get(r.materialId);
                const prev = usage
                  .filter((x) => x.materialId === r.materialId && x.date < r.date)
                  .sort((a, b) => b.date.localeCompare(a.date))[0];
                const open = r.opening ?? (prev ? prev.closing : 0);
                const u = Math.max(
                  0,
                  (open || 0) + (r.received || 0) - (r.closing || 0)
                );
                return (
                  <tr key={r.id}>
                    <td data-label="التاريخ">{r.date}</td>
                    <td data-label="المادة">{it?.name}</td>
                    <td data-label="النوع">{r.type === "use" ? "استخدام" : "هدر"}</td>
                    <td data-label="الكمية">{r.quantity}</td>
                    <td data-label="أول اليوم">
                      {r.opening ?? (prev ? prev.closing : "-")}
                    </td>
                    <td data-label="الوارد">{r.received}</td>
                    <td data-label="آخر اليوم">{r.closing}</td>
                    <td data-label="المستخدم">{u}</td>
                    <td data-label="التكلفة">
                      {fmt(u * (it?.lastCost ?? 0))}
                    </td>
                    <td className="no-print">
                      <button
                        className="btn danger"
                        onClick={() => removeUsage(r.id)}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ملخص الفترة */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="header">
          <h3 style={{ margin: 0 }}>ملخص الفترة</h3>
          <div className="header-actions">
            <label className="muted">من</label>
            <input
              className="input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <label className="muted">إلى</label>
            <input
              className="input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <select
              className="select"
              value={selMaterial}
              onChange={(e) => setSelMaterial(e.target.value)}
            >
              <option value="">كل المواد</option>
              {materials.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-4">
          <div className="kpi">
            <div>
              <div className="muted">إجمالي المستخدم</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {totals.usedSum}
              </div>
            </div>
          </div>
          <div className="kpi">
            <div>
              <div className="muted">إجمالي التكلفة</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {fmt(totals.costSum)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* إدارة قائمة المواد (BOM) */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>إدارة قائمة المواد (BOM)</h3>
        <p className="muted" style={{ marginBottom: 12, fontSize: 12 }}>
          حدد المواد الخام المطلوبة لكل منتج نهائي (حزمة).
        </p>
        <form onSubmit={addBomLine} className="grid grid-4">
          <div>
            <label className="muted">المنتج (حزمة)</label>
            <select
              className="select"
              value={bomItemId}
              onChange={(e) => setBomItemId(e.target.value)}
            >
              <option value="">اختر حزمة...</option>
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="muted">المادة الخام</label>
            <select
              className="select"
              value={bomMaterialId}
              onChange={(e) => setBomMaterialId(e.target.value)}
            >
              <option value="">اختر مادة...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="muted">الكمية</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={bomQty}
              onChange={(e) => setBomQty(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="muted">الوحدة</label>
            <select
              className="select"
              value={bomUnit}
              onChange={(e) => setBomUnit(e.target.value as Unit)}
            >
              <option value="g">جم</option>
              <option value="ml">مل</option>
              <option value="piece">حبة</option>
              <option value="kg">كجم</option>
              <option value="l">لتر</option>
            </select>
          </div>
          <div style={{ gridColumn: "span 4 / span 4", textAlign: "right" }}>
            <button className="btn" type="submit">
              إضافة مكون
            </button>
          </div>
        </form>

        {Object.keys(bom).length === 0 ? (
          <p className="muted" style={{ textAlign: "center", marginTop: 16 }}>
            لا توجد قوائم مواد (BOM) بعد.
          </p>
        ) : (
          Object.entries(bom).map(([itemId, lines]) => {
            const item = packs.find((p) => p.id === itemId);
            return (
              <div key={itemId} className="card" style={{ marginTop: 16 }}>
                <h4 style={{ marginTop: 0 }}>{item?.name || itemId}</h4>
                <div className="responsive-table">
                  <table>
                    <thead>
                      <tr>
                        <th>المادة الخام</th>
                        <th>الكمية</th>
                        <th>الوحدة</th>
                        <th className="no-print">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, idx) => {
                        const material = materials.find(
                          (m) => m.id === line.materialId
                        );
                        return (
                          <tr key={idx}>
                            <td>{material?.name}</td>
                            <td>{line.qty}</td>
                            <td>{line.unit}</td>
                            <td className="no-print">
                              <button
                                className="btn danger"
                                onClick={() =>
                                  removeBomLine(itemId, line.materialId)
                                }
                              >
                                حذف
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default MaterialUsageSection;

