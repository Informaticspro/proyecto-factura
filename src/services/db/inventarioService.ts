import { db, isNative, dexieDB, initSQLite } from "./database";

export async function registrarMovimientoInventario(
  producto_id: number,
  tipo: "entrada" | "salida",
  cantidad: number,
  motivo = ""
) {
  await initSQLite();

  if (isNative && db) {
    await db.run(
      "INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo) VALUES (?, ?, ?, ?)",
      [producto_id, tipo, cantidad, motivo]
    );

    const factor = tipo === "entrada" ? 1 : -1;
    await db.run(
      "UPDATE productos SET stock = stock + (? * ?) WHERE id = ?",
      [factor, cantidad, producto_id]
    );
  } else {
    const tMov = (dexieDB as any).table("movimientos_inventario");
    const tProd = (dexieDB as any).table("productos");

    await (dexieDB as any).transaction("rw", tMov, tProd, async () => {
      await tMov.add({
        producto_id,
        tipo,
        cantidad,
        motivo,
        fecha: new Date().toISOString(),
      });
      const p = await tProd.get(producto_id);
      await tProd.update(producto_id, {
        stock:
          (p.stock || 0) + (tipo === "entrada" ? cantidad : -cantidad),
      });
    });
  }
}

export async function obtenerMovimientosInventario(limit = 50) {
  if (isNative && db) {
    const res = await db.query(
      `SELECT m.*, p.nombre AS producto_nombre
       FROM movimientos_inventario m
       JOIN productos p ON p.id = m.producto_id
       ORDER BY m.id DESC
       LIMIT ?`,
      [limit]
    );
    return res.values ?? [];
  } else {
    const tMov = (dexieDB as any).table("movimientos_inventario");
    const tProd = (dexieDB as any).table("productos");
    const movimientos = await tMov
      .orderBy("id")
      .reverse()
      .limit(limit)
      .toArray();
    for (const m of movimientos) {
      const p = await tProd.get(m.producto_id);
      m.producto_nombre = p?.nombre;
    }
    return movimientos;
  }
}
