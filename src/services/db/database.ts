import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import Dexie from "dexie";

export const DB_NAME = "facturacionDB";
export let db: SQLiteDBConnection | null = null;
export const isNative = Capacitor.isNativePlatform();

/* =======================================================
   🌐 Dexie (modo navegador)
   ======================================================= */
export const dexieDB = new Dexie(DB_NAME);
dexieDB.version(4).stores({
  productos: "++id, nombre, categoria, precio_costo, precio_venta, unidad_medida, stock",
  categorias: "++id, nombre",
  ventas: "++id, fecha, total",
  detalle_ventas: "++id, venta_id, producto_id, cantidad, precio_unitario, subtotal",
  movimientos_inventario: "++id, producto_id, tipo, cantidad, fecha, motivo",
});
dexieDB.open().then(() => console.log("✅ Dexie inicializada"));

/* =======================================================
   🧩 Inicializar SQLite
   ======================================================= */
export async function initSQLite() {
  if (!isNative) {
    console.log("🌐 Modo navegador: usando Dexie como base local.");
    return null;
  }

  try {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    console.log("🔍 Plataforma detectada:", Capacitor.getPlatform());

    // Verifica si hay conexión existente y activa
    const existingConn = await sqlite.isConnection(DB_NAME, false);
    if (existingConn.result) {
      const consistency = await sqlite.checkConnectionsConsistency();
      if (consistency.result) {
        console.log("🔁 Reutilizando conexión activa con", DB_NAME);
        db = await sqlite.retrieveConnection(DB_NAME, false);
        return db;
      }
    }

    // Si no existe o no está activa, crea una nueva
    console.log("🆕 Creando nueva conexión SQLite con", DB_NAME);
    db = await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);
    await db.open();

    // Crear tablas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        categoria TEXT,
        precio_costo REAL NOT NULL,
        precio_venta REAL NOT NULL,
        unidad_medida TEXT,
        stock INTEGER DEFAULT 0
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL
      );
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL DEFAULT (datetime('now')),
        total REAL NOT NULL CHECK (total >= 0)
      );
    `);
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
    await db.execute(`
      CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        cantidad REAL NOT NULL CHECK (cantidad > 0),
        fecha TEXT NOT NULL DEFAULT (datetime('now')),
        motivo TEXT,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
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
   🧠 Ejecutar SQL genérico
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

/* =======================================================
   🔒 Cerrar conexión
   ======================================================= */
export async function cerrarConexion() {
  if (isNative && db) {
    await db.close();
    console.log("🔒 Conexión SQLite cerrada");
  }
}

/* =======================================================
   📦 Categorías
   ======================================================= */
export async function obtenerCategorias() {
  if (isNative) {
    if (!db) return [];
    const res = await db.query("SELECT * FROM categorias ORDER BY nombre ASC");
    return res.values ?? [];
  } else {
    return await dexieDB.table("categorias").orderBy("nombre").toArray();
  }
}

export async function insertarCategoria(nombre: string) {
  if (!nombre.trim()) return;
  if (isNative) {
    if (!db) return;
    await db.run(`INSERT OR IGNORE INTO categorias (nombre) VALUES (?)`, [nombre]);
  } else {
    await dexieDB.table("categorias").put({ nombre });
  }
}
