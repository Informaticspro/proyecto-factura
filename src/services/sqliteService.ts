import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import Dexie from "dexie";

const DB_NAME = "facturacionDB";
let db: SQLiteDBConnection | null = null;
const isNative = Capacitor.isNativePlatform();

/* =======================================================
   🌐 Dexie (fallback web)
   ======================================================= */
const dexieDB = new Dexie(DB_NAME);
dexieDB.version(1).stores({
  productos: "++id, nombre, precio_costo, precio_venta, unidad_medida, stock",
});

/* =======================================================
   📦 Inicializar base de datos
   ======================================================= */
export async function initSQLite() {
  if (!isNative) {
    console.log("🌐 Modo navegador detectado → usando Dexie como base local.");
    return null;
  }

  try {
    const sqlite = new SQLiteConnection(CapacitorSQLite);

    // Verifica si ya existe una conexión
    const existingConn = await sqlite.isConnection(DB_NAME, false);
    db = existingConn.result
      ? await sqlite.retrieveConnection(DB_NAME, false)
      : await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);

    await db.open();

    // Crear tabla productos
    await db.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio_costo REAL NOT NULL,
        precio_venta REAL NOT NULL,
        unidad_medida TEXT,
        stock INTEGER DEFAULT 0
      );
    `);


    console.log("✅ Base de datos SQLite inicializada correctamente");
    return db;
  } catch (error) {
    console.error("❌ Error inicializando SQLite:", error);
    return null;
  }
}

    const SQL_CREATE_VENTAS = `
CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  total REAL NOT NULL CHECK (total >= 0)
);
`;

const SQL_CREATE_DETALLE = `
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
CREATE INDEX IF NOT EXISTS idx_detalle_venta_id ON detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_producto_id ON detalle_ventas(producto_id);
`;
3






/* =======================================================
   🔹 CRUD: Productos
   ======================================================= */

// ➕ Insertar producto
export async function insertarProducto(producto: {
  nombre: string;
  precio_costo: number;
  precio_venta: number;
  unidad_medida: string;
  stock: number;
}) {
  if (isNative) {
    if (!db) return;
    await db.run(
      `INSERT INTO productos (nombre, precio_costo, precio_venta, unidad_medida, stock)
       VALUES (?, ?, ?, ?, ?)`,
      [
        producto.nombre,
        producto.precio_costo,
        producto.precio_venta,
        producto.unidad_medida,
        producto.stock,
      ]
    );
  } else {
    await dexieDB.table("productos").add(producto);
  }
}

// 📋 Obtener lista de productos
export async function obtenerProductos() {
  if (isNative) {
    if (!db) return [];
    const res = await db.query("SELECT * FROM productos ORDER BY id DESC");
    return res.values ?? [];
  } else {
    return await dexieDB.table("productos").orderBy("id").reverse().toArray();
  }
}

// ✏️ Actualizar producto
export async function actualizarProducto(
  id: number,
  campos: Partial<{
    nombre: string;
    precio_costo: number;
    precio_venta: number;
    unidad_medida: string;
    stock: number;
  }>
) {
  if (isNative) {
    if (!db) return;
    const keys = Object.keys(campos);
    const values = Object.values(campos);
    const setClause = keys.map((k) => `${k} = ?`).join(", ");
    await db.run(`UPDATE productos SET ${setClause} WHERE id = ?`, [
      ...values,
      id,
    ]);
  } else {
    await dexieDB.table("productos").update(id, campos);
  }
}

// 🗑️ Eliminar producto
export async function eliminarProducto(id: number) {
  if (isNative) {
    if (!db) return;
    await db.run(`DELETE FROM productos WHERE id = ?`, [id]);
  } else {
    await dexieDB.table("productos").delete(id);
  }
}

/* =======================================================
   ⚙️ Utilidades adicionales
   ======================================================= */

export async function cerrarConexion() {
  if (isNative && db) {
    await db.close();
    console.log("🔒 Conexión SQLite cerrada");
  }
}

/* =======================================================
   🧠 Ejecutar consultas SQL personalizadas
   ======================================================= */
export async function ejecutarConsulta(sql: string, params: any[] = []) {
  const connection = await initSQLite();
  if (!connection) return [];
  try {
    const result = await connection.query(sql, params);
    return result.values ?? [];
  } catch (error) {
    console.error("Error ejecutando SQL:", error);
    return [];
  }
}

export type Producto = {
  id: number;
  nombre: string;
  precio_costo: number;
  precio_venta: number;
  unidad_medida: string;
  stock: number;
};

export type Venta = {
  id: number;
  fecha: string; // ISO string
  total: number;
};

export type DetalleVenta = {
  id: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto_nombre?: string; // opcional para joins
};

export async function initVentasSchema() {
  // Asegura que la DB esté iniciada
  await initSQLite();

  if (db) {
    await db.execute(SQL_CREATE_VENTAS);
    await db.execute(SQL_CREATE_DETALLE);
  } else {
    // Fallback Dexie: ampliar el esquema
    if (!dexieDB.verno || dexieDB.verno < 2) {
      // Definir / actualizar stores en versión 2
      dexieDB.version(2).stores({
        productos: '++id, nombre, precio_costo, precio_venta, unidad_medida, stock',
        ventas: '++id, fecha, total',
        detalle_ventas: '++id, venta_id, producto_id, cantidad, precio_unitario, subtotal'
      });
    }
    // Nota: Dexie maneja la creación de stores automáticamente si no existen
    await dexieDB.open();
  }
}
export type ItemVentaInput = {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
};

export async function registrarVenta(
  items: ItemVentaInput[],
  fechaISO?: string
): Promise<number> {
  await initVentasSchema();
  if (!items.length) throw new Error('No hay productos en la venta');

  // Calcular totales
  const detalles = items.map((it) => ({
    ...it,
    subtotal: Number((it.cantidad * it.precio_unitario).toFixed(2)),
  }));
  const total = Number(
    detalles.reduce((acc, d) => acc + d.subtotal, 0).toFixed(2)
  );

  if (db) {
    // --- Ruta SQLite nativa ---
    try {
      await db.execute('BEGIN;');

      const ins: any = await db.run(
        'INSERT INTO ventas (fecha, total) VALUES (?, ?);',
        [fechaISO ?? new Date().toISOString(), total]
      );
      const ventaId = ins.lastId as number;

      for (const d of detalles) {
        // Insertar detalle
        await db.run(
          'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?,?,?,?,?);',
          [ventaId, d.producto_id, d.cantidad, d.precio_unitario, d.subtotal]
        );
        // Descontar stock con control de concurrencia
        const upd = await db.run(
          'UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?;',
          [d.cantidad, d.producto_id, d.cantidad]
        );
        if (!upd.changes || upd.changes.changes === 0) {
          throw new Error('STOCK_INSUFICIENTE');
        }
      }

      await db.execute('COMMIT;');
      return ventaId;
    } catch (e) {
      await db.execute('ROLLBACK;');
      if ((e as Error).message === 'STOCK_INSUFICIENTE') {
        throw new Error('Stock insuficiente en uno o más productos');
      }
      throw e;
    }
  } else {
    // --- Fallback Dexie (navegador) ---
    const tProductos = (dexieDB as any).table('productos');
    const tVentas = (dexieDB as any).table('ventas');
    const tDetalle = (dexieDB as any).table('detalle_ventas');

    return await (dexieDB as any).transaction('rw', tProductos, tVentas, tDetalle, async () => {
      // Verificar stock primero
      for (const d of detalles) {
        const p = await tProductos.get(d.producto_id);
        if (!p || p.stock < d.cantidad) {
          throw new Error(`Stock insuficiente para producto #${d.producto_id}`);
        }
      }

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
        await tProductos.update(d.producto_id, (p: any) => ({ ...p, stock: Number((p.stock - d.cantidad).toFixed(2)) }));
      }

      return ventaId as number;
    });
  }
}

export async function obtenerVentasResumen(limit = 25): Promise<{
  id: number; fecha: string; total: number; items: number;
}[]> {
  await initVentasSchema();

  if (db) {
    const res = await db.query(
      `SELECT v.id, v.fecha, v.total,
              (SELECT COUNT(*) FROM detalle_ventas dv WHERE dv.venta_id = v.id) AS items
       FROM ventas v
       ORDER BY v.id DESC
       LIMIT ?;`,
      [limit]
    );
    return res.values as any[];
  } else {
    const tVentas = (dexieDB as any).table('ventas');
    const tDetalle = (dexieDB as any).table('detalle_ventas');
    const ventas = await tVentas.orderBy('id').reverse().limit(limit).toArray();
    const salida = [] as any[];
    for (const v of ventas) {
      const items = await tDetalle.where('venta_id').equals(v.id).count();
      salida.push({ id: v.id, fecha: v.fecha, total: v.total, items });
    }
    return salida;
  }
}

export async function obtenerDetalleDeVenta(ventaId: number): Promise<DetalleVenta[]> {
  await initVentasSchema();

  if (db) {
    const res = await db.query(
      `SELECT dv.*, p.nombre AS producto_nombre
       FROM detalle_ventas dv
       JOIN productos p ON p.id = dv.producto_id
       WHERE dv.venta_id = ?
       ORDER BY dv.id ASC;`,
      [ventaId]
    );
    return res.values as any[];
  } else {
    const tDetalle = (dexieDB as any).table('detalle_ventas');
    const tProductos = (dexieDB as any).table('productos');
    const dets = await tDetalle.where('venta_id').equals(ventaId).sortBy('id');
    for (const d of dets) {
      const p = await tProductos.get(d.producto_id);
      d.producto_nombre = p?.nombre;
    }
    return dets as any[];
  }
}

// Utilidad para obtener un producto por ID (para el componente)
export async function obtenerProductoPorId(id: number): Promise<Producto | undefined> {
  if (db) {
    const r = await db.query('SELECT * FROM productos WHERE id = ?;', [id]);
    return (r.values as any[])[0];
  } else {
    const t = (dexieDB as any).table('productos');
    return await t.get(id);
  }
}