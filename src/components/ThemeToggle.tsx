import { useState, useEffect } from "react";

function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setIsDark(!isDark)}
      title={isDark ? "تبديل إلى الوضع النهاري" : "تبديل إلى الوضع الليلي"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

export default ThemeToggle;

