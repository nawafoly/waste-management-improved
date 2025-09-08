import React, { useEffect, useMemo, useState } from "react";
import { load, save, makeId, fmt } from "../utils/helpers";

interface Product {
  id: string;
  name: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface PriceRecord {
  id: string;
  productId: string;
  supplierId: string;
  price: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

const LS_PRODUCTS = "waves/products";
const LS_SUPPLIERS = "waves/suppliers";
const LS_PRICE_RECORDS = "waves/price_records";

function SupplierComparisonSection() {
  const [products, setProducts] = useState<Product[]>(load(LS_PRODUCTS, []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(load(LS_SUPPLIERS, []));
  const [priceRecords, setPriceRecords] = useState<PriceRecord[]>(
    load(LS_PRICE_RECORDS, [])
  );

  const [productName, setProductName] = useState("");
  const [productUnit, setProductUnit] = useState("");

  const [supplierName, setSupplierName] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [priceDate, setPriceDate] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => save(LS_PRODUCTS, products), [products]);
  useEffect(() => save(LS_SUPPLIERS, suppliers), [suppliers]);
  useEffect(() => save(LS_PRICE_RECORDS, priceRecords), [priceRecords]);

  const productPrices = useMemo(() => {
    const pricesMap: { [productId: string]: { [supplierId: string]: PriceRecord[] } } = {};
    priceRecords.forEach(record => {
      if (!pricesMap[record.productId]) {
        pricesMap[record.productId] = {};
      }
      if (!pricesMap[record.productId][record.supplierId]) {
        pricesMap[record.productId][record.supplierId] = [];
      }
      pricesMap[record.productId][record.supplierId].push(record);
    });
    return pricesMap;
  }, [priceRecords]);

  function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim() || !productUnit.trim()) {
      return alert("الرجاء إدخال اسم ووحدة للمنتج.");
    }
    const now = new Date().toISOString();
    const newProduct: Product = {
      id: makeId(),
      name: productName.trim(),
      unit: productUnit.trim(),
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [...prev, newProduct]);
    setProductName("");
    setProductUnit("");
  }

  function removeProduct(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setPriceRecords((prev) => prev.filter((pr) => pr.productId !== id));
  }

  function addSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierName.trim()) {
      return alert("الرجاء إدخال اسم المورد.");
    }
    const now = new Date().toISOString();
    const newSupplier: Supplier = {
      id: makeId(),
      name: supplierName.trim(),
      createdAt: now,
      updatedAt: now,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    setSupplierName("");
  }

  function removeSupplier(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المورد؟")) return;
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setPriceRecords((prev) => prev.filter((pr) => pr.supplierId !== id));
  }

  function addPriceRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductId || !selectedSupplierId || price <= 0 || !priceDate) {
      return alert("الرجاء اختيار منتج ومورد، وإدخال سعر وتاريخ صحيحين.");
    }
    const now = new Date().toISOString();
    const newPriceRecord: PriceRecord = {
      id: makeId(),
      productId: selectedProductId,
      supplierId: selectedSupplierId,
      price: Number(price),
      date: priceDate,
      createdAt: now,
      updatedAt: now,
    };
    setPriceRecords((prev) => [...prev, newPriceRecord]);
    setSelectedProductId("");
    setSelectedSupplierId("");
    setPrice(0);
    setPriceDate(new Date().toISOString().split("T")[0]);
  }

  function removePriceRecord(id: string) {
    if (!confirm("هل أنت متأكد من حذف سجل السعر هذا؟")) return;
    setPriceRecords((prev) => prev.filter((pr) => pr.id !== id));
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>مقارنة الموردين</h2>
      <p className="muted" style={{ marginBottom: 12, fontSize: 12 }}>
        قارن أسعار المنتجات من موردين مختلفين.
      </p>

      {/* إدارة المنتجات */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>إدارة المنتجات</h3>
        <form onSubmit={addProduct} className="grid grid-3" style={{ marginBottom: 12 }}>
          <div>
            <label className="muted">اسم المنتج</label>
            <input
              className="input"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>
          <div>
            <label className="muted">وحدة القياس</label>
            <input
              className="input"
              value={productUnit}
              onChange={(e) => setProductUnit(e.target.value)}
            />
          </div>
          <div style={{ alignSelf: "end" }}>
            <button className="btn" type="submit">
              إضافة منتج
            </button>
          </div>
        </form>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الوحدة</th>
                <th className="no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="muted"
                    style={{ textAlign: "center", padding: "16px" }}
                  >
                    لا توجد منتجات بعد.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.unit}</td>
                    <td className="no-print">
                      <button
                        className="btn danger"
                        onClick={() => removeProduct(product.id)}
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

      {/* إدارة الموردين */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>إدارة الموردين</h3>
        <form onSubmit={addSupplier} className="grid grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label className="muted">اسم المورد</label>
            <input
              className="input"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </div>
          <div style={{ alignSelf: "end" }}>
            <button className="btn" type="submit">
              إضافة مورد
            </button>
          </div>
        </form>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th className="no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="muted"
                    style={{ textAlign: "center", padding: "16px" }}
                  >
                    لا يوجد موردون بعد.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.name}</td>
                    <td className="no-print">
                      <button
                        className="btn danger"
                        onClick={() => removeSupplier(supplier.id)}
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

      {/* تسجيل أسعار المنتجات */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>تسجيل أسعار المنتجات</h3>
        <form onSubmit={addPriceRecord} className="grid grid-4">
          <div>
            <label className="muted">المنتج</label>
            <select
              className="select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">اختر منتج...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="muted">المورد</label>
            <select
              className="select"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            >
              <option value="">اختر مورد...</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="muted">السعر</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="muted">التاريخ</label>
            <input
              className="input"
              type="date"
              value={priceDate}
              onChange={(e) => setPriceDate(e.target.value)}
            />
          </div>
          <div style={{ gridColumn: "span 4 / span 4", textAlign: "right" }}>
            <button className="btn" type="submit">
              إضافة سعر
            </button>
          </div>
        </form>
        <div className="responsive-table" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>المورد</th>
                <th>السعر</th>
                <th>التاريخ</th>
                <th className="no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {priceRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="muted"
                    style={{ textAlign: "center", padding: "16px" }}
                  >
                    لا توجد سجلات أسعار بعد.
                  </td>
                </tr>
              ) : (
                priceRecords.map((record) => {
                  const product = products.find(p => p.id === record.productId);
                  const supplier = suppliers.find(s => s.id === record.supplierId);
                  return (
                    <tr key={record.id}>
                      <td>{product?.name} ({product?.unit})</td>
                      <td>{supplier?.name}</td>
                      <td>{fmt(record.price)}</td>
                      <td>{record.date}</td>
                      <td className="no-print">
                        <button
                          className="btn danger"
                          onClick={() => removePriceRecord(record.id)}
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

      {/* مقارنة الأسعار */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>مقارنة الأسعار</h3>
        {products.length === 0 ? (
          <p className="muted" style={{ textAlign: "center" }}>
            الرجاء إضافة منتجات وموردين وسجلات أسعار للمقارنة.
          </p>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  {suppliers.map((supplier) => (
                    <th key={supplier.id}>{supplier.name}</th>
                  ))}
                  <th>المتوسط</th>
                  <th>الأفضل</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const pricesBySupplier = productPrices[product.id] || {};
                  const latestPrices: { [supplierId: string]: number } = {};
                  let totalPrices = 0;
                  let validPriceCount = 0;
                  let bestPrice = Infinity;
                  let bestSupplierName = "";

                  suppliers.forEach(supplier => {
                    const records = pricesBySupplier[supplier.id] || [];
                    if (records.length > 0) {
                      const latestRecord = records.sort((a, b) => b.date.localeCompare(a.date))[0];
                      latestPrices[supplier.id] = latestRecord.price;
                      totalPrices += latestRecord.price;
                      validPriceCount++;
                      if (latestRecord.price < bestPrice) {
                        bestPrice = latestRecord.price;
                        bestSupplierName = supplier.name;
                      }
                    }
                  });

                  const averagePrice = validPriceCount > 0 ? totalPrices / validPriceCount : 0;

                  return (
                    <tr key={product.id}>
                      <td>{product.name} ({product.unit})</td>
                      {suppliers.map((supplier) => (
                        <td key={supplier.id}>
                          {latestPrices[supplier.id] ? fmt(latestPrices[supplier.id]) : "-"}
                        </td>
                      ))}
                      <td>{fmt(averagePrice)}</td>
                      <td>
                        {bestPrice !== Infinity ? 
                          `${fmt(bestPrice)} (${bestSupplierName})` : "-"
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default SupplierComparisonSection;

