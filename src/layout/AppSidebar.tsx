import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useCloseSidebar } from "../hooks/useCloseSidebar";
import {
  Home,
  ShoppingCart,
  Package,
  BarChart,
  DollarSign,
  Settings,
  Wrench,
  PieChart,
  MoreHorizontal,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

type AppSidebarProps = {
  headerHeight: number; // ✅ ahora recibe el alto del header
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

/* ============================================================
   📋 MENÚ PRINCIPAL PERSONALIZADO
   ============================================================ */
const navItems: NavItem[] = [
  { icon: <Home />, name: "Inicio", path: "/" },
  {
    icon: <ShoppingCart />,
    name: "Ventas",
    subItems: [
      { name: "Registrar venta", path: "/ventas" },
      { name: "Historial de ventas", path: "/reportes" },
    ],
  },
  {
    icon: <Package />,
    name: "Productos",
    subItems: [
      { name: "Lista de productos", path: "/productos" },
      { name: "Inventario", path: "/inventario" },
    ],
  },
  { icon: <DollarSign />, name: "Finanzas", path: "/finanzas" },
  { icon: <BarChart />, name: "Reportes", path: "/reportes" },
  { icon: <Settings />, name: "Configuración", path: "/configuracion" },
];

/* ============================================================
   🧠 OTROS / AVANZADO
   ============================================================ */
const othersItems: NavItem[] = [
  {
    icon: <Wrench />,
    name: "Herramientas",
    subItems: [{ name: "Debug DB", path: "/debug" }],
  },
  {
    icon: <PieChart />,
    name: "Analítica",
    subItems: [
      { name: "Estadísticas", path: "/estadisticas" },
      { name: "Proyecciones", path: "/proyecciones" },
    ],
  },
];

const AppSidebar: React.FC<AppSidebarProps> = ({ headerHeight }) => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { closeSidebar } = useCloseSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [hasShadow, setHasShadow] = useState(false); // ✅ sombra dinámica

  const sidebarRef = useRef<HTMLDivElement | null>(null);

  // 🧠 Cerrar menú automáticamente al cambiar de ruta
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as "main" | "others", index });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) =>
      prev && prev.type === menuType && prev.index === index
        ? null
        : { type: menuType, index }
    );
  };

  // ✅ Detectar clic fuera del sidebar (solo en móvil)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isMobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        closeSidebar();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileOpen, closeSidebar]);

  // ✅ Detectar scroll interno para mostrar sombra
  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;

    const handleScroll = () => {
      setHasShadow(el.scrollTop > 10);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                onClick={closeSidebar}
                className={`menu-item group ${
                  isActive(nav.path)
                    ? "menu-item-active"
                    : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType &&
                  openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      onClick={closeSidebar}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      ref={sidebarRef}
      className={`fixed left-0 flex flex-col px-5 bg-white text-gray-900 border-r border-gray-200 transition-all duration-300 ease-in-out
      ${
        isExpanded || isMobileOpen
          ? "w-[280px]"
          : isHovered
          ? "w-[280px]"
          : "w-[90px]"
      }
      ${isMobileOpen ? "translate-x-0 z-[70]" : "-translate-x-full z-[50]"} lg:translate-x-0 ${
        hasShadow ? "shadow-md" : ""
      }`}
      style={{
        top: `${headerHeight}px`,
        height: `calc(100dvh - ${headerHeight}px)`,
      }}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-6 flex items-center gap-3 ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/images/logo/Logo-factura.png"
            alt="Proyecto Factura"
            width={50}
            height={50}
            className="rounded-md shadow-sm"
          />
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="text-lg font-bold text-emerald-700 tracking-tight">
              Facturación
            </span>
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-3 text-xs uppercase text-gray-400 flex ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menú principal"
                ) : (
                  <MoreHorizontal />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div>
              <h2
                className={`mb-3 text-xs uppercase text-gray-400 flex ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Avanzado"
                ) : (
                  <MoreHorizontal />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>

        <footer className="mt-auto mb-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()}{" "}
          <b className="text-emerald-700">InformaticsPro</b>
        </footer>
      </div>
    </aside>
  );
};

export default AppSidebar;
