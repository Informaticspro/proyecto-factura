import { useEffect, useState } from "react";
import { ejecutarConsulta, dexieDB, isNative } from "../../services/db";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Reportes() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pestaña, setPestaña] = useState<"ventas" | "inventario">("ventas");

  // ================================
  // 📊 Cargar Ventas
  // ================================
  useEffect(() => {
    cargarVentas();
    cargarMovimientos();
  }, []);

  async function cargarVentas() {
    try {
      setLoading(true);
      let lista: any[] = [];

      if (isNative) {
        const sql = `
          SELECT 
            id, 
            date(fecha, '+5 hours') AS fecha,
            total
          FROM ventas
          WHERE date(fecha, '+5 hours') 
            BETWEEN date('now', '-30 days', '+5 hours') AND date('now', '+5 hours')
          ORDER BY fecha DESC;
        `;
        const res: any = await ejecutarConsulta(sql);
        lista = Array.isArray(res) ? res : res?.values ?? [];
      } else {
        const todas = await dexieDB.table("ventas").toArray();
        lista = todas.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      }

      setVentas(lista);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ================================
  // 📦 Cargar Movimientos de Inventario
  // ================================
  async function cargarMovimientos() {
    try {
      let lista: any[] = [];

      if (isNative) {
        const sql = `
          SELECT 
            id,
            date(fecha, '+5 hours') AS fecha,
            tipo,
            producto,
            cantidad,
            costo_unitario
          FROM movimientos
          WHERE date(fecha, '+5 hours') 
            BETWEEN date('now', '-30 days', '+5 hours') AND date('now', '+5 hours')
          ORDER BY fecha DESC;
        `;
        const res: any = await ejecutarConsulta(sql);
        lista = Array.isArray(res) ? res : res?.values ?? [];
      } else {
        const todos = await dexieDB.table("movimientos").toArray();
        lista = todos.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      }

      setMovimientos(lista);
    } catch (e: any) {
      setError(e.message);
    }
  }

  // ================================
  // 📅 Filtros y exportaciones
  // ================================
  function filtrar(lista: any[]) {
    if (!desde || !hasta) return lista;

    const inicio = new Date(desde);
    const fin = new Date(hasta);

    return lista.filter((v) => {
      const f = new Date(v.fecha);
      return f >= inicio && f <= fin;
    });
  }

  function exportarExcelVentas() {
    const datos = filtrar(ventas).map((v) => ({
      Fecha: new Date(v.fecha).toLocaleDateString("es-ES"),
      Total: v.total,
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Ventas");
    const buffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "reporte_ventas.xlsx");
  }

  function exportarExcelMovimientos() {
    const datos = filtrar(movimientos).map((m) => ({
      Fecha: new Date(m.fecha).toLocaleDateString("es-ES"),
      Tipo: m.tipo,
      Producto: m.producto,
      Cantidad: m.cantidad,
      "Costo Unitario": m.costo_unitario,
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");
    const buffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "reporte_inventario.xlsx");
  }

  // ================================
  // 🎨 Renderizado principal
  // ================================
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📊 Reportes del Sistema</h1>

      {/* Pestañas */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setPestaña("ventas")}
          className={`px-4 py-2 rounded-lg ${
            pestaña === "ventas"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Ventas
        </button>
        <button
          onClick={() => setPestaña("inventario")}
          className={`px-4 py-2 rounded-lg ${
            pestaña === "inventario"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Movimientos de Inventario
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-end gap-3 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Desde</label>
          <input
            type="date"
            className="border rounded-lg p-2 w-full"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Hasta</label>
          <input
            type="date"
            className="border rounded-lg p-2 w-full"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
      </div>

      {/* Contenido de pestañas */}
      {pestaña === "ventas" ? (
        <SeccionVentas
          ventas={filtrar(ventas)}
          loading={loading}
          exportarExcel={exportarExcelVentas}
        />
      ) : (
        <SeccionMovimientos
          movimientos={filtrar(movimientos)}
          exportarExcel={exportarExcelMovimientos}
        />
      )}
    </div>
  );
}

// ================================
// 🧾 SECCIÓN DE VENTAS
// ================================
function SeccionVentas({
  ventas,
  loading,
  exportarExcel,
}: {
  ventas: any[];
  loading: boolean;
  exportarExcel: () => void;
}) {
  if (loading) return <div>Cargando ventas...</div>;

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={exportarExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 shadow"
        >
          Exportar Ventas
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 font-semibold">Fecha</th>
              <th className="p-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-2">
                  {new Date(v.fecha).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="p-2 text-right font-medium text-emerald-700">
                  ${Number(v.total || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================================
// 📦 SECCIÓN MOVIMIENTOS
// ================================
function SeccionMovimientos({
  movimientos,
  exportarExcel,
}: {
  movimientos: any[];
  exportarExcel: () => void;
}) {
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={exportarExcel}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 shadow"
        >
          Exportar Inventario
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 font-semibold">Fecha</th>
              <th className="p-2 font-semibold">Tipo</th>
              <th className="p-2 font-semibold">Producto</th>
              <th className="p-2 font-semibold text-right">Cantidad</th>
              <th className="p-2 font-semibold text-right">Costo Unitario</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-2">
                  {new Date(m.fecha).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="p-2">{m.tipo || "—"}</td>
                <td className="p-2">{m.producto || "—"}</td>
                <td className="p-2 text-right">{m.cantidad || 0}</td>
                <td className="p-2 text-right">
                  ${Number(m.costo_unitario || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
