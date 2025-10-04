import { getDBConnection } from "./database";

export async function insertarProducto(codigo: string, nombre: string, descripcion: string, precio: number, cantidad: number, unidad: string) {
  const db = await getDBConnection();
  await db.run(
    "INSERT INTO productos (codigo, nombre, descripcion, precio, cantidad, unidad) VALUES (?, ?, ?, ?, ?, ?)",
    [codigo, nombre, descripcion, precio, cantidad, unidad]
  );
  await db.close();
}

export async function obtenerProductos() {
  const db = await getDBConnection();
  const res = await db.query("SELECT * FROM productos");
  await db.close();
  return res.values || [];
}

export async function actualizarProducto(id: number, nombre: string, descripcion: string, precio: number, cantidad: number, unidad: string) {
  const db = await getDBConnection();
  await db.run(
    "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, cantidad = ?, unidad = ? WHERE id = ?",
    [nombre, descripcion, precio, cantidad, unidad, id]
  );
  await db.close();
}

export async function eliminarProducto(id: number) {
  const db = await getDBConnection();
  await db.run("DELETE FROM productos WHERE id = ?", [id]);
  await db.close();
}
