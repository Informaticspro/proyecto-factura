import { Link } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
//import UserDropdown from "../components/header/UserDropdown";
import { useEffect, useState } from "react";

export default function AppHeader() {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggle = () => {
    if (isMobile) toggleMobileSidebar();
    else toggleSidebar();
  };

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-2
                 bg-gradient-to-r from-[#0B1525] via-[#0E2B4A] to-[#0066FF]
                 text-white shadow-lg backdrop-blur-md"
    >
      {/* ☰ Menú */}
      <button
        onClick={handleToggle}
        className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 active:scale-95 transition"
        aria-label="Abrir menú"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>

      {/* 🔹 Logo */}
      <Link to="/" className="flex items-center gap-2">
        <img
          src="/images/logo/letras-logo2.png"
          alt="Vendix"
          className={`object-contain transition-all ${
            isMobile ? "w-20 h-6" : "w-32 h-8"
          }`}
        />
      </Link>

      {/* 🌙 / 👤 Acciones */}
      <div className="flex items-center gap-3">
        <ThemeToggleButton />
    {/*  // <UserDropdown /> */}
      </div>
    </header>
  );
}
