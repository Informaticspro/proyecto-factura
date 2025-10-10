import { useEffect, useState } from "react";
import { ejecutarConsulta, isNative, dexieDB } from "../../services/db";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  Legend,
} from "recharts";

export default function VentasDiarias() {
  const [datos, setDatos] = useState<any[]>([]);

  useEffect(() => {
    async function cargarVentas() {
      const esMovil = window.innerWidth < 768; // 📱 detectar ancho de pantalla
      const diasAtras = esMovil ? 7 : 14; // 👈 mostrar 7 días si es móvil

      if (isNative) {
        // 📱 SQLite (modo nativo) — ajustado a hora local de Panamá (+5h)
        const sql = `
          SELECT 
            date(fecha, '+5 hours') AS dia,
            SUM(total) AS total
          FROM ventas
          WHERE date(fecha, '+5 hours') BETWEEN date('now', '-${diasAtras - 1} days', '+5 hours') 
            AND date('now', '+5 hours')
          GROUP BY dia
          ORDER BY dia;
        `;
        const res: any = await ejecutarConsulta(sql);
        procesarDatos(Array.isArray(res) ? res : res?.values ?? []);
      } else {
        // 🌐 Dexie (modo navegador)
        const ventas = await dexieDB.table("ventas").toArray();

        const hoy = new Date();
        const inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - (diasAtras - 1));

        // Convertir a formato YYYY-MM-DD local
        const toLocalISODate = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };

        // Agrupar ventas por día local
        const agrupadas: Record<string, number> = {};
        ventas.forEach((v) => {
          const fecha = new Date(v.fecha);
          const diaStr = toLocalISODate(fecha);
          const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
          if (f >= new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())) {
            agrupadas[diaStr] = (agrupadas[diaStr] || 0) + (v.total || 0);
          }
        });

        // Completar días vacíos (con total = 0)
        const dias: string[] = [];
        for (let i = 0; i < diasAtras; i++) {
          const f = new Date(inicio);
          f.setDate(inicio.getDate() + i);
          dias.push(toLocalISODate(f));
        }

        const datosFinales = dias.map((d) => ({
          dia: d,
          total: Number((agrupadas[d] || 0).toFixed(2)),
        }));

        procesarDatos(datosFinales);
      }
    }

    function procesarDatos(lista: any[]) {
      // Calcular promedio móvil (7 días)
      const conPromedio = lista.map((d, i) => {
        const ventana = lista.slice(Math.max(0, i - 6), i + 1);
        const suma = ventana.reduce((acc, v) => acc + (v.total || 0), 0);
        const promedio = suma / ventana.length;
        return { ...d, promedio: Number(promedio.toFixed(2)) };
      });

      setDatos(conPromedio);
    }

    cargarVentas();
  }, []);

  // 🗓️ Formatear fecha local ("mié 8", "jue 9", etc.)
function formatearFechaLocal(yyyyMmDd?: string) {
  if (!yyyyMmDd || typeof yyyyMmDd !== "string") return ""; // evita undefined
  const partes = yyyyMmDd.split("-");
  if (partes.length < 3) return "";
  const [y, m, d] = partes.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return "";
  const f = new Date(y, m - 1, d);
  if (isNaN(f.getTime())) return ""; // fecha inválida
  return f.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
  });
}
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2 className="text-lg font-semibold mb-3">
        Ventas diarias (últimos {window.innerWidth < 768 ? 7 : 14} días)
      </h2>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={datos.map((x) => ({ ...x, label: formatearFechaLocal(x.dia) }))}
          margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tickFormatter={(v) => (v ? v : "—")} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "promedio"
                ? [`$${(value ?? 0).toFixed(2)}`, "Promedio móvil (7d)"]
                : [`$${(value ?? 0).toFixed(2)}`, "Ventas del día"]
            }
          />
          <Legend />
          <Bar
            dataKey="total"
            fill="#4F46E5"
            radius={[6, 6, 0, 0]}
            name="Ventas del día"
            barSize={window.innerWidth < 768 ? 14 : 24} // barras más delgadas en móvil
          />
          <Line
            type="monotone"
            dataKey="promedio"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            name="Promedio móvil (7d)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
