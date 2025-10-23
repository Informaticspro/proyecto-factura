// src/pages/Ventas/Ventas.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  initVentasSchema,
  obtenerProductos,
  //registrarVenta,
  obtenerVentasResumen,
  obtenerDetalleDeVenta,
  obtenerCategorias,
 // ejecutarTransaccion,
  type Producto,
} from '../../services/db';
import { db } from "../../services/db"; // ✅ <-- Agregar esta línea
import React from "react";


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
const [mostrarCarrito, setMostrarCarrito] = useState(false);

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


// function onRegistrarVenta() para registrar la venta en dixie o sqlite
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
    const total = carrito.reduce(
      (acc, it) => acc + it.cantidad * it.precio_unitario,
      0
    );

    // ✅ Detectar si estamos en modo navegador o nativo
    const isNative = (window as any).Capacitor?.isNativePlatform?.() ?? false;

    if (!isNative) {
      console.log("📦 Registrando venta con Dexie (modo navegador)");
      const { dexieDB } = await import("../../services/db");

      const ventaId = await dexieDB.table("ventas").add({
        fecha: fechaISO,
        total,
      });

      for (const item of items) {
        const subtotal = item.cantidad * item.precio_unitario;
        await dexieDB.table("detalle_ventas").add({
          venta_id: ventaId,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal,
        });
      }
    } else {
      console.log("🧩 Registrando venta con SQLite (modo nativo)");
      if (!db) throw new Error("No hay conexión con la base de datos");

      let sql = `
        BEGIN TRANSACTION;
        INSERT INTO ventas (fecha, total) VALUES ('${fechaISO}', ${total});
      `;

      const nextVentaIdQuery =
        "SELECT IFNULL(MAX(id), 0) + 1 AS nextId FROM ventas;";
      const nextVenta = await db.query(nextVentaIdQuery);
      const ventaId = nextVenta.values?.[0]?.nextId || 1;

      for (const item of items) {
        const subtotal = item.cantidad * item.precio_unitario;
        sql += `
          INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
          VALUES (${ventaId}, ${item.producto_id}, ${item.cantidad}, ${item.precio_unitario}, ${subtotal});
        `;
      }

      sql += "COMMIT;";
      await db.execute(sql);
    }

    alert("✅ Venta registrada correctamente");

    // 🔄 Refrescar la interfaz
    const prods = await obtenerProductos();
    setProductos(prods);
    const vs = await obtenerVentasResumen(20);
    setVentas(vs);
    setCarrito([]);
  } catch (e: any) {
    console.error("❌ Error al registrar la venta:", e);
    await db?.execute?.("ROLLBACK;");
    setError(e?.message ?? "Error al registrar la venta");
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
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
  {/* 🔍 Buscador */}
  <div className="flex-1">
    <label className="block text-sm font-medium mb-1">Buscar producto</label>
    <input
      value={buscador}
      onChange={(e) => setBuscador(e.target.value)}
      placeholder="Escribe un nombre…"
      className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
    />
  </div>

  {/* 📅 Fecha + 🛒 Carrito juntos */}
  <div className="flex items-end gap-2">
    <div>
      <label className="block text-sm font-medium mb-1">Fecha</label>
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="rounded-lg border px-3 py-2"
      />
    </div>

    {/* 🛒 Botón carrito */}
    <button
      onClick={() => setMostrarCarrito(true)}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 transition-all"
    >
      <span className="text-lg">🛒</span>
      <span className="hidden sm:inline">Ver carrito</span>
      {carrito.length > 0 && (
        <span className="ml-1 bg-white text-emerald-700 font-bold rounded-full px-2 py-0.5 text-xs">
          {carrito.length}
        </span>
      )}
    </button>
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


      {/* 🧱  Grid de productos (diseño adaptativo moderno) */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {productosFiltrados.map((p) => (
        <button
      key={p.id}
      onClick={() => agregarAlCarrito(p)}
      className="group flex flex-col justify-between rounded-2xl p-3 sm:p-4 text-left 
                 bg-gradient-to-b from-white to-gray-50 border border-gray-200 shadow-md 
                 hover:shadow-emerald-400/30 hover:scale-[1.03] transition-transform duration-200"
      title={`Agregar ${p.nombre}`}
    >
      <div>
        <h3
          className="font-semibold text-gray-800 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-emerald-700"
        >
          {p.nombre}
        </h3>
        <p className="text-xs text-gray-500 mt-1 truncate">{p.categoria}</p>
      </div>

      <div className="flex justify-between items-center mt-3">
        <span className="text-emerald-600 font-bold text-sm sm:text-base">
          {money(p.precio_venta)}
        </span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full ${
            (p as any).stock > 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {(p as any).stock > 0 ? "Disponible" : "Agotado"}
        </span>
      </div>
    </button>
        ))}
        </div>


      </div>

         

{/* 🛒 Panel lateral del carrito */}
{mostrarCarrito && (
  <div className="fixed inset-0 bg-black/40 z-[100] flex justify-end">
  {/* Panel lateral animado */}
  <div
    className="w-full sm:w-96 bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 animate-slide-in"
  >

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">🛒 Tu carrito</h2>
      <button
  onClick={() => setMostrarCarrito(false)}
  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
>
  ×
</button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4">
        {carrito.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            Aún no has agregado productos.
          </p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="p-2 text-left">Producto</th>
                <th className="p-2 text-center">Cant.</th>
                <th className="p-2 text-center">$</th>
                <th className="p-2 text-right">X</th>
              </tr>
            </thead>
            <tbody>
              {carrito.map((it) => (
                <tr key={it.key} className="border-b last:border-0">
                  <td className="p-2 truncate">{it.nombre}</td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      step="0.01"
                      min={0.01}
                      value={it.cantidad}
                      onChange={(e) =>
                        actualizarCantidad(it.key, Number(e.target.value))
                      }
                      className="w-16 rounded border text-center"
                    />
                  </td>
                  <td className="p-2 text-center">
                    {money(it.cantidad * it.precio_unitario)}
                  </td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => removerItem(it.key)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4 flex justify-between items-center bg-gray-50">
        <span className="font-semibold text-gray-700">
          Total: <span className="text-emerald-600">${total.toFixed(2)}</span>
        </span>
        <button
  onClick={() => {
    setMostrarCarrito(false);
    setTimeout(() => setMostrarConfirmacion(true), 200);
  }}
          disabled={carrito.length === 0}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          Registrar
        </button>
      </div>
    </div>
  </div>
)}

{/* 🧾 Modal de confirmación */}
{mostrarConfirmacion && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white p-6 rounded-xl shadow-lg w-80">
     <h2 className="text-lg font-semibold mb-3 text-center text-emerald-700">
      
  Confirmar venta
</h2>
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



 {/* 📜 Historial de ventas con scroll y encabezado fijo */}
<div className="rounded-xl border bg-white p-4 shadow-sm">
  <h2 className="text-lg font-semibold mb-3">Ventas recientes</h2>

  {ventas.length === 0 ? (
    <p className="text-sm opacity-70">Aún no has registrado ventas.</p>
  ) : (
    <div className="relative rounded-lg border overflow-hidden">
      {/* Contenedor con scroll vertical */}
      <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="min-w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
            <tr className="text-left border-b">
              <th className="p-2">ID</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Ítems</th>
              <th className="p-2">Total</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <React.Fragment key={`venta-${v.id}`}>
                <tr className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-2">#{v.id}</td>
                  <td className="p-2 whitespace-nowrap">
                    {new Date(v.fecha).toLocaleString()}
                  </td>
                  <td className="p-2">{v.items}</td>
                  <td className="p-2">{money(v.total)}</td>
                  <td className="p-2">
                    <button
                      onClick={() => toggleDetalles(v.id)}
                      className="rounded-lg border px-3 py-1 hover:bg-gray-100"
                    >
                      {ventaExpandida === v.id ? "Ocultar" : "Ver detalles"}
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
                                  <td className="p-2 truncate">
                                    {d.producto_nombre ?? `#${d.producto_id}`}
                                  </td>
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
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}
</div>

   </div>   // 🔹 este cierre adicional
  );
}