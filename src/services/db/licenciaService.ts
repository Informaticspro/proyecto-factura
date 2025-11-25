import { db, dexieDB, isNative, initSQLite } from "./database";

const LICENCIA_ID = 1;
// Licencia “maestra” que tú le das al cliente
const CLAVE_MAESTRA = "VENDIX-2025-PRO"; // cámbiala a algo tuyo

export async function guardarLicencia(clave: string) {
  await initSQLite();

  const ahora = new Date().toISOString();
  const vence = null; // o calcula una fecha si quieres vencimiento

  if (isNative && db) {
    await db.run(
      `INSERT OR REPLACE INTO licencia (id, clave, activada_en, vence_el)
       VALUES (?, ?, ?, ?)`,
      [LICENCIA_ID, clave, ahora, vence]
    );
  } else {
    await (dexieDB as any).table("licencia").put({
      id: LICENCIA_ID,
      clave,
      activada_en: ahora,
      vence_el: vence,
    });
  }
}

export async function obtenerLicencia() {
  await initSQLite();

  if (isNative && db) {
    const res = await db.query(`SELECT * FROM licencia WHERE id = ?`, [LICENCIA_ID]);
    return res.values?.[0] ?? null;
  } else {
    return await (dexieDB as any).table("licencia").get(LICENCIA_ID);
  }
}

export async function estaLicenciada(): Promise<boolean> {
  const lic = await obtenerLicencia();
  if (!lic) return false;

  // Verificar clave
  if (lic.clave !== CLAVE_MAESTRA) return false;

  // Si quieres vencimiento:
  if (lic.vence_el) {
    const hoy = new Date();
    const vence = new Date(lic.vence_el);
    if (hoy > vence) return false;
  }

  return true;
}
