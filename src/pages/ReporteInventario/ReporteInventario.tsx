import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  obtenerProductos,
  type Producto,
} from "../../services/db";

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

export default function ReporteInventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await obtenerProductos();
        setProductos(list);
      } catch (err) {
        console.error(err);
        toast.error("Error cargando productos para el reporte");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="p-4">Cargando reporte...</div>;
  }

  // --------- CÁLCULOS CONTABLES ---------
  const totalCosto = productos.reduce(
    (acc, p) => acc + (p.stock || 0) * (p.precio_costo || 0),
    0
  );

  const totalVenta = productos.reduce(
    (acc, p) => acc + (p.stock || 0) * (p.precio_venta || 0),
    0
  );

  const gananciaPotencial = totalVenta - totalCosto;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        📊 Reporte Contable del Inventario
      </h1>

      {/* Totales contables */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border bg-white p-4 shadow">
          <h3 className="font-semibold text-gray-700">
            Valor total (Costo)
          </h3>
          <p className="text-xl font-bold text-blue-700">
            {money(totalCosto)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow">
          <h3 className="font-semibold text-gray-700">
            Valor total (Venta)
          </h3>
          <p className="text-xl font-bold text-green-700">
            {money(totalVenta)}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow">
          <h3 className="font-semibold text-gray-700">
            Ganancia potencial
          </h3>
          <p className="text-xl font-bold text-purple-700">
            {money(gananciaPotencial)}
          </p>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">
          Productos en inventario
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Producto</th>
                <th className="p-2">Stock</th>
                <th className="p-2">$ Costo</th>
                <th className="p-2">$ Venta</th>
                <th className="p-2 text-right">Total Costo</th>
                <th className="p-2 text-right">Total Venta</th>
              </tr>
            </thead>

            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-2">{p.id}</td>
                  <td className="p-2">{p.nombre}</td>
                  <td className="p-2">{p.stock}</td>
                  <td className="p-2">{money(p.precio_costo)}</td>
                  <td className="p-2">{money(p.precio_venta)}</td>
                  <td className="p-2 text-right text-blue-700 font-semibold">
                    {money((p.stock || 0) * (p.precio_costo || 0))}
                  </td>
                  <td className="p-2 text-right text-green-700 font-semibold">
                    {money((p.stock || 0) * (p.precio_venta || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
