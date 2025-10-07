import {
  initSQLite,
  insertarProducto,
  obtenerProductos,
  actualizarProducto,
  eliminarProducto,
} from "./sqliteService";

export interface Producto {
  id?: number;
  nombre: string;
  precio_costo: number;
  precio_venta: number;
  unidad_medida: string;
  stock: number;
  creado_en?: string;
}

/* =======================================================
   📋 Listar productos
   ======================================================= */
export async function listarProductos(): Promise<Producto[]> {
  await initSQLite(); // asegura que la BD esté lista
  const data = await obtenerProductos();
  return data.map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    precio_costo: p.precio_costo,
    precio_venta: p.precio_venta,
    unidad_medida: p.unidad_medida,
    stock: p.stock,
    creado_en: p.creado_en || new Date().toISOString(),
  }));
}

/* =======================================================
   ➕ Crear producto
   ======================================================= */
export async function crearProducto(p: Producto): Promise<void> {
  await initSQLite();
  await insertarProducto({
    nombre: p.nombre,
    precio_costo: Number(p.precio_costo),
    precio_venta: Number(p.precio_venta),
    unidad_medida: p.unidad_medida,
    stock: Number(p.stock),
  });
}

/* =======================================================
   ✏️ Actualizar producto
   ======================================================= */
export async function actualizarProductoServicio(p: Producto): Promise<void> {
  if (!p.id) return;
  await initSQLite();
  await actualizarProducto(p.id, {
    nombre: p.nombre,
    precio_costo: Number(p.precio_costo),
    precio_venta: Number(p.precio_venta),
    unidad_medida: p.unidad_medida,
    stock: Number(p.stock),
  });
}

/* =======================================================
   ❌ Eliminar producto
   ======================================================= */
export async function eliminarProductoServicio(id: number): Promise<void> {
  await initSQLite();
  await eliminarProducto(id);
}
