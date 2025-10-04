import { openDB } from "idb";

// Definición de la interfaz Producto
export interface Producto {
  id?: number;
  nombre: string;
  precio_costo: number;   // 👈 nuevo campo
  precio_venta: number;   // 👈 nuevo campo
  unidad_medida: string;
  stock: number;
  creado_en?: string;
}

// Inicializa la base de datos
async function getDB() {
  return await openDB("facturacionDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("productos")) {
        const store = db.createObjectStore("productos", {
          keyPath: "id",
          autoIncrement: true,
        });
        // índices útiles para búsquedas
        store.createIndex("nombre", "nombre", { unique: false });
      }
    },
  });
}

// 📌 Crear producto
export async function crearProducto(producto: Producto) {
  const db = await getDB();
  producto.creado_en = new Date().toISOString();
  await db.add("productos", producto);
}

// 📌 Listar productos
export async function listarProductos(): Promise<Producto[]> {
  const db = await getDB();
  return await db.getAll("productos");
}

// 📌 Actualizar producto
export async function actualizarProducto(producto: Producto) {
  const db = await getDB();
  await db.put("productos", producto);
}

// 📌 Eliminar producto
export async function eliminarProducto(id: number) {
  const db = await getDB();
  await db.delete("productos", id);
}
