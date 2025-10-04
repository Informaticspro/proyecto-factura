import { useEffect, useState } from "react";
import { insertarProducto, obtenerProductos, actualizarProducto, eliminarProducto } from "../../services/productosService";

type Producto = {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  unidad: string;
};

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState<Producto>({ codigo: "", nombre: "", descripcion: "", precio: 0, cantidad: 0, unidad: "" });
  const [editId, setEditId] = useState<number | null>(null);

  async function cargarProductos() {
    const data = await obtenerProductos();
    setProductos(data);
  }

  useEffect(() => {
    cargarProductos();
  }, []);

  const guardar = async () => {
    if (editId) {
      await actualizarProducto(editId, form.nombre, form.descripcion, form.precio, form.cantidad, form.unidad);
      setEditId(null);
    } else {
      await insertarProducto(form.codigo, form.nombre, form.descripcion, form.precio, form.cantidad, form.unidad);
    }
    setForm({ codigo: "", nombre: "", descripcion: "", precio: 0, cantidad: 0, unidad: "" });
    cargarProductos();
  };

  const editar = (prod: Producto) => {
    setForm(prod);
    setEditId(prod.id || null);
  };

  const borrar = async (id?: number) => {
    if (id) {
      await eliminarProducto(id);
      cargarProductos();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Gestión de Productos</h1>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <input placeholder="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
        <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <input placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        <input type="number" placeholder="Precio" value={form.precio} onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) })} />
        <input type="number" placeholder="Cantidad" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: parseFloat(e.target.value) })} />
        <input placeholder="Unidad" value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} />
        <button onClick={guardar} className="col-span-2 bg-blue-600 text-white py-2 rounded">
          {editId ? "Actualizar" : "Agregar"}
        </button>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>Código</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id} className="border-t">
              <td>{p.codigo}</td>
              <td>{p.nombre}</td>
              <td>{p.descripcion}</td>
              <td>{p.precio}</td>
              <td>{p.cantidad}</td>
              <td>{p.unidad}</td>
              <td>
                <button onClick={() => editar(p)} className="text-yellow-600">Editar</button> |{" "}
                <button onClick={() => borrar(p.id)} className="text-red-600">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}