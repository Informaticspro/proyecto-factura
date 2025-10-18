import { useEffect, useState } from "react";
import {
  insertarProducto,
  obtenerProductos,
  actualizarProducto,
  eliminarProducto,
  initSQLite,
} from "../../services/db";
import { obtenerCategorias, insertarCategoria } from "../../services/db";

interface Producto {
  id?: number;
  nombre: string;
  precio_costo: number | string;
  precio_venta: number | string;
  unidad_medida: string;
  stock: number | string;
  categoria?: string | null;
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
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
const [mostrarMenu, setMostrarMenu] = useState(false);
const [categorias, setCategorias] = useState<string[]>([]);
const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

// 🔹 Filtrar productos según la categoría seleccionada
const productosFiltrados = categoriaSeleccionada
  ? productos.filter((p) => p.categoria === categoriaSeleccionada)
  : productos;

  // 🔹 Inicializar BD y cargar productos

  useEffect(() => {
  (async () => {
    await initSQLite();
    await cargarProductos();
    const cats = await obtenerCategorias();
    setCategorias(cats.map(c => c.nombre));
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
    categoria: formData.categoria || null,
  });
  setMensaje("✅ Producto actualizado con éxito");
} else {
  // Asegurar que la categoría exista en la tabla categorias
  if (formData.categoria) await insertarCategoria(formData.categoria);

  await insertarProducto({
    nombre: formData.nombre,
    precio_costo,
    precio_venta,
    unidad_medida: formData.unidad_medida,
    stock,
    categoria: formData.categoria || null,
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

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
  <input
    type="text"
    name="nombre"
    placeholder="Nombre"
    value={formData.nombre}
    onChange={handleChange}
    className="border p-2 rounded"
  />

 <div className="flex gap-2 items-center">
  <select
    name="categoria"
    value={formData.categoria || ""}
    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
    className="border p-2 rounded flex-1"
  >
    <option value="">Sin categoría</option>
    {categorias.map((cat) => (
      <option key={cat} value={cat}>
        {cat}
      </option>
    ))}
  </select>

  <button
    type="button"
    onClick={async () => {
      const nueva = prompt("🆕 Escribe el nombre de la nueva categoría:");
      if (nueva) {
        await insertarCategoria(nueva);
        const cats = await obtenerCategorias();
        setCategorias(cats.map((c) => c.nombre));
        setFormData({ ...formData, categoria: nueva });
      }
    }}
    className="bg-emerald-500 text-white px-3 py-2 rounded hover:bg-emerald-600"
  >
    +
  </button>
</div>

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

      {/* 🔹 Filtro por categorías */}
<div className="flex flex-wrap gap-2 mb-4">
  <button
    onClick={() => setCategoriaSeleccionada(null)}
    className={`px-4 py-2 rounded-full border text-sm font-medium ${
      categoriaSeleccionada === null
        ? "bg-emerald-600 text-white"
        : "bg-white hover:bg-emerald-50"
    }`}
  >
    Todas
  </button>

  {categorias.map((cat) => (
    <button
      key={cat}
      onClick={() => setCategoriaSeleccionada(cat)}
      className={`px-4 py-2 rounded-full border text-sm font-medium ${
        categoriaSeleccionada === cat
          ? "bg-emerald-600 text-white"
          : "bg-white hover:bg-emerald-50"
      }`}
    >
      {cat}
    </button>
  ))}
</div>

     {/* Tabla */}
<div className="overflow-x-auto overflow-y-auto max-h-[50vh] w-full scroll-suave rounded-lg">
  <table className="min-w-full bg-white border border-gray-200 shadow-md rounded">
    <thead>
      <tr className="border-b bg-gray-50 text-left">
        <th className="py-2 px-4 border-b">Nombre</th>
        <th className="py-2 px-4 border-b text-center">Costo</th>
        <th className="py-2 px-4 border-b text-center">Venta</th>
        <th className="py-2 px-4 border-b text-center">Categoría</th>
        <th className="py-2 px-4 border-b text-center">Unidad</th>
        <th className="py-2 px-4 border-b text-center">Stock</th>
        <th className="py-2 px-4 border-b text-center">Acciones</th>
      </tr>
    </thead>
    <tbody>
      {productosFiltrados.map((p) => (
        <tr
  key={p.id}
  className="hover:bg-indigo-50 cursor-pointer transition-all"
  onClick={() => {
    // Solo mostrar el menú si es móvil
    if (window.innerWidth < 768) {
      setProductoSeleccionado(p);
      setMostrarMenu(true);
    }
  }}
>

          <td className="py-2 px-4 border-b">{p.nombre}</td>
          <td className="py-2 px-4 border-b text-center">
            ${Number(p.precio_costo || 0).toFixed(2)}
          </td>
          <td className="py-2 px-4 border-b text-center text-green-700">
            ${Number(p.precio_venta || 0).toFixed(2)}
          </td>
          <td className="py-2 px-4 border-b text-center">{(p as any).categoria || "-"}</td>
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
  {mostrarMenu && productoSeleccionado && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-lg p-5 w-full max-w-xs text-center animate-fadeIn">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        {productoSeleccionado.nombre}
      </h3>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => {
            handleEditar(productoSeleccionado);
            setMostrarMenu(false);
          }}
          className="bg-yellow-400 hover:bg-yellow-500 text-white py-2 rounded-xl transition"
        >
          ✏️ Editar
        </button>

        <button
          onClick={() => {
            handleEliminar(productoSeleccionado.id!);
            setMostrarMenu(false);
          }}
          className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl transition"
        >
          🗑️ Eliminar
        </button>

        <button
          onClick={() => setMostrarMenu(false)}
          className="mt-2 text-gray-600 hover:text-gray-900"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
</div>
 </div> 
  );
}
