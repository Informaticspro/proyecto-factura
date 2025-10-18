// src/pages/Ventas/Ventas.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  initVentasSchema,
  obtenerProductos,
  registrarVenta,
  obtenerVentasResumen,
  obtenerDetalleDeVenta,
  obtenerCategorias,
  type Producto,
} from '../../services/db';

// Formateo simple de moneda
const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

// Tipos internos del componente
type CartItem = {
  key: string; // clave UI
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
};

export default function Ventas() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [buscador, setBuscador] = useState('');
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));

  const [ventas, setVentas] = useState<{ id: number; fecha: string; total: number; items: number }[]>([]);
  const [ventaExpandida, setVentaExpandida] = useState<number | null>(null);
  const [detallesVenta, setDetallesVenta] = useState<Record<number, any[]>>({});
  const [categorias, setCategorias] = useState<string[]>([]);
const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

useEffect(() => {
  (async () => {
    const cats = await obtenerCategorias();
    setCategorias(cats.map(c => c.nombre));
  })();
}, []);

  // Cargar datos iniciales
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await initVentasSchema();
        const prods = await obtenerProductos();
        setProductos(prods);
        const vs = await obtenerVentasResumen(20);
        setVentas(vs);
      } catch (e: any) {
        setError(e?.message ?? 'Error al inicializar Ventas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

 



  const total = useMemo(
    () => carrito.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0),
    [carrito]
  );
  const productosFiltrados = useMemo(() => {
  const q = buscador.trim().toLowerCase();
  return productos
    .filter((p) =>
      (!categoriaSeleccionada || p.categoria === categoriaSeleccionada) &&
      (!q || p.nombre.toLowerCase().includes(q))
    )
    .slice(0, 30);
}, [buscador, productos, categoriaSeleccionada]);

  function agregarAlCarrito(p: Producto) {
    setCarrito((prev) => {
      const i = prev.findIndex((x) => x.producto_id === p.id);
      if (i >= 0) {
        const copia = [...prev];
        copia[i] = { ...copia[i], cantidad: Number((copia[i].cantidad + 1).toFixed(2)) };
        return copia;
      }
      return [
        ...prev,
        {
          key: `${p.id}-${Date.now()}`,
          producto_id: p.id,
          nombre: p.nombre,
          precio_unitario: p.precio_venta,
          cantidad: 1,
        },
      ];
    });
  }

  function actualizarCantidad(key: string, valor: number) {
    if (isNaN(valor) || valor <= 0) return;
    setCarrito((prev) => prev.map((x) => (x.key === key ? { ...x, cantidad: Number(valor.toFixed(2)) } : x)));
  }

  function removerItem(key: string) {
    setCarrito((prev) => prev.filter((x) => x.key !== key));
  }

  async function onRegistrarVenta() {
    try {
      setError(null);
      if (!carrito.length) return;
      const items = carrito.map((c) => ({
        producto_id: c.producto_id,
        cantidad: c.cantidad,
        precio_unitario: c.precio_unitario,
      }));
      const fechaISO = new Date(`${fecha}T00:00:00`).toISOString();
      const ventaId = await registrarVenta(items, fechaISO);

      // Refrescar UI
      const prods = await obtenerProductos();
      setProductos(prods);
      const vs = await obtenerVentasResumen(20);
      setVentas(vs);
      setCarrito([]);
      alert(`✅ Venta #${ventaId} registrada correctamente`);
    } catch (e: any) {
      setError(e?.message ?? 'Error al registrar la venta');
    }
  }

  async function toggleDetalles(ventaId: number) {
    if (ventaExpandida === ventaId) {
      setVentaExpandida(null);
      return;
    }
    setVentaExpandida(ventaId);
    if (!detallesVenta[ventaId]) {
      const dets = await obtenerDetalleDeVenta(ventaId);
      setDetallesVenta((prev) => ({ ...prev, [ventaId]: dets }));
    }
  }

  if (loading) return <div className="p-4">Cargando Ventas…</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ventas</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {/* Panel superior: buscador + resultados */}
      <div className="rounded-xl border bg-white p-4 shadow-sm mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Buscar producto</label>
            <input
              value={buscador}
              onChange={(e) => setBuscador(e.target.value)}
              placeholder="Escribe un nombre…"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border px-3 py-2"
            />
          </div>
        </div>

 {/* Filtro de categorías */}
<div className="flex flex-wrap gap-2 mb-3">
  <button
    onClick={() => setCategoriaSeleccionada(null)}
    className={`px-3 py-1 rounded-full border text-sm ${
      categoriaSeleccionada === null
        ? "bg-emerald-600 text-white"
        : "bg-white hover:bg-emerald-50"
    }`}
  >
    Todas
  </button>
  {categorias.map((cat) => (
    <button
      key={cat}
      onClick={() => setCategoriaSeleccionada(cat)}
      className={`px-3 py-1 rounded-full border text-sm ${
        categoriaSeleccionada === cat
          ? "bg-emerald-600 text-white"
          : "bg-white hover:bg-emerald-50"
      }`}
    >
      {cat}
    </button>
  ))}
</div>
        {/* Lista de productos */}
       <div className="mt-4 grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-2">
         {productosFiltrados.map((p) => (
                <button
      key={p.id}
      onClick={() => agregarAlCarrito(p)}
      className="flex flex-col items-center justify-center text-center rounded-lg border border-gray-200 
                 p-2 md:p-3 bg-white hover:bg-emerald-50 active:scale-95 transition shadow-sm"
      title={`Agregar ${p.nombre}`}
    >
      <span className="font-medium text-gray-800 text-xs md:text-sm truncate w-full">
        {p.nombre}
      </span>
      <span className="text-emerald-600 font-semibold text-xs md:text-sm mt-1">
        {money(p.precio_venta)}
      </span>
    </button>
          ))}
        </div>
      </div>

{/* 🛒 Carrito */}
<div className="p-4 bg-white rounded-lg shadow">
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-lg font-semibold">Carrito</h2>

    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-gray-700">
        Total: <span className="text-emerald-600">${total.toFixed(2)}</span>
      </span>
      <button
        onClick={() => setMostrarConfirmacion(true)}
        disabled={carrito.length === 0}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
      >
        Registrar venta
      </button>
    </div>
  </div>

  {carrito.length === 0 ? (
    <p className="text-sm opacity-70">Aún no has agregado productos.</p>
  ) : (
    <>
      <div className="flex-1 overflow-y-auto border-t border-b mb-3">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr className="border-b text-left">
              <th className="p-2">Producto</th>
              <th className="p-2">Cantidad</th>
              <th className="p-2 text-center">$ Unit</th>
              <th className="p-2 text-center">$ Subtotal</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {carrito.map((it) => (
              <tr key={it.key} className="border-b last:border-0">
                <td className="p-2">{it.nombre}</td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.01"
                    min={0.01}
                    value={it.cantidad}
                    onChange={(e) =>
                      actualizarCantidad(it.key, Number(e.target.value))
                    }
                    className="w-24 rounded border px-2 py-1 text-center"
                  />
                </td>
                <td className="p-2 text-center">{money(it.precio_unitario)}</td>
                <td className="p-2 text-center">
                  {money(it.cantidad * it.precio_unitario)}
                </td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => removerItem(it.key)}
                    className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )}

  {/* Modal de confirmación */}
  {mostrarConfirmacion && (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-80">
        <h2 className="text-lg font-semibold mb-3 text-center">Confirmar venta</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          Total: <b>${total.toFixed(2)}</b><br /><br />
          ¿Estás seguro de registrar esta venta?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setMostrarConfirmacion(false)}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onRegistrarVenta();
              setMostrarConfirmacion(false);
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )}
</div>


      {/* Historial de ventas */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Ventas recientes</h2>
        {ventas.length === 0 ? (
          <p className="text-sm opacity-70">Aún no has registrado ventas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="p-2">ID</th>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Ítems</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <>
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="p-2">#{v.id}</td>
                      <td className="p-2">{new Date(v.fecha).toLocaleString()}</td>
                      <td className="p-2">{v.items}</td>
                      <td className="p-2">{money(v.total)}</td>
                      <td className="p-2">
                        <button
                          onClick={() => toggleDetalles(v.id)}
                          className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                        >
                          {ventaExpandida === v.id ? 'Ocultar' : 'Ver detalles'}
                        </button>
                      </td>
                    </tr>
                    {ventaExpandida === v.id && (
                      <tr className="bg-gray-50/40">
                        <td colSpan={5} className="p-3">
                          {!detallesVenta[v.id] ? (
                            <div>Cargando…</div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs">
                                <thead>
                                  <tr className="border-b bg-gray-100 text-left">
                                    <th className="p-2">Producto</th>
                                    <th className="p-2">Cantidad</th>
                                    <th className="p-2">$ Unit</th>
                                    <th className="p-2">$ Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detallesVenta[v.id].map((d: any) => (
                                    <tr key={d.id} className="border-b last:border-0">
                                      <td className="p-2">{d.producto_nombre ?? `#${d.producto_id}`}</td>
                                      <td className="p-2">{d.cantidad}</td>
                                      <td className="p-2">{money(d.precio_unitario)}</td>
                                      <td className="p-2">{money(d.subtotal)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
   </div>   // 🔹 este cierre adicional
  );
}