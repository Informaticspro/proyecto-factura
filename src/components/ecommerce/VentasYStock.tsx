import { useEffect, useState } from "react";
import { dexieDB, ejecutarConsulta, isNative } from "../../services/db";

export default function VentasYStock() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [bajoStock, setBajoStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);

      /* =============================
         📦 Productos con bajo stock
      ============================= */
      let productos: any[] = [];
      if (isNative) {
        const sql = `
          SELECT id, nombre, stock, unidad_medida
          FROM productos
          WHERE stock <= 5
          ORDER BY stock ASC
          LIMIT 5;
        `;
        productos = await ejecutarConsulta(sql);
      } else {
        productos = await dexieDB
          .table("productos")
          .filter((p) => p.stock <= 5)
          .toArray();
        productos.sort((a, b) => a.stock - b.stock);
      }

      /* =============================
         💰 Últimas ventas registradas
      ============================= */
      let ventasLista: any[] = [];
      if (isNative) {
        const sql = `
          SELECT id, fecha, total
          FROM ventas
          ORDER BY fecha DESC
          LIMIT 5;
        `;
        ventasLista = await ejecutarConsulta(sql);
      } else {
        const todas = await dexieDB.table("ventas").toArray();
        todas.sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        ventasLista = todas.slice(0, 5);
      }

      setBajoStock(productos);
      setVentas(ventasLista);
      setLoading(false);
    }

    cargarDatos();
  }, []);

  if (loading)
    return <div className="text-center text-gray-500">Cargando datos...</div>;

  /* =============================
     🎨 Colores de stock y ventas
  ============================= */
  const getStockColor = (stock: number) => {
    if (stock <= 2) return "bg-red-500";
    if (stock <= 5) return "bg-orange-400";
    return "bg-emerald-500";
  };

  const getVentaColor = (total: number) => {
    if (total >= 20) return "text-emerald-600";
    if (total >= 5) return "text-yellow-600";
    return "text-gray-600";
  };

  /* =============================
     🕓 Formatear fecha local
  ============================= */
  const formatearFecha = (fechaISO: string) => {
    const f = new Date(fechaISO);
    return f.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  /* =============================
     💵 Total de últimas ventas
  ============================= */
  const totalVentas = ventas.reduce(
    (acc, v) => acc + Number(v.total || 0),
    0
  ).toFixed(2);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
      {/* 🔸 Productos con bajo stock */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">📦</span>
            Productos con bajo stock
          </div>
          <span className="text-sm text-gray-500">
            ({bajoStock.length})
          </span>
        </h2>

        {bajoStock.length === 0 ? (
          <p className="text-sm text-gray-500">
            Todos los productos están bien abastecidos.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {bajoStock.map((p) => (
              <li
                key={p.id}
                className="py-3 flex justify-between items-center hover:bg-gray-50 rounded-lg px-2 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${getStockColor(
                      p.stock
                    )} shadow-sm`}
                  ></span>
                  <div>
                    <p className="font-medium text-gray-700">{p.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {p.unidad_medida || ""} — Stock:{" "}
                      <span className="font-semibold text-gray-800">
                        {p.stock}
                      </span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 🔹 Últimas ventas */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-emerald-600">💰</span>
            Últimas ventas registradas
          </h2>
          <div className="text-sm text-gray-500">
            ({ventas.length}) · <span className="text-emerald-700 font-medium">Total: ${totalVentas}</span>
          </div>
        </div>

        {ventas.length === 0 ? (
          <p className="text-sm text-gray-500">No hay ventas registradas aún.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {ventas.map((v) => (
              <li
                key={v.id}
                className="py-3 flex justify-between items-center hover:bg-gray-50 rounded-lg px-2 transition-all"
              >
                <div>
                  <p className="font-medium text-gray-700">
                    {formatearFecha(v.fecha)}
                  </p>
                </div>
                <p
                  className={`font-semibold ${getVentaColor(Number(v.total))}`}
                >
                  ${Number(v.total).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    
  );


}