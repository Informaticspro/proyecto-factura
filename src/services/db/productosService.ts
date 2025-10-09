import { db, isNative, dexieDB } from "./database";

export type Producto = {
  id: number;
  nombre: string;
  precio_costo: number;
  precio_venta: number;
  unidad_medida: string;
  stock: number;
};

// ➕ Insertar
export async function insertarProducto(producto: Omit<Producto, "id">) {
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

// 📋 Obtener todos
export async function obtenerProductos(): Promise<Producto[]> {
  if (isNative) {
    if (!db) return [];
    const res = await db.query("SELECT * FROM productos ORDER BY id DESC");
    return res.values ?? [];
  } else {
    return await dexieDB.table("productos").orderBy("id").reverse().toArray();
  }
}

// ✏️ Actualizar
export async function actualizarProducto(id: number, campos: Partial<Producto>) {
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

// 🗑️ Eliminar
export async function eliminarProducto(id: number) {
  if (isNative) {
    if (!db) return;
    await db.run(`DELETE FROM productos WHERE id = ?`, [id]);
  } else {
    await dexieDB.table("productos").delete(id);
  }
}
