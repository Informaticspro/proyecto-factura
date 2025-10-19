import { useCallback } from "react";
import { useSidebar } from "../context/SidebarContext";

export function useCloseSidebar() {
  const { setIsHovered, closeMobileSidebar } = useSidebar();

  const closeSidebar = useCallback(() => {
    setIsHovered(false);
    closeMobileSidebar(); // 👈 cerrar el menú móvil correctamente
  }, [setIsHovered, closeMobileSidebar]);

  return { closeSidebar };
}