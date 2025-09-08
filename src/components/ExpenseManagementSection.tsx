import React, { useEffect, useMemo, useState } from "react";
import { load, save, makeId, todayISO, monthStartISO, fmt } from "../utils/helpers";

interface ExpenseItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  isRecurring: boolean;
  recurrenceInterval?: string; // e.g., 'monthly', 'yearly'
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseRecord {
  id: string;
  date: string;
  expenseItemId: string;
  amount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Budget {
  category: string;
  limit: number;
}

const LS_EXPENSE_ITEMS = "waves/expense_items";
const LS_EXPENSE_RECORDS = "waves/expense_records";
const LS_BUDGETS = "waves/budgets";

function ExpenseManagementSection() {
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>(
    load(LS_EXPENSE_ITEMS, [])
  );
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>(
    load(LS_EXPENSE_RECORDS, [])
  );
  const [budgets, setBudgets] = useState<Budget[]>(load(LS_BUDGETS, []));

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>("monthly");
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>("");

  const [recordDate, setRecordDate] = useState<string>(todayISO());
  const [recordExpenseItemId, setRecordExpenseItemId] = useState<string>("");
  const [recordAmount, setRecordAmount] = useState<number>(0);
  const [recordNotes, setRecordNotes] = useState<string>("");

  const [from, setFrom] = useState<string>(monthStartISO());
  const [to, setTo] = useState<string>(todayISO());
  const [selCategory, setSelCategory] = useState<string>("");

  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetLimit, setBudgetLimit] = useState<number>(0);

  useEffect(() => save(LS_EXPENSE_ITEMS, expenseItems), [expenseItems]);
  useEffect(() => save(LS_EXPENSE_RECORDS, expenseRecords), [expenseRecords]);
  useEffect(() => save(LS_BUDGETS, budgets), [budgets]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(expenseItems.map((item) => item.category));
    return Array.from(uniqueCategories);
  }, [expenseItems]);

  const filteredRecords = useMemo(() => {
    const f = new Date(from).getTime();
    const t = new Date(to).getTime();
    return expenseRecords
      .filter((r) => {
        const tt = new Date(r.date).getTime();
        const item = expenseItems.find(item => item.id === r.expenseItemId);
        return tt >= f && tt <= t && (!selCategory || (item && item.category === selCategory));
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenseRecords, from, to, selCategory, expenseItems]);

  const totalExpenses = useMemo(() => {
    return filteredRecords.reduce((sum, record) => sum + record.amount, 0);
  }, [filteredRecords]);

  const budgetStatus = useMemo(() => {
    const status: { [key: string]: { spent: number; limit: number; percentage: number } } = {};
    budgets.forEach(budget => {
      const spent = expenseRecords
        .filter(record => {
          const item = expenseItems.find(i => i.id === record.expenseItemId);
          return item && item.category === budget.category;
        })
        .reduce((sum, record) => sum + record.amount, 0);
      status[budget.category] = {
        spent,
        limit: budget.limit,
        percentage: (spent / budget.limit) * 100,
      };
    });
    return status;
  }, [budgets, expenseRecords, expenseItems]);

  useEffect(() => {
    Object.entries(budgetStatus).forEach(([category, status]) => {
      if (status.percentage >= 80) {
        alert(`تنبيه: لقد تجاوزت 80% من ميزانية ${category}`);
      }
    });
  }, [budgetStatus]);

  function addExpenseItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category.trim() || amount <= 0) {
      return alert("الرجاء إدخال اسم وفئة ومبلغ صحيح للمصروف.");
    }
    const now = new Date().toISOString();
    const newItem: ExpenseItem = {
      id: makeId(),
      name: name.trim(),
      category: category.trim(),
      amount: Number(amount),
      isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
      startDate: isRecurring ? startDate : undefined,
      endDate: isRecurring && endDate.trim() !== "" ? endDate : undefined,
      createdAt: now,
      updatedAt: now,
    };
    setExpenseItems((prev) => [...prev, newItem]);
    setName("");
    setCategory("");
    setAmount(0);
    setIsRecurring(false);
    setRecurrenceInterval("monthly");
    setStartDate(todayISO());
    setEndDate("");
  }

  function updateExpenseItem(id: string, patch: Partial<ExpenseItem>) {
    setExpenseItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }

  function removeExpenseItem(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المصروف؟")) return;
    setExpenseItems((prev) => prev.filter((item) => item.id !== id));
    setExpenseRecords((prev) => prev.filter((record) => record.expenseItemId !== id));
  }

  function addExpenseRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!recordExpenseItemId || !recordDate || recordAmount <= 0) {
      return alert("الرجاء اختيار مصروف، تاريخ، ومبلغ صحيح للسجل.");
    }
    const now = new Date().toISOString();
    const newRecord: ExpenseRecord = {
      id: makeId(),
      date: recordDate,
      expenseItemId: recordExpenseItemId,
      amount: Number(recordAmount),
      notes: recordNotes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    setExpenseRecords((prev) => [newRecord, ...prev]);
    setRecordDate(todayISO());
    setRecordExpenseItemId("");
    setRecordAmount(0);
    setRecordNotes("");
  }

  function removeExpenseRecord(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    setExpenseRecords((prev) => prev.filter((record) => record.id !== id));
  }

  function addBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!budgetCategory.trim() || budgetLimit <= 0) {
      return alert("الرجاء إدخال فئة ومبلغ صحيح للميزانية.");
    }
    setBudgets(prev => {
      const existing = prev.find(b => b.category === budgetCategory);
      if (existing) {
        return prev.map(b => b.category === budgetCategory ? { ...b, limit: budgetLimit } : b);
      }
      return [...prev, { category: budgetCategory, limit: budgetLimit }];
    });
    setBudgetCategory("");
    setBudgetLimit(0);
  }

  function removeBudget(category: string) {
    if (!confirm("هل أنت متأكد من حذف هذه الميزانية؟")) return;
    setBudgets(prev => prev.filter(b => b.category !== category));
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>إدارة المصروفات</h2>
      <p className="muted" style={{ marginBottom: 12, fontSize: 12 }}>
        سجل مصروفاتك وتابعها لتحديد سقف لكل قسم.
      </p>

      {/* إدارة الميزانيات */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>إدارة الميزانيات</h3>
        <div className="responsive-table" style={{ marginBottom: 12 }}>
          <table>
            <thead>
              <tr>
                <th>الفئة</th>
                <th>الحد الشهري</th>
                <th>المصروف</th>
                <th>النسبة</th>
                <th className="no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {budgets.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="muted"
                    style={{ textAlign: "center", padding: "16px" }}
                  >
                    لا توجد ميزانيات بعد.
                  </td>
                </tr>
              ) : (
                budgets.map((budget) => (
                  <tr key={budget.category}>
                    <td>{budget.category}</td>
                    <td>{fmt(budget.limit)}</td>
                    <td>{fmt(budgetStatus[budget.category]?.spent || 0)}</td>
                    <td>
                      <progress
                        value={budgetStatus[budget.category]?.percentage || 0}
                        max="100"
                      />
                      {fmt(budgetStatus[budget.category]?.percentage || 0)}%
                    </td>
                    <td className="no-print">
                      <button
                        className="btn danger"
                        onClick={() => removeBudget(budget.category)}
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
        <form onSubmit={addBudget} className="grid grid-3">
          <div>
            <label className="muted">الفئة</label>
            <select
              className="select"
              value={budgetCategory}
              onChange={(e) => setBudgetCategory(e.target.value)}
            >
              <option value="">اختر...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="muted">الحد الشهري</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(Number(e.target.value))}
            />
          </div>
          <div style={{ alignSelf: "end" }}>
            <button className="btn" type="submit">
              إضافة/تحديث ميزانية
            </button>
          </div>
        </form>
      </div>

      {/* إدارة بنود المصروفات */}
      <div className="responsive-table" style={{ marginBottom: 12 }}>
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الفئة</th>
              <th>المبلغ الافتراضي</th>
              <th>متكرر؟</th>
              <th>الفترة</th>
              <th>تاريخ البدء</th>
              <th>تاريخ الانتهاء</th>
              <th className="no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {expenseItems.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="muted"
                  style={{ textAlign: "center", padding: "16px" }}
                >
                  لا توجد بنود مصروفات بعد.
                </td>
              </tr>
            ) : (
              expenseItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      className="input"
                      value={item.name}
                      onChange={(e) =>
                        updateExpenseItem(item.id, { name: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={item.category}
                      onChange={(e) =>
                        updateExpenseItem(item.id, { category: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) =>
                        updateExpenseItem(item.id, { amount: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.isRecurring}
                      onChange={(e) =>
                        updateExpenseItem(item.id, { isRecurring: e.target.checked })
                      }
                    />
                  </td>
                  <td>
                    {item.isRecurring ? (
                      <select
                        className="select"
                        value={item.recurrenceInterval}
                        onChange={(e) =>
                          updateExpenseItem(item.id, { recurrenceInterval: e.target.value })
                        }
                      >
                        <option value="monthly">شهري</option>
                        <option value="yearly">سنوي</option>
                      </select>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {item.isRecurring ? (
                      <input
                        className="input"
                        type="date"
                        value={item.startDate}
                        onChange={(e) =>
                          updateExpenseItem(item.id, { startDate: e.target.value })
                        }
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {item.isRecurring ? (
                      <input
                        className="input"
                        type="date"
                        value={item.endDate}
                        onChange={(e) =>
                          updateExpenseItem(item.id, { endDate: e.target.value })
                        }
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="no-print">
                    <button
                      className="btn danger"
                      onClick={() => removeExpenseItem(item.id)}
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

      <form onSubmit={addExpenseItem} className="grid grid-4" style={{ marginBottom: 16 }}>
        <div>
          <label className="muted">اسم المصروف</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="muted">الفئة</label>
          <input
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div>
          <label className="muted">المبلغ الافتراضي</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <div style={{ alignSelf: "end" }}>
          <label className="muted">متكرر؟</label>
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
        </div>
        {isRecurring && (
          <>
            <div>
              <label className="muted">الفترة</label>
              <select
                className="select"
                value={recurrenceInterval}
                onChange={(e) => setRecurrenceInterval(e.target.value)}
              >
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
              </select>
            </div>
            <div>
              <label className="muted">تاريخ البدء</label>
              <input
                className="input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="muted">تاريخ الانتهاء (اختياري)</label>
              <input
                className="input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}
        <div style={{ alignSelf: "end", gridColumn: isRecurring ? "span 1 / span 1" : "span 2 / span 2" }}>
          <button className="btn" type="submit">
            إضافة بند مصروف
          </button>
        </div>
      </form>

      {/* تسجيل المصروفات اليومية */}
      <form onSubmit={addExpenseRecord} className="grid grid-4">
        <div>
          <label className="muted">التاريخ</label>
          <input
            className="input"
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
          />
        </div>
        <div>
          <label className="muted">بند المصروف</label>
          <select
            className="select"
            value={recordExpenseItemId}
            onChange={(e) => setRecordExpenseItemId(e.target.value)}
          >
            <option value="">اختر...</option>
            {expenseItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.category})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="muted">المبلغ</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={recordAmount}
            onChange={(e) => setRecordAmount(Number(e.target.value))}
          />
        </div>
        <div className="grid" style={{ gridColumn: "span 2 / span 2" }}>
          <label className="muted">ملاحظات</label>
          <textarea
            className="textarea"
            rows={1}
            value={recordNotes}
            onChange={(e) => setRecordNotes(e.target.value)}
          />
        </div>
        <div className="row-actions" style={{ gridColumn: "1 / -1" }}>
          <button className="btn" type="submit">
            إضافة سجل مصروف
          </button>
        </div>
      </form>

      {/* سجلات المصروفات */}
      <div className="responsive-table" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>بند المصروف</th>
              <th>الفئة</th>
              <th>المبلغ</th>
              <th className="no-print">ملاحظات</th>
              <th className="no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="muted"
                  style={{ textAlign: "center", padding: "16px" }}
                >
                  لا توجد سجلات مصروفات بعد.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const item = expenseItems.find((i) => i.id === record.expenseItemId);
                return (
                  <tr key={record.id}>
                    <td data-label="التاريخ">{record.date}</td>
                    <td data-label="بند المصروف">{item?.name}</td>
                    <td data-label="الفئة">{item?.category}</td>
                    <td data-label="المبلغ">{fmt(record.amount)}</td>
                    <td data-label="ملاحظات" className="no-print">
                      {record.notes || "-"}
                    </td>
                    <td className="no-print">
                      <button
                        className="btn danger"
                        onClick={() => removeExpenseRecord(record.id)}
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

      {/* ملخص المصروفات */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="header">
          <h3 style={{ margin: 0 }}>ملخص المصروفات</h3>
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
              value={selCategory}
              onChange={(e) => setSelCategory(e.target.value)}
            >
              <option value="">كل الفئات</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-4">
          <div className="kpi">
            <div>
              <div className="muted">إجمالي المصروفات</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {fmt(totalExpenses)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExpenseManagementSection;

