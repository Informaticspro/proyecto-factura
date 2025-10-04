import { useEffect, useState } from "react";
import { openDB } from "idb";

interface Producto {
  id?: number;
  nombre: string;
  precio: number;
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

  async function cargarDatos() {
    const db = await openDB("facturacionDB", 1);
    setProductos(await db.getAll("productos"));
    setVentas(await db.getAll("ventas"));
    setDetalle(await db.getAll("detalle_ventas"));
  }

  async function limpiarDB() {
    const db = await openDB("facturacionDB", 1);
    await db.clear("productos");
    await db.clear("ventas");
    await db.clear("detalle_ventas");
    setProductos([]);
    setVentas([]);
    setDetalle([]);
    alert("Base de datos limpiada ✅");
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🔍 Debug DB</h1>

      <div className="space-x-2 mb-6">
        <button
          onClick={cargarDatos}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Recargar
        </button>
        <button
          onClick={limpiarDB}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Limpiar DB
        </button>
      </div>

      {/* Productos */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold">📦 Productos</h2>
        {productos.length === 0 ? (
          <p className="text-gray-500">No hay productos.</p>
        ) : (
          <ul className="list-disc pl-5">
            {productos.map((p) => (
              <li key={p.id}>
                <b>{p.nombre}</b> - ${p.precio} ({p.stock} {p.unidad_medida})
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ventas */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold">🧾 Ventas</h2>
        {ventas.length === 0 ? (
          <p className="text-gray-500">No hay ventas.</p>
        ) : (
          <ul className="list-disc pl-5">
            {ventas.map((v) => (
              <li key={v.id}>
                Venta #{v.id} - {v.fecha} - Total: ${v.total}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Detalles de Ventas */}
      <section>
        <h2 className="text-lg font-semibold">📊 Detalle Ventas</h2>
        {detalle.length === 0 ? (
          <p className="text-gray-500">No hay detalles de ventas.</p>
        ) : (
          <ul className="list-disc pl-5">
            {detalle.map((d) => (
              <li key={d.id}>
                Venta #{d.venta_id} → Producto #{d.producto_id} | {d.cantidad} x{" "}
                ${d.precio_unitario} = ${d.subtotal}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
