import { CapacitorSQLite, SQLiteDBConnection } from "@capacitor-community/sqlite";

const sqlite = CapacitorSQLite;

export async function getDBConnection(): Promise<SQLiteDBConnection> {
  // Paso 1: Crear conexión
  await sqlite.createConnection({
    database: "facturacionDB",
    version: 1,
    encrypted: false,
    mode: "no-encryption",
    readonly: false,
  });

  // Paso 2: Abrir conexión real
  const db = new SQLiteDBConnection("facturacionDB", false, sqlite);
  await db.open();

  // Paso 3: Crear tabla si no existe
  await db.execute(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      unidad_medida TEXT NOT NULL,
      stock REAL DEFAULT 0,
      creado_en TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

export async function closeDB() {
  await sqlite.closeConnection({
  database: "facturacionDB",
  readonly: false,  // 👈 importante
});
}
