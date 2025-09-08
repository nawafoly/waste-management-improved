import React, { useEffect, useMemo, useState } from "react";
import type { CountItem, CountRecord } from "../utils/types";
import { load, save, LS_COUNT_ITEMS, LS_COUNT_RECORDS, todayISO, monthStartISO, makeId, fmt } from "../utils/helpers";

// نوع جديد لقوالب الأسعار
interface PriceTemplate {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  createdAt: string;
}

const LS_PRICE_TEMPLATES = "priceTemplates";

// قوالب افتراضية للأسعار
const defaultTemplates: PriceTemplate[] = [
  { id: "1", name: "شاورما عربي", price: 15, cost: 8, category: "وجبات", createdAt: new Date().toISOString() },
  { id: "2", name: "شاورما لحم", price: 18, cost: 10, category: "وجبات", createdAt: new Date().toISOString() },
  { id: "3", name: "فلافل", price: 8, cost: 4, category: "وجبات", createdAt: new Date().toISOString() },
  { id: "4", name: "عصير طبيعي", price: 12, cost: 5, category: "مشروبات", createdAt: new Date().toISOString() },
  { id: "5", name: "مياه معدنية", price: 3, cost: 1.5, category: "مشروبات", createdAt: new Date().toISOString() },
];

function InventoryCountsSection() {
  const [items, setItems] = useState<CountItem[]>(load(LS_COUNT_ITEMS, []));
  const [records, setRecords] = useState<CountRecord[]>(
    load(LS_COUNT_RECORDS, [])
  );
  const [priceTemplates, setPriceTemplates] = useState<PriceTemplate[]>(
    load(LS_PRICE_TEMPLATES, defaultTemplates)
  );

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  // حقول قالب جديد
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplatePrice, setNewTemplatePrice] = useState<number>(0);
  const [newTemplateCost, setNewTemplateCost] = useState<number>(0);
  const [newTemplateCategory, setNewTemplateCategory] = useState("وجبات");

  const [date, setDate] = useState<string>(todayISO());
  const [itemId, setItemId] = useState<string>("");
  const [opening, setOpening] = useState<string>("");
  const [additions, setAdditions] = useState<number>(0);
  const [closing, setClosing] = useState<number>(0);
  const [waste, setWaste] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  const [from, setFrom] = useState<string>(monthStartISO());
  const [to, setTo] = useState<string>(todayISO());
  const [selItem, setSelItem] = useState<string>("");

  useEffect(() => save(LS_COUNT_ITEMS, items), [items]);
  useEffect(() => save(LS_COUNT_RECORDS, records), [records]);
  useEffect(() => save(LS_PRICE_TEMPLATES, priceTemplates), [priceTemplates]);

  const openingAuto = useMemo(() => {
    if (!itemId) return 0;
    const prev = records
      .filter((r) => r.countItemId === itemId && r.date < date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    return prev ? prev.closing : 0;
  }, [records, itemId, date]);

  const openVal = opening.trim() !== "" ? Number(opening) : openingAuto;
  const sold = Math.max(
    0,
    (openVal || 0) + (additions || 0) - (closing || 0) - (waste || 0)
  );
  const sel = items.find((i) => i.id === itemId);
  const revenue = sold * (sel?.price ?? 0);
  const cogs = sold * (sel?.cost ?? 0);

  // تطبيق قالب السعر المحدد
  const applyTemplate = (templateId: string) => {
    const template = priceTemplates.find(t => t.id === templateId);
    if (template) {
      setName(template.name);
      setPrice(template.price);
      setCost(template.cost);
    }
  };

  // إضافة قالب جديد
  const addTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return alert("أدخل اسم القالب");
    
    const template: PriceTemplate = {
      id: makeId(),
      name: newTemplateName.trim(),
      price: Number(newTemplatePrice) || 0,
      cost: Number(newTemplateCost) || 0,
      category: newTemplateCategory,
      createdAt: new Date().toISOString(),
    };
    
    setPriceTemplates(prev => [...prev, template]);
    setNewTemplateName("");
    setNewTemplatePrice(0);
    setNewTemplateCost(0);
    setShowTemplateForm(false);
  };

  // حذف قالب
  const removeTemplate = (id: string) => {
    if (!confirm("حذف القالب؟")) return;
    setPriceTemplates(prev => prev.filter(t => t.id !== id));
  };

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert("أدخل اسم المنتج");
    const now = new Date().toISOString();
    const it: CountItem = {
      id: makeId(),
      name: name.trim(),
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      createdAt: now,
      updatedAt: now,
    };
    setItems((p) => [...p, it]);
    
    // حفظ كقالب جديد إذا لم يكن موجوداً
    const existingTemplate = priceTemplates.find(t => 
      t.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (!existingTemplate && name.trim() && price > 0) {
      const template: PriceTemplate = {
        id: makeId(),
        name: name.trim(),
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        category: "منتجات مخصصة",
        createdAt: now,
      };
      setPriceTemplates(prev => [...prev, template]);
    }
    
    setName("");
    setPrice(0);
    setCost(0);
    setSelectedTemplate("");
    if (!itemId) setItemId(it.id);
  }

  function updateItem(id: string, patch: Partial<CountItem>) {
    setItems((p) =>
      p.map((i) =>
        i.id === id
          ? { ...i, ...patch, updatedAt: new Date().toISOString() }
          : i
      )
    );
  }

  function removeItem(id: string) {
    if (!confirm("حذف المنتج؟")) return;
    setItems((p) => p.filter((i) => i.id !== id));
  }

  function addRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId) return alert("اختر المنتج");
    if (!date) return alert("أدخل التاريخ");
    const now = new Date().toISOString();
    const rec: CountRecord = {
      id: makeId(),
      date,
      countItemId: itemId,
      opening: opening.trim() !== "" ? Number(opening) : undefined,
      additions: Number(additions) || 0,
      closing: Number(closing) || 0,
      waste: Number(waste) || 0,
      notes: notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      quantity: sold,
    };
    setRecords((p) => [rec, ...p]);
    setOpening("");
    setAdditions(0);
    setClosing(0);
    setWaste(0);
    setNotes("");
  }

  function removeRecord(id: string) {
    if (!confirm("حذف السجل؟")) return;
    setRecords((p) => p.filter((r) => r.id !== id));
  }

  const byId = useMemo(
    () => new Map(items.map((i) => [i.id, i] as const)),
    [items]
  );

  const filtered = useMemo(() => {
    const f = new Date(from).getTime(),
      t = new Date(to).getTime();
    return records
      .filter((r) => {
        const tt = new Date(r.date).getTime();
        return tt >= f && tt <= t && (!selItem || r.countItemId === selItem);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, from, to, selItem]);

  const totals = useMemo(() => {
    let soldSum = 0,
      rev = 0,
      cg = 0;
    filtered.forEach((r) => {
      const it = byId.get(r.countItemId);
      const prev = records
        .filter((x) => x.countItemId === r.countItemId && x.date < r.date)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const open = r.opening ?? (prev ? prev.closing : 0);
      const s = Math.max(
        0,
        (open || 0) + (r.additions || 0) - (r.closing || 0) - (r.waste || 0)
      );
      soldSum += s;
      rev += s * (it?.price ?? 0);
      cg += s * (it?.cost ?? 0);
    });
    return { soldSum, rev, cg, pr: rev - cg };
  }, [filtered, records, byId]);

  // تجميع القوالب حسب الفئة
  const templatesByCategory = useMemo(() => {
    const grouped: { [key: string]: PriceTemplate[] } = {};
    priceTemplates.forEach(template => {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    });
    return grouped;
  }, [priceTemplates]);

  return (
    <section className="card">
      <h2 className="section-title">إدارة البيع (عدّ داخلي)</h2>
      <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
        سجّل لكل منتج: <b>أول اليوم</b> + <b>المضافة</b> − <b>آخر اليوم</b> −{" "}
        <b>التالف</b> ← يحسب <b>المباع</b> والقيمة والتكلفة.
      </p>

      {/* قسم قوالب الأسعار */}
      <div className="card" style={{ marginBottom: 20, background: '#F0FDF4' }}>
        <div className="card-header">
          <h3 className="card-title">⚡ قوالب الأسعار السريعة</h3>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">اختر قالب جاهز:</label>
          <select 
            className="select" 
            value={selectedTemplate}
            onChange={(e) => {
              setSelectedTemplate(e.target.value);
              if (e.target.value) applyTemplate(e.target.value);
            }}
          >
            <option value="">-- اختر قالب أو أدخل يدوياً --</option>
            {Object.entries(templatesByCategory).map(([category, templates]) => (
              <optgroup key={category} label={category}>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.price} ر.س (تكلفة: {template.cost})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 16 }}>
          <button 
            type="button" 
            className="btn secondary"
            onClick={() => setShowTemplateForm(!showTemplateForm)}
          >
            {showTemplateForm ? '❌ إلغاء' : '➕ إضافة قالب جديد'}
          </button>
        </div>

        {showTemplateForm && (
          <form onSubmit={addTemplate} className="card" style={{ background: '#FFFFFF' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>إضافة قالب جديد</h4>
            <div className="grid grid-2" style={{ marginBottom: 12 }}>
              <div>
                <label className="form-label">اسم القالب:</label>
                <input
                  className="input"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="مثال: برجر دجاج"
                />
              </div>
              <div>
                <label className="form-label">الفئة:</label>
                <select 
                  className="select"
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                >
                  <option value="وجبات">وجبات</option>
                  <option value="مشروبات">مشروبات</option>
                  <option value="حلويات">حلويات</option>
                  <option value="منتجات مخصصة">منتجات مخصصة</option>
                </select>
              </div>
            </div>
            <div className="grid grid-2" style={{ marginBottom: 12 }}>
              <div>
                <label className="form-label">سعر البيع:</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={newTemplatePrice}
                  onChange={(e) => setNewTemplatePrice(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="form-label">تكلفة الوحدة:</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={newTemplateCost}
                  onChange={(e) => setNewTemplateCost(Number(e.target.value))}
                />
              </div>
            </div>
            <button type="submit" className="btn">حفظ القالب</button>
          </form>
        )}

        {/* عرض القوالب الموجودة */}
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 12px 0' }}>القوالب المحفوظة:</h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            {Object.entries(templatesByCategory).map(([category, templates]) => (
              <div key={category}>
                <h5 style={{ margin: '8px 0 4px 0', color: '#059669' }}>{category}</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {templates.map(template => (
                    <div key={template.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      background: '#FFFFFF',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <span>{template.name}</span>
                      <span className="muted">({template.price} ر.س)</span>
                      <button 
                        type="button"
                        onClick={() => removeTemplate(template.id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#DC2626', 
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* إضافة منتج جديد */}
      <form onSubmit={addItem} className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">➕ إضافة منتج جديد</h3>
        <div className="grid grid-3" style={{ marginBottom: 12 }}>
          <div>
            <label className="form-label">اسم المنتج:</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: شاورما عربي"
            />
          </div>
          <div>
            <label className="form-label">سعر البيع:</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="form-label">تكلفة الوحدة:</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
            />
          </div>
        </div>
        <button type="submit" className="btn">إضافة المنتج</button>
      </form>

      {/* إدارة المنتجات */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">📋 المنتجات المسجلة</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>سعر البيع</th>
                <th>تكلفة الوحدة</th>
                <th>الربح</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted" style={{ textAlign: "center", padding: "20px" }}>
                    لا توجد منتجات بعد. استخدم القوالب السريعة أو أضف منتج جديد.
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <input
                        className="input"
                        value={i.name}
                        onChange={(e) =>
                          updateItem(i.id, { name: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={i.price}
                        onChange={(e) =>
                          updateItem(i.id, { price: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={i.cost}
                        onChange={(e) =>
                          updateItem(i.id, { cost: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td style={{ 
                      color: (i.price - i.cost) > 0 ? '#059669' : '#DC2626',
                      fontWeight: 'bold'
                    }}>
                      {fmt(i.price - i.cost)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn danger"
                        onClick={() => removeItem(i.id)}
                        style={{ fontSize: '12px', padding: '6px 10px' }}
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
      </div>

      {/* باقي المكون كما هو... */}
      {/* سجل جديد */}
      <form onSubmit={addRecord} className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">📝 تسجيل جرد يومي</h3>
        <div className="grid grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label className="form-label">التاريخ:</label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">المنتج:</label>
            <select
              className="select"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              <option value="">-- اختر المنتج --</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-4" style={{ marginBottom: 12 }}>
          <div>
            <label className="form-label">أول اليوم:</label>
            <input
              className="input"
              type="number"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder={`تلقائي: ${openingAuto}`}
            />
          </div>
          <div>
            <label className="form-label">المضافة:</label>
            <input
              className="input"
              type="number"
              value={additions}
              onChange={(e) => setAdditions(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="form-label">آخر اليوم:</label>
            <input
              className="input"
              type="number"
              value={closing}
              onChange={(e) => setClosing(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="form-label">التالف:</label>
            <input
              className="input"
              type="number"
              value={waste}
              onChange={(e) => setWaste(Number(e.target.value))}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="form-label">ملاحظات:</label>
          <textarea
            className="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات اختيارية..."
            rows={2}
          />
        </div>

        {/* معاينة النتائج */}
        {itemId && (
          <div className="alert success" style={{ marginBottom: 12 }}>
            <strong>معاينة:</strong> المباع: {sold} | الإيراد: {fmt(revenue)} | التكلفة: {fmt(cogs)} | الربح: {fmt(revenue - cogs)}
          </div>
        )}

        <button type="submit" className="btn">حفظ السجل</button>
      </form>

      {/* فلترة وعرض السجلات */}
      <div className="card">
        <h3 className="card-title">📊 السجلات والتقارير</h3>
        
        <div className="grid grid-3" style={{ marginBottom: 16 }}>
          <div>
            <label className="form-label">من تاريخ:</label>
            <input
              className="input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">إلى تاريخ:</label>
            <input
              className="input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">فلترة بالمنتج:</label>
            <select
              className="select"
              value={selItem}
              onChange={(e) => setSelItem(e.target.value)}
            >
              <option value="">-- جميع المنتجات --</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ملخص الإجماليات */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-value">{totals.soldSum}</div>
            <div className="stat-label">إجمالي المباع</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{fmt(totals.rev)}</div>
            <div className="stat-label">إجمالي الإيراد</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{fmt(totals.cg)}</div>
            <div className="stat-label">إجمالي التكلفة</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{fmt(totals.pr)}</div>
            <div className="stat-label">صافي الربح</div>
          </div>
        </div>

        {/* جدول السجلات */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>المنتج</th>
                <th>أول اليوم</th>
                <th>المضافة</th>
                <th>آخر اليوم</th>
                <th>التالف</th>
                <th>المباع</th>
                <th>الإيراد</th>
                <th>الربح</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="muted" style={{ textAlign: "center", padding: "20px" }}>
                    لا توجد سجلات في الفترة المحددة.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const it = byId.get(r.countItemId);
                  const prev = records
                    .filter((x) => x.countItemId === r.countItemId && x.date < r.date)
                    .sort((a, b) => b.date.localeCompare(a.date))[0];
                  const open = r.opening ?? (prev ? prev.closing : 0);
                  const s = Math.max(
                    0,
                    (open || 0) + (r.additions || 0) - (r.closing || 0) - (r.waste || 0)
                  );
                  const rev = s * (it?.price ?? 0);
                  const cg = s * (it?.cost ?? 0);
                  return (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{it?.name || "غير معروف"}</td>
                      <td>{open}</td>
                      <td>{r.additions}</td>
                      <td>{r.closing}</td>
                      <td>{r.waste}</td>
                      <td style={{ fontWeight: 'bold' }}>{s}</td>
                      <td style={{ color: '#059669', fontWeight: 'bold' }}>{fmt(rev)}</td>
                      <td style={{ color: rev - cg > 0 ? '#059669' : '#DC2626', fontWeight: 'bold' }}>
                        {fmt(rev - cg)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn danger"
                          onClick={() => removeRecord(r.id)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
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
      </div>
    </section>
  );
}

export default InventoryCountsSection;

