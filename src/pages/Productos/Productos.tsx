import { useEffect, useState } from "react";
import {
  insertarProducto,
  obtenerProductos,
  actualizarProducto,
  eliminarProducto,
  initSQLite,
  isNative,
} from "../../services/db";
import { obtenerCategorias, insertarCategoria } from "../../services/db";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import Dexie from "dexie";
import PageMeta from "../../components/common/PageMeta";
import { FilePicker } from "@capawesome/capacitor-file-picker";
import { Filesystem } from "@capacitor/filesystem"; 

/* =======================================================
   🧩 Base Dexie (modo navegador)
   ======================================================= */
const dexieDB = new Dexie("facturacionDB");
dexieDB.version(1).stores({
  productos:
    "++id, nombre, precio_costo, precio_venta, unidad_medida, stock, categoria",
});

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
  /* =======================================================
     🔹 Estados
  ======================================================= */
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtrados, setFiltrados] = useState<Producto[]>([]);
  const [busqueda, ] = useState("");
  const [formData, setFormData] = useState<Producto>({
    nombre: "",
    precio_costo: "",
    precio_venta: "",
    unidad_medida: "unidad",
    stock: "",
  });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [, setMensaje] = useState<string | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

  /* =======================================================
     📂 Importar productos desde Excel
  ======================================================= */
  const handleImportExcel = async () => {
  try {
    let rows: any[] = [];

    if (isNative) {
      // 📱 Android: selector nativo
      const result = await FilePicker.pickFiles({
        types: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
        ],
      });

      if (result.files.length === 0) {
        alert("No seleccionaste ningún archivo.");
        return;
      }

      const selected = result.files[0];
      console.log("📂 Archivo seleccionado:", selected);

      // ✅ Leer desde FileSystem (no fetch)
      const contenido = await Filesystem.readFile({ path: selected.path as string });

      const byteArray = Uint8Array.from(atob(contenido.data as string), (c) =>
        c.charCodeAt(0)
      );

      // 📊 Procesar Excel
      const workbook = XLSX.read(byteArray, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(firstSheet);
      console.log("📦 Productos importados (Android):", rows);
    } else {
      // 💻 Navegador
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".xlsx, .xls, .csv";
      input.click();
      await new Promise((resolve) => (input.onchange = resolve));
      const file = input.files?.[0];
      if (!file) return;

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(firstSheet);
      console.log("📦 Productos importados (Web):", rows);
    }

  // 💾 Guardar en SQLite o Dexie
if (rows.length > 0) {
  const db = await initSQLite();

  // 🧠 Crear un Set para guardar las categorías únicas
  const categoriasSet = new Set<string>();

  for (const item of rows as any[]) {
    if (item.categoria) categoriasSet.add(item.categoria.trim());

    if (db) {
      await db.run(
        `INSERT OR REPLACE INTO productos 
        (nombre, categoria, precio_costo, precio_venta, unidad_medida, stock)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          item.nombre,
          item.categoria,
          item.precio_costo,
          item.precio_venta,
          item.unidad_medida,
          item.stock,
        ]
      );
    } else {
      await dexieDB.table("productos").put(item);
    }
  }

  // 🗂️ Insertar categorías sin duplicar
  if (db) {
    for (const nombre of categoriasSet) {
      await db.run(`INSERT OR IGNORE INTO categorias (nombre) VALUES (?)`, [nombre]);
    }
  } else {
    for (const nombre of categoriasSet) {
      await dexieDB.table("categorias").put({ nombre });
    }
  }

  // 🔄 Recargar productos y categorías
  await cargarProductos();
  const cats = await obtenerCategorias();
  setCategorias(cats.map((c) => c.nombre));

  toast.success(
    `✅ ${rows.length} productos importados correctamente (${categoriasSet.size} categorías).`
  );
} else {
  toast.error("⚠️ No se encontraron filas en el archivo Excel.");
}
} catch (error) {
  console.error("❌ Error al importar Excel:", error);
  toast.error("Error al procesar el archivo. Verifica el formato.");
}
};

{/* 🔹 Filtro por categorías */}
<div className="flex flex-wrap gap-2 mb-4">
  <button
    onClick={() => setCategoriaSeleccionada(null)}
    className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
      categoriaSeleccionada === null
        ? "bg-emerald-600 text-white"
        : "bg-white hover:bg-emerald-50"
    }`}
  >
    Todas
  </button>

  {categorias.length === 0 ? (
    <span className="text-gray-500 text-sm italic">Sin categorías registradas</span>
  ) : (
    categorias.map((cat) => (
      <button
        key={cat}
        onClick={() => setCategoriaSeleccionada(cat)}
        className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
          categoriaSeleccionada === cat
            ? "bg-emerald-600 text-white"
            : "bg-white hover:bg-emerald-50"
        }`}
      >
        {cat}
      </button>
    ))
  )}
</div>

  /* =======================================================
     🗂️ Cargar productos y categorías
  ======================================================= */
  useEffect(() => {
    (async () => {
      await initSQLite();
      await cargarProductos();
      const cats = await obtenerCategorias();
      setCategorias(cats.map((c) => c.nombre));
    })();
  }, []);

  async function cargarProductos() {
    const data = await obtenerProductos();
    setProductos(data || []);
    setFiltrados(data || []);
  }

  /* =======================================================
     🔍 Filtros
  ======================================================= */
  useEffect(() => {
    if (!busqueda.trim()) setFiltrados(productos);
    else {
      const filtro = productos.filter((p) =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
      setFiltrados(filtro);
    }
  }, [busqueda, productos]);

  /* =======================================================
     ✏️ Control de formulario
  ======================================================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  /* =======================================================
     💾 Guardar o actualizar producto
  ======================================================= */
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
      await actualizarProducto(editandoId, { ...formData, precio_costo, precio_venta, stock });
      setMensaje("✅ Producto actualizado con éxito");
    } else {
      if (formData.categoria) await insertarCategoria(formData.categoria);
      await insertarProducto({ ...formData, precio_costo, precio_venta, stock });
      setMensaje("✅ Producto agregado con éxito");
    }

    setFormData({ nombre: "", precio_costo: "", precio_venta: "", unidad_medida: "unidad", stock: "" });
    setEditandoId(null);
    await cargarProductos();
    setTimeout(() => setMensaje(null), 2500);
  }

  /* =======================================================
     ✏️ Editar y eliminar
  ======================================================= */
  const handleEditar = (p: Producto) => {
    setFormData(p);
    setEditandoId(p.id || null);
  };

  const handleEliminar = async (id: number) => {
    if (confirm("¿Seguro que quieres eliminar este producto?")) {
      await eliminarProducto(id);
      await cargarProductos();
      setMensaje("🗑️ Producto eliminado");
      setTimeout(() => setMensaje(null), 2500);
    }
  };

  /* =======================================================
     📊 Filtrar por categoría
  ======================================================= */
  const productosFiltrados = categoriaSeleccionada
    ? productos.filter((p) => p.categoria === categoriaSeleccionada)
    : productos;

  /* =======================================================
     🧩 Renderizado
  ======================================================= */
  return (
    <>
      <PageMeta
        title="Gestión de Productos"
        description="Administra tus productos, categorías y precios"
      />

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Gestión de Productos</h1>

        {/* Botón importar Excel */}
        <div className="flex gap-3 items-center mb-4">
          <button
            onClick={handleImportExcel}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            📂 Importar Excel
          </button>
          <input
            id="excelInput"
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleImportExcel}
            className="hidden"
          />
        </div>

        {/* 🧾 Formulario */}
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
                onChange={(e) =>
                  setFormData({ ...formData, categoria: e.target.value })
                }
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

        {/* 🧮 Tabla */}
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
                  <td className="py-2 px-4 border-b text-center">
                    {(p as any).categoria || "-"}
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
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 📱 Menú móvil */}
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
    </>
  );
}
