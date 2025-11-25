import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/common/ScrollToTop";

import AppLayout from "./layout/AppLayout";

// 🔹 Intro tipo Netflix
import SplashIntro from "./components/common/SplashIntro";

// 🔹 Sistema de licencia
import Licencia from "./pages/Licencia/Licencia";
import { estaLicenciada } from "./services/db/licenciaService";

// 🔹 Tus páginas
import Home from "./pages/Dashboard/Home";
import Productos from "./pages/Productos/Productos";
import Ventas from "./pages/Ventas/Ventas";
import Inventario from "./pages/Inventario/Inventario";
import Finanzas from "./pages/Finanzas/Finanzas";
import Reportes from "./pages/Reportes/Reportes";
import Configuracion from "./pages/Configuracion/Configuracion";
import Calendar from "./pages/Calendar";
import UserProfiles from "./pages/UserProfiles";
import DebugDB from "./pages/DebugDB";
import NotFound from "./pages/OtherPage/NotFound";

export default function App() {
  const [checked, setChecked] = useState(false);
  const [licOk, setLicOk] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // 🔍 Revisar licencia al iniciar
  useEffect(() => {
    (async () => {
      const ok = await estaLicenciada();
      setLicOk(ok);
      setChecked(true);
    })();
  }, []);

  // 🎬 Intro tipo Netflix
  if (showIntro) {
    return <SplashIntro onFinish={() => setShowIntro(false)} />;
  }

  // 🔐 Si no hay licencia válida, mostramos solo la pantalla de licencia
  if (!checked || !licOk) {
    return <Licencia />;
  }

  // ✅ Aquí ya estamos licenciados → mostrar la app normal
  return (
  <>
    <ScrollToTop />

    <Routes>
      <Route element={<AppLayout />}>
        <Route index path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/profile" element={<UserProfiles />} />

        <Route path="/productos" element={<Productos />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/finanzas" element={<Finanzas />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/configuracion" element={<Configuracion />} />
        
        <Route path="/estadisticas" element={<div>Estadísticas (próximamente)</div>} />
        <Route path="/proyecciones" element={<div>Proyecciones (próximamente)</div>} />
        <Route path="/debug" element={<DebugDB />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);
}
