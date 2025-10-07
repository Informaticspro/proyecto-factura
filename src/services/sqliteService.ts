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
