import { useEffect, useState } from "react";
import {
  ejecutarConsulta, // 👉 Función utilitaria que ejecuta SQL directo en SQLite
  isNative,          // 👉 Variable booleana: true si está corriendo en app nativa (Capacitor)
  dexieDB,           // 👉 Instancia de Dexie (modo navegador)
} from "../../services/db";
import { motion } from "framer-motion"; // 👉 Librería para animaciones suaves

// 🔹 Estructura de datos del resumen financiero
type ResumenFinanzas = {
  ingresos: number; // total de ventas (suma del campo ventas.total)
  costos: number;   // costo total de los productos vendidos
  ganancia: number; // diferencia entre ingresos y costos
  ventas: number;   // número de ventas registradas
  promedio: number; // promedio de ingresos por venta
};

export default function Finanzas() {
  // 🔹 Estado principal con los datos del resumen
  const [resumen, setResumen] = useState<ResumenFinanzas | null>(null);
  // 🔹 Estado de carga
  const [loading, setLoading] = useState(true);

  // 🧠 Cuando el componente se monta, calculamos el resumen
  useEffect(() => {
    calcularFinanzas();
  }, []);

  // =======================================================
  // 📊 FUNCIÓN PRINCIPAL: CALCULAR EL RESUMEN FINANCIERO
  // =======================================================
  async function calcularFinanzas() {
    setLoading(true);
    try {
      // ---------------------------------------------------
      // 🔹 CASO 1: APP NATIVA (usando SQLite)
      // ---------------------------------------------------
      if (isNative) {
        // 🧮 Consulta SQL que combina las tres tablas principales:
        // ventas → detalle_ventas → productos
        const sql = `
          SELECT 
            IFNULL(SUM(v.total),0) AS ingresos,                             -- Total de ingresos por ventas
            IFNULL(SUM(dv.cantidad * p.precio_costo),0) AS costos,          -- Total de costos
            COUNT(DISTINCT v.id) AS ventas                                  -- Número de ventas
          FROM ventas v
          LEFT JOIN detalle_ventas dv ON dv.venta_id = v.id
          LEFT JOIN productos p ON p.id = dv.producto_id;
        `;

        // 🧱 Ejecutamos la consulta y recibimos un array de resultados
        const [res] = (await ejecutarConsulta(sql)) as any[];

        // 🔹 Extraemos y convertimos los valores numéricos
        const ingresos = Number(res.ingresos || 0);
        const costos = Number(res.costos || 0);
        const ventas = Number(res.ventas || 0);
        const ganancia = ingresos - costos;
        const promedio = ventas ? ingresos / ventas : 0;

        // 💾 Guardamos todo en el estado
        setResumen({ ingresos, costos, ganancia, ventas, promedio });
      } 
      // ---------------------------------------------------
      // 🔹 CASO 2: MODO WEB (Dexie)
      // ---------------------------------------------------
      else {
        // Accedemos a las tablas equivalentes en IndexedDB (Dexie)
        const tVentas = (dexieDB as any).table("ventas");
        const tDetalle = (dexieDB as any).table("detalle_ventas");
        const tProductos = (dexieDB as any).table("productos");

        // 📦 Obtenemos todos los registros
        const ventas = await tVentas.toArray();
        const detalles = await tDetalle.toArray();
        const productos = await tProductos.toArray();

        // 💰 Calculamos los totales manualmente
        const ingresos = ventas.reduce((sum: number, v: any) => sum + v.total, 0);
        const costos = detalles.reduce((sum: number, d: any) => {
          const prod = productos.find((p: any) => p.id === d.producto_id);
          return sum + (prod?.precio_costo || 0) * d.cantidad;
        }, 0);

        // 📊 Calculamos los indicadores finales
        const ganancia = ingresos - costos;
        const promedio = ventas.length ? ingresos / ventas.length : 0;

        setResumen({
          ingresos,
          costos,
          ganancia,
          ventas: ventas.length,
          promedio,
        });
      }
    } catch (error) {
      console.error("❌ Error calculando finanzas:", error);
    } finally {
      setLoading(false);
    }
  }

  // 🌀 Si todavía está cargando, mostramos un mensaje simple
  if (loading) return <div className="p-4 text-center">Cargando resumen financiero...</div>;

  // =======================================================
  // 🎨 INTERFAZ VISUAL
  // =======================================================
  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* 🔹 Título principal */}
      <h1 className="text-2xl font-bold text-center mb-6 text-white">
        📊 Resumen Financiero
      </h1>

      {/* 🔹 Cuadros de métricas (tarjetas de colores) */}
      {resumen && (
        <motion.div
          className="grid md:grid-cols-2 gap-4 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* 💰 Ingresos */}
          <div className="bg-blue-600/60 p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold">Ingresos Totales</h2>
            <p className="text-2xl font-bold">${resumen.ingresos.toFixed(2)}</p>
          </div>

          {/* 💸 Costos */}
          <div className="bg-amber-600/60 p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold">Costos Totales</h2>
            <p className="text-2xl font-bold">${resumen.costos.toFixed(2)}</p>
          </div>

          {/* 📈 Ganancia */}
          <div className="bg-emerald-600/60 p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold">Ganancia Neta</h2>
            <p className="text-2xl font-bold">${resumen.ganancia.toFixed(2)}</p>
          </div>

          {/* 🧾 Número de ventas */}
          <div className="bg-gray-700/60 p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold">Ventas Registradas</h2>
            <p className="text-2xl font-bold">{resumen.ventas}</p>
            <p className="text-sm mt-1 text-gray-300">
              Promedio por venta: ${resumen.promedio.toFixed(2)}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
