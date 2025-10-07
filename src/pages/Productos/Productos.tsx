import { useEffect, useState } from "react";
import {
  insertarProducto,
  obtenerProductos,
  actualizarProducto,
  eliminarProducto,
  initSQLite,
} from "../../services/sqliteService";

interface Producto {
  id?: number;
  nombre: string;
  precio_costo: number | string;
  precio_venta: number | string;
  unidad_medida: string;
  stock: number | string;
}

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtrados, setFiltrados] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [formData, setFormData] = useState<Producto>({
    nombre: "",
    precio_costo: "",
    precio_venta: "",
    unidad_medida: "unidad",
    stock: "",
  });

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // 🔹 Inicializar BD y cargar productos
  useEffect(() => {
    (async () => {
      await initSQLite();
      await cargarProductos();
    })();
  }, []);

  async function cargarProductos() {
    const data = await obtenerProductos();
    setProductos(data || []);
    setFiltrados(data || []);
  }

  // 🔍 Filtrar productos por nombre
  useEffect(() => {
    if (!busqueda.trim()) {
      setFiltrados(productos);
      return;
    }
    const filtro = productos.filter((p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
    setFiltrados(filtro);
  }, [busqueda, productos]);

  // 🔹 Control de cambios
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // 🔹 Guardar o actualizar
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const precio_costo = Number(formData.precio_costo);
    const precio_venta = Number(formData.precio_venta);
    const stock = Number(formData.stock);

    if (!formData.nombre || precio_costo <= 0 || precio_venta <= 0 || stock < 0) {
      setMensaje("⚠️ Todos los campos son obligatorios y deben ser válidos.");
      return;
    }

    if (editandoId) {
      await actualizarProducto(editandoId, {
        nombre: formData.nombre,
        precio_costo,
        precio_venta,
        unidad_medida: formData.unidad_medida,
        stock,
      });
      setMensaje("✅ Producto actualizado con éxito");
    } else {
      await insertarProducto({
        nombre: formData.nombre,
        precio_costo,
        precio_venta,
        unidad_medida: formData.unidad_medida,
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
    await cargarProductos();
    setTimeout(() => setMensaje(null), 2500);
  }

  // 🔹 Editar producto
  function handleEditar(p: Producto) {
    setFormData(p);
    setEditandoId(p.id || null);
  }

  // 🔹 Eliminar producto
  async function handleEliminar(id: number) {
    if (confirm("¿Seguro que quieres eliminar este producto?")) {
      await eliminarProducto(id);
      await cargarProductos();
      setMensaje("🗑️ Producto eliminado");
      setTimeout(() => setMensaje(null), 2500);
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

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Buscar producto por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border p-2 rounded w-full md:w-1/3 shadow-sm"
        />
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded p-4 mb-6"
      >
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

          <div className="relative">
            <span className="absolute left-2 top-2 text-gray-500">$</span>
            <input
              type="number"
              name="precio_costo"
              placeholder="Costo"
              value={formData.precio_costo}
              onChange={handleChange}
              className="border p-2 rounded pl-6 w-full"
            />
          </div>

          <div className="relative">
            <span className="absolute left-2 top-2 text-gray-500">$</span>
            <input
              type="number"
              name="precio_venta"
              placeholder="Venta"
              value={formData.precio_venta}
              onChange={handleChange}
              className="border p-2 rounded pl-6 w-full"
            />
          </div>

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
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            {editandoId ? "Actualizar" : "Agregar"}
          </button>
          {editandoId && (
            <button
              type="button"
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
      </form>

      {/* Tabla */}
      <table className="min-w-full bg-white border border-gray-200 shadow-md rounded">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="py-2 px-4 border-b">Nombre</th>
            <th className="py-2 px-4 border-b text-center">Costo</th>
            <th className="py-2 px-4 border-b text-center">Venta</th>
            <th className="py-2 px-4 border-b text-center">Unidad</th>
            <th className="py-2 px-4 border-b text-center">Stock</th>
            <th className="py-2 px-4 border-b text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{p.nombre}</td>
              <td className="py-2 px-4 border-b text-center">
                ${Number(p.precio_costo || 0).toFixed(2)}
              </td>
              <td className="py-2 px-4 border-b text-center text-green-700">
                ${Number(p.precio_venta || 0).toFixed(2)}
              </td>
              <td className="py-2 px-4 border-b text-center">{p.unidad_medida}</td>
              <td className="py-2 px-4 border-b text-center">{p.stock}</td>
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
          {filtrados.length === 0 && (
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
