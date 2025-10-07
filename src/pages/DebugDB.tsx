import { useEffect, useState } from "react";
import { ejecutarConsulta, initSQLite } from "../services/sqliteService";

interface Producto {
  id?: number;
  nombre: string;
  precio_costo: number;
  precio_venta: number;
  unidad_medida: string;
  stock: number;
}

interface Venta {
  id?: number;
  fecha: string;
  total: number;
}

interface DetalleVenta {
  id?: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export default function DebugDB() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [detalle, setDetalle] = useState<DetalleVenta[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function cargarDatos() {
    await initSQLite();

    try {
      const prods = await ejecutarConsulta("SELECT * FROM productos");
      const vnts = await ejecutarConsulta("SELECT * FROM ventas");
      const dets = await ejecutarConsulta("SELECT * FROM detalle_ventas");

      setProductos(prods || []);
      setVentas(vnts || []);
      setDetalle(dets || []);
      setMensaje("✅ Datos cargados correctamente desde SQLite.");
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error al cargar los datos.");
    }
  }

  async function limpiarDB() {
    if (!confirm("¿Seguro que deseas eliminar todos los datos?")) return;

    try {
      await ejecutarConsulta("DELETE FROM productos");
      await ejecutarConsulta("DELETE FROM ventas");
      await ejecutarConsulta("DELETE FROM detalle_ventas");

      setProductos([]);
      setVentas([]);
      setDetalle([]);
      setMensaje("🗑️ Base de datos limpiada correctamente.");
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error al limpiar la base de datos.");
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🧩 Debug SQLite</h1>

      {mensaje && (
        <div className="mb-4 p-3 rounded bg-blue-100 text-blue-800 text-sm">
          {mensaje}
        </div>
      )}

      <div className="space-x-2 mb-6">
        <button
          onClick={cargarDatos}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Recargar
        </button>
        <button
          onClick={limpiarDB}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Limpiar DB
        </button>
      </div>

      {/* Productos */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">📦 Productos</h2>
        {productos.length === 0 ? (
          <p className="text-gray-500">No hay productos registrados.</p>
        ) : (
          <table className="min-w-full border border-gray-200 shadow-md rounded bg-white">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4 border-b">Nombre</th>
                <th className="py-2 px-4 border-b">Costo</th>
                <th className="py-2 px-4 border-b">Venta</th>
                <th className="py-2 px-4 border-b">Unidad</th>
                <th className="py-2 px-4 border-b">Stock</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 px-4 border-b">{p.nombre}</td>
                  <td className="py-2 px-4 border-b">
                    ${Number(p.precio_costo).toFixed(2)}
                  </td>
                  <td className="py-2 px-4 border-b text-green-700">
                    ${Number(p.precio_venta).toFixed(2)}
                  </td>
                  <td className="py-2 px-4 border-b">{p.unidad_medida}</td>
                  <td className="py-2 px-4 border-b">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Ventas */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">🧾 Ventas</h2>
        {ventas.length === 0 ? (
          <p className="text-gray-500">No hay ventas registradas.</p>
        ) : (
          <ul className="list-disc pl-5">
            {ventas.map((v) => (
              <li key={v.id}>
                Venta #{v.id} — {v.fecha} — Total: ${v.total}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Detalles */}
      <section>
        <h2 className="text-lg font-semibold mb-2">📊 Detalle de Ventas</h2>
        {detalle.length === 0 ? (
          <p className="text-gray-500">No hay detalles de ventas.</p>
        ) : (
          <ul className="list-disc pl-5">
            {detalle.map((d) => (
              <li key={d.id}>
                Venta #{d.venta_id} → Producto #{d.producto_id} | {d.cantidad} x $
                {d.precio_unitario} = ${d.subtotal}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
