import { useEffect, useState } from "react";
import { ejecutarConsulta, isNative, dexieDB } from "../../services/db";

export default function EcommerceMetrics() {
  const [resumen, setResumen] = useState({
    ingresos: 0,
    costos: 0,
    ganancia: 0,
    productos: 0,
  });

  useEffect(() => {
    async function cargarDatos() {
      try {
        if (isNative) {
          // 📦 Modo SQLite nativo → usa SQL real
          const sql = `
            SELECT 
              (SELECT IFNULL(SUM(total), 0) FROM ventas) AS ingresos,
              (SELECT IFNULL(SUM(p.precio_costo * dv.cantidad), 0)
               FROM detalle_ventas dv
               JOIN productos p ON p.id = dv.producto_id) AS costos,
              (SELECT COUNT(*) FROM productos) AS productos;
          `;
          const res = await ejecutarConsulta(sql);
          const r = res[0];
          setResumen({
            ingresos: r.ingresos,
            costos: r.costos,
            ganancia: r.ingresos - r.costos,
            productos: r.productos,
          });
        } else {
  // 🌐 Modo navegador (Dexie)
const ventas = await dexieDB.table("ventas").toArray();
const detalle = await dexieDB.table("detalle_ventas").toArray();
const productos = await dexieDB.table("productos").toArray();

const ingresos = ventas.reduce((acc, v) => acc + (v.total || 0), 0);

// 💡 Calcular costos reales usando el precio_costo del producto
const costos = detalle.reduce((acc, d) => {
  const producto = productos.find((p) => p.id === d.producto_id);
  return acc + ((producto?.precio_costo || 0) * (d.cantidad || 0));
}, 0);

setResumen({
  ingresos,
  costos,
  ganancia: ingresos - costos,
  productos: productos.length,
});
        }
      } catch (e) {
        console.error("Error cargando métricas:", e);
      }
    }
    cargarDatos();
  }, []);

  const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="rounded-lg bg-white p-3 shadow flex flex-col items-center justify-center text-center min-w-[90px] max-w-[120px] overflow-hidden">
        <h2 className="text-xs font-medium text-gray-600 truncate w-full">Ingresos Totales</h2>
        <p className="text-2xl font-bold text-green-600">{money(resumen.ingresos)}</p>
      </div>

      <div className="rounded-lg bg-white p-3 shadow flex flex-col items-center justify-center text-center min-w-[90px] max-w-[120px] overflow-hidden">
        <h2 className="text-xs font-medium text-gray-600 truncate w-full">Costos</h2>
        <p className="text-2xl font-bold text-red-600">{money(resumen.costos)}</p>
      </div>

      <div className="rounded-lg bg-white p-3 shadow flex flex-col items-center justify-center text-center min-w-[90px] max-w-[120px] overflow-hidden">
        <h2 className="text-xs font-medium text-gray-600 truncate w-full">Ganancia</h2>
        <p className="text-2xl font-bold text-blue-600">{money(resumen.ganancia)}</p>
      </div>

      <div className="rounded-lg bg-white p-3 shadow flex flex-col items-center justify-center text-center min-w-[90px] max-w-[120px] overflow-hidden">
        <h2 className="text-xs font-medium text-gray-600 truncate w-full">Productos Registrados</h2>
        <p className="text-2xl font-bold text-purple-600">{resumen.productos}</p>
      </div>
    </div>
  );
}
