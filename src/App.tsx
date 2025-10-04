import { BrowserRouter as Router, Routes, Route } from "react-router";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

// ✅ Dashboard existente
import Home from "./pages/Dashboard/Home";

// ✅ Tus nuevas páginas
import Productos from "./pages/Productos/Productos";
import Ventas from "./pages/Ventas/Ventas";
import Inventario from "./pages/Inventario/Inventario";
import Finanzas from "./pages/Finanzas/Finanzas";
import Reportes from "./pages/Reportes/Reportes";
import Configuracion from "./pages/Configuracion/Configuracion";

// ✅ Extra
import Calendar from "./pages/Calendar";
import UserProfiles from "./pages/UserProfiles";
import NotFound from "./pages/OtherPage/NotFound";

//temporal
import DebugDB from "./pages/DebugDB";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Layout principal (Sidebar + Header) */}
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route index path="/" element={<Home />} />

          {/* Otras páginas */}
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/profile" element={<UserProfiles />} />

          {/* Gestión */}
          <Route path="/productos" element={<Productos />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/configuracion" element={<Configuracion />} />

          {/* 🚀 Futuro (ya lo dejamos preparado) */}
          <Route path="/estadisticas" element={<div>Estadísticas (próximamente)</div>} />
          <Route path="/proyecciones" element={<div>Proyecciones (próximamente)</div>} />
          <Route path="/debug" element={<DebugDB />} />
        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
