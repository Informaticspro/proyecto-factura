// src/services/db/ventasService.ts
import { db, isNative, dexieDB, initSQLite } from "./database";

/* =======================================================
   🧮 Tipos
   ======================================================= */
export type ItemVentaInput = {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
};

export type VentaResumen = {
  id: number;
  fecha: string; // ISO
  total: number;
  items: number;
};

export type DetalleVenta = {
  id: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto_nombre?: string;
};

/* =======================================================
   🧩 Inicialización de esquema de ventas
   (solo asegura tablas/índices cuando estás en SQLite)
   ======================================================= */
export async function initVentasSchema() {
  await initSQLite();

  if (isNative && db) {
    // Tabla ventas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL DEFAULT (datetime('now')),
        total REAL NOT NULL CHECK (total >= 0)
      );
    `);

    // Tabla detalle_ventas + índices
    await db.execute(`
      CREATE TABLE IF NOT EXISTS detalle_ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        producto_id INTEGER NOT NULL,
        cantidad REAL NOT NULL CHECK (cantidad > 0),
        precio_unitario REAL NOT NULL CHECK (precio_unitario >= 0),
        subtotal REAL NOT NULL CHECK (subtotal >= 0),
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
      );
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_detalle_venta_id ON detalle_ventas(venta_id);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_detalle_producto_id ON detalle_ventas(producto_id);`);

    // Nota: la tabla movimientos_inventario se crea en database.ts
    // Aquí solo la usamos.
    console.log("✅ Esquema de ventas verificado (SQLite)");
  } else {
    console.log("🌐 Esquema de ventas manejado por Dexie (navegador).");
  }
}

/* =======================================================
   💾 Registrar una nueva venta (con movimientos de inventario)
   ======================================================= */
export async function registrarVenta(
  items: ItemVentaInput[],
  fechaISO?: string
): Promise<number> {
  await initSQLite();
  if (!items.length) throw new Error("No hay productos en la venta");

  // Calcular subtotales y total
  const detalles = items.map((it) => ({
    ...it,
    subtotal: Number((it.cantidad * it.precio_unitario).toFixed(2)),
  }));
  const total = Number(detalles.reduce((acc, d) => acc + d.subtotal, 0).toFixed(2));

  // --- SQLite (nativo) ---
  if (isNative && db) {
    try {
      await db.execute("BEGIN;");

      // Insert venta
      const ins = (await db.run(
        "INSERT INTO ventas (fecha, total) VALUES (?, ?)",
        [fechaISO ?? new Date().toISOString(), total]
      )) as any;
      const ventaId = ins.lastId as number;

      // Por cada ítem: detalle + baja de stock + movimiento
      for (const d of detalles) {
        await db.run(
          "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
          [ventaId, d.producto_id, d.cantidad, d.precio_unitario, d.subtotal]
        );

        const upd = await db.run(
          "UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?",
          [d.cantidad, d.producto_id, d.cantidad]
        );
        if (!upd.changes || upd.changes.changes === 0) {
          throw new Error(`Stock insuficiente en producto ID ${d.producto_id}`);
        }

        // Movimiento de inventario (salida por venta)
        await db.run(
          "INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo) VALUES (?, 'salida', ?, ?)",
          [d.producto_id, d.cantidad, `venta #${ventaId}`]
        );
      }

      await db.execute("COMMIT;");
      console.log(`🧾 Venta registrada (SQLite) ID: ${ventaId}`);
      return ventaId;
    } catch (e) {
      await db.execute("ROLLBACK;");
      console.error("❌ Error registrando venta:", e);
      throw e;
    }
  }

  // --- Dexie (fallback web) ---
  const tProductos = (dexieDB as any).table("productos");
  const tVentas = (dexieDB as any).table("ventas");
  const tDetalle = (dexieDB as any).table("detalle_ventas");
  const tMov = (dexieDB as any).table("movimientos_inventario");

  return await (dexieDB as any).transaction(
    "rw",
    tProductos,
    tVentas,
    tDetalle,
    tMov,
    async () => {
      // Crear venta
      const ventaId = await tVentas.add({
        fecha: fechaISO ?? new Date().toISOString(),
        total,
      });

      for (const d of detalles) {
        await tDetalle.add({
          venta_id: ventaId,
          producto_id: d.producto_id,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal,
        });

        const producto = await tProductos.get(d.producto_id);
        if (!producto || producto.stock < d.cantidad) {
          throw new Error(`Stock insuficiente en producto ID ${d.producto_id}`);
        }
        const nuevoStock = Number((producto.stock - d.cantidad).toFixed(2));
        await tProductos.put({ ...producto, stock: nuevoStock });

        // Movimiento de inventario (salida)
        await tMov.add({
          producto_id: d.producto_id,
          tipo: "salida",
          cantidad: d.cantidad,
          fecha: new Date().toISOString(),
          motivo: `venta #${ventaId}`,
        });
      }

      console.log(`🧾 Venta registrada (Dexie) ID: ${ventaId}`);
      return ventaId;
    }
  );
}

/* =======================================================
   📋 Ventas: resumen
   ======================================================= */
export async function obtenerVentasResumen(limit = 25): Promise<VentaResumen[]> {
  if (isNative && db) {
    const res = await db.query(
      `SELECT v.id, v.fecha, v.total,
        (SELECT COUNT(*) FROM detalle_ventas dv WHERE dv.venta_id = v.id) AS items
       FROM ventas v
       ORDER BY v.id DESC
       LIMIT ?`,
      [limit]
    );
    return (res.values as VentaResumen[]) ?? [];
  } else {
    const tVentas = (dexieDB as any).table("ventas");
    const tDetalle = (dexieDB as any).table("detalle_ventas");
    const ventas = await tVentas.orderBy("id").reverse().limit(limit).toArray();

    const salida: VentaResumen[] = [];
    for (const v of ventas) {
      const items = await tDetalle.where("venta_id").equals(v.id).count();
      salida.push({ id: v.id, fecha: v.fecha, total: v.total, items });
    }
    return salida;
  }
}

/* =======================================================
   🔍 Ventas: detalle de una venta
   ======================================================= */
export async function obtenerDetalleDeVenta(ventaId: number): Promise<DetalleVenta[]> {
  if (isNative && db) {
    const res = await db.query(
      `SELECT dv.*, p.nombre AS producto_nombre
       FROM detalle_ventas dv
       JOIN productos p ON p.id = dv.producto_id
       WHERE dv.venta_id = ?
       ORDER BY dv.id ASC;`,
      [ventaId]
    );
    return (res.values as DetalleVenta[]) ?? [];
  } else {
    const tDetalle = (dexieDB as any).table("detalle_ventas");
    const tProductos = (dexieDB as any).table("productos");
    const dets = await tDetalle.where("venta_id").equals(ventaId).sortBy("id");
    for (const d of dets) {
      const p = await tProductos.get(d.producto_id);
      d.producto_nombre = p?.nombre;
    }
    return dets as DetalleVenta[];
  }
}
