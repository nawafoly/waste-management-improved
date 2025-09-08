import { useState, useEffect } from "react";
import { load, save, LS_ONBOARD, seedPacks } from "../utils/helpers";
import InventoryCountsSection from "../components/InventoryCountsSection";
import MaterialUsageSection from "../components/MaterialUsageSection";
import ExpenseManagementSection from "../components/ExpenseManagementSection";
import SupplierComparisonSection from "../components/SupplierComparisonSection";
import KPIDashboardSection from "../components/KPIDashboardSection";
import ThemeToggle from "../components/ThemeToggle";
import StickyHeader from "../components/StickyHeader";

function PreviewAllInOne() {
  const [onboardDone, setOnboardDone] = useState<boolean>(load(LS_ONBOARD, false));

  useEffect(() => {
    if (!onboardDone) {
      seedPacks();
      setOnboardDone(true);
      save(LS_ONBOARD, true);
    }
  }, [onboardDone]);

  const [activeTab, setActiveTab] = useState("counts");

  const tabs = [
    {
      id: "counts",
      title: "جرد وبيع",
      description: "سجّل الكميات الافتتاحية والإضافات والمبيعات",
      icon: "📦"
    },
    {
      id: "materials",
      title: "مواد خام",
      description: "إدارة المواد الخام والجرد الداخلي",
      icon: "🧱"
    },
    {
      id: "expenses",
      title: "المصروفات",
      description: "تتبع المصاريف وتنبيهات الميزانية",
      icon: "💰"
    },
    {
      id: "suppliers",
      title: "الموردين",
      description: "مقارنة أسعار الموردين واختيار الأفضل",
      icon: "🏪"
    },
    {
      id: "kpis",
      title: "مؤشرات الأداء",
      description: "تحليلات الربحية والهدر والأداء العام",
      icon: "📊"
    }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="page">
      <ThemeToggle />
      <StickyHeader />
      <div className="container">
        {/* رأس الصفحة المحسن */}
        <div className="header">
          <div>
            <h1 className="title">نظام إدارة النفايات والمبيعات</h1>
            <p className="muted" style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              إدارة شاملة للمخزون والمبيعات والمصروفات مع تحليلات متقدمة
            </p>
          </div>
        </div>

        {/* التبويبات المحسنة */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="tabs" style={{ 
            display: 'grid', 
            gap: '8px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`btn tab ${activeTab === tab.id ? "active" : "secondary"}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  textAlign: 'right',
                  padding: '16px',
                  height: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{tab.title}</span>
                  <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                </div>
                <small style={{ 
                  fontSize: '11px', 
                  opacity: 0.8,
                  lineHeight: '1.3',
                  textAlign: 'right'
                }}>
                  {tab.description}
                </small>
              </button>
            ))}
          </div>
        </div>

        {/* عرض التبويب النشط مع معلومات إضافية */}
        {currentTab && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h2 className="card-title" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '18px'
              }}>
                <span>{currentTab.icon}</span>
                <span>{currentTab.title}</span>
              </h2>
            </div>
            <p className="muted" style={{ margin: '0', fontSize: '14px' }}>
              {currentTab.description}
            </p>
          </div>
        )}

        {/* محتوى التبويبات */}
        <div style={{ minHeight: '400px' }}>
          {activeTab === "counts" && <InventoryCountsSection />}
          {activeTab === "materials" && <MaterialUsageSection />}
          {activeTab === "expenses" && <ExpenseManagementSection />}
          {activeTab === "suppliers" && <SupplierComparisonSection />}
          {activeTab === "kpis" && <KPIDashboardSection />}
        </div>

        {/* تذييل مفيد */}
        <div className="card" style={{ 
          marginTop: '40px', 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)'
        }}>
          <div className="muted" style={{ fontSize: '12px' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              💡 نصيحة: استخدم الوضع الليلي من الزر في أعلى اليسار لراحة أكبر للعينين
            </p>
            <p style={{ margin: '0' }}>
              📱 التطبيق متوافق مع جميع الأجهزة - جوال، تابلت، وسطح المكتب
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewAllInOne;

