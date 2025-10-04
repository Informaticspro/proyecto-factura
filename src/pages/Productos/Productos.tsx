import { useEffect, useState } from "react";
import {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  Producto,
} from "../../services/productosService";

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [formData, setFormData] = useState<{
    nombre: string;
    precio_costo: number | string;
    precio_venta: number | string;
    unidad_medida: string;
    stock: number | string;
  }>({
    nombre: "",
    precio_costo: "",
    precio_venta: "",
    unidad_medida: "unidad",
    stock: "",
  });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function cargar() {
    const data = await listarProductos();
    setProductos(data);
  }

  useEffect(() => {
    cargar();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  async function handleSubmit() {
    const precio_costo = Number(formData.precio_costo);
    const precio_venta = Number(formData.precio_venta);
    const stock = Number(formData.stock);

    if (
      !formData.nombre ||
      precio_costo <= 0 ||
      precio_venta <= 0 ||
      stock < 0
    ) {
      setMensaje("⚠️ Todos los campos son obligatorios y deben ser válidos.");
      return;
    }

    if (editandoId) {
      await actualizarProducto({
        ...formData,
        id: editandoId,
        precio_costo,
        precio_venta,
        stock,
      });
      setMensaje("✅ Producto actualizado con éxito");
    } else {
      await crearProducto({
        ...formData,
        precio_costo,
        precio_venta,
        stock,
      });
      setMensaje("✅ Producto agregado con éxito");
    }

    setFormData({
      nombre: "",
      precio_costo: "",
      precio_venta: "",
      unidad_medida: "unidad",
      stock: "",
    });
    setEditandoId(null);
    await cargar();
    setTimeout(() => setMensaje(null), 3000);
  }

  async function handleEditar(p: Producto) {
    setFormData({
      nombre: p.nombre,
      precio_costo: p.precio_costo,
      precio_venta: p.precio_venta,
      unidad_medida: p.unidad_medida,
      stock: p.stock,
    });
    setEditandoId(p.id || null);
  }

  async function handleEliminar(id: number) {
    if (confirm("¿Seguro que quieres eliminar este producto?")) {
      await eliminarProducto(id);
      await cargar();
      setMensaje("🗑️ Producto eliminado");
      setTimeout(() => setMensaje(null), 3000);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Productos</h1>

      {/* Mensajes */}
      {mensaje && (
        <div className="mb-4 p-3 rounded bg-blue-100 text-blue-800 text-sm">
          {mensaje}
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white shadow-md rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editandoId ? "Editar Producto" : "Agregar Producto"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            type="number"
            name="precio_costo"
            placeholder="Precio Costo"
            value={formData.precio_costo}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <input
            type="number"
            name="precio_venta"
            placeholder="Precio Venta"
            value={formData.precio_venta}
            onChange={handleChange}
            className="border p-2 rounded"
          />

          <select
            name="unidad_medida"
            value={formData.unidad_medida}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="unidad">Unidad</option>
            <option value="kilo">Kilo</option>
            <option value="libra">Libra</option>
          </select>

          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={formData.stock}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSubmit}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            {editandoId ? "Actualizar" : "Agregar"}
          </button>
          {editandoId && (
            <button
              onClick={() => {
                setFormData({
                  nombre: "",
                  precio_costo: "",
                  precio_venta: "",
                  unidad_medida: "unidad",
                  stock: "",
                });
                setEditandoId(null);
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de productos */}
      <table className="min-w-full bg-white border border-gray-200 shadow-md rounded">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="py-2 px-4 border-b">Nombre</th>
            <th className="py-2 px-4 border-b">Costo</th>
            <th className="py-2 px-4 border-b">Venta</th>
            <th className="py-2 px-4 border-b">Unidad</th>
            <th className="py-2 px-4 border-b">Stock</th>
            <th className="py-2 px-4 border-b text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
  {productos.map((p) => (
    <tr key={p.id} className="hover:bg-gray-50">
      <td className="py-2 px-4 border-b">{p.nombre}</td>
      <td className="py-2 px-4 border-b">
        ${p.precio_costo !== undefined ? p.precio_costo.toFixed(2) : "0.00"}
      </td>
      <td className="py-2 px-4 border-b">
        ${p.precio_venta !== undefined ? p.precio_venta.toFixed(2) : "0.00"}
      </td>
      <td className="py-2 px-4 border-b">{p.unidad_medida}</td>
      <td className="py-2 px-4 border-b">{p.stock}</td>
      <td className="py-2 px-4 border-b text-center space-x-2">
        <button
          onClick={() => handleEditar(p)}
          className="bg-yellow-400 px-3 py-1 rounded text-white hover:bg-yellow-500 transition"
        >
          Editar
        </button>
        <button
          onClick={() => handleEliminar(p.id!)}
          className="bg-red-500 px-3 py-1 rounded text-white hover:bg-red-600 transition"
        >
          Eliminar
        </button>
      </td>
    </tr>
  ))}
  {productos.length === 0 && (
    <tr>
      <td colSpan={6} className="text-center py-4 text-gray-500">
        No hay productos registrados.
      </td>
    </tr>
  )}
</tbody>
      </table>
    </div>
  );
}
