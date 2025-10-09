import { useEffect, useState } from "react";
import {
  obtenerProductos,
  registrarMovimientoInventario,
  obtenerMovimientosInventario,
  type Producto,
} from "../../services/db";

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

export default function Inventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [productoId, setProductoId] = useState<number | "">("");
  const [tipo, setTipo] = useState<"entrada" | "salida">("entrada");
  const [cantidad, setCantidad] = useState<number>(0);
  const [motivo, setMotivo] = useState("");

  // Cargar datos
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const prods = await obtenerProductos();
        setProductos(prods);
        const movs = await obtenerMovimientosInventario();
        setMovimientos(movs);
      } catch (e: any) {
        setError(e.message ?? "Error cargando inventario");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function manejarMovimiento() {
    if (!productoId || cantidad <= 0) {
      setError("Selecciona un producto y una cantidad válida");
      return;
    }

    try {
      await registrarMovimientoInventario(productoId, tipo, cantidad, motivo);
      setCantidad(0);
      setMotivo("");
      setProductoId("");
      const prods = await obtenerProductos();
      const movs = await obtenerMovimientosInventario();
      setProductos(prods);
      setMovimientos(movs);
      alert("✅ Movimiento registrado correctamente");
    } catch (e: any) {
      setError(e.message ?? "Error al registrar movimiento");
    }
  }

  if (loading) return <div className="p-4">Cargando inventario...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Inventario</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {/* Formulario de movimiento */}
      <div className="rounded-xl border bg-white p-4 shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-3">Registrar movimiento</h2>

        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Producto</label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="">Selecciona...</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) =>
                setTipo(e.target.value as "entrada" | "salida")
              }
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <input
              type="text"
              placeholder="Motivo (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 text-right">
          <button
            onClick={manejarMovimiento}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
          >
            Registrar movimiento
          </button>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="rounded-xl border bg-white p-4 shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-3">Stock actual</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Producto</th>
                <th className="p-2">$ Costo</th>
                <th className="p-2">$ Venta</th>
                <th className="p-2">Unidad</th>
                <th className="p-2">Stock</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-2">{p.id}</td>
                  <td className="p-2">{p.nombre}</td>
                  <td className="p-2">{money(p.precio_costo)}</td>
                  <td className="p-2">{money(p.precio_venta)}</td>
                  <td className="p-2">{p.unidad_medida}</td>
                  <td
                    className={`p-2 font-semibold ${
                      p.stock < 1 ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    {p.stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de movimientos */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Movimientos recientes</h2>
        {movimientos.length === 0 ? (
          <p className="text-sm opacity-70">
            No hay movimientos registrados aún.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Producto</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Cantidad</th>
                  <th className="p-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="p-2">
                      {new Date(m.fecha).toLocaleString()}
                    </td>
                    <td className="p-2">{m.producto_nombre}</td>
                    <td
                      className={`p-2 font-semibold ${
                        m.tipo === "entrada" ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {m.tipo}
                    </td>
                    <td className="p-2">{m.cantidad}</td>
                    <td className="p-2">{m.motivo || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
