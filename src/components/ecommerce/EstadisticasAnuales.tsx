import { useEffect, useState } from "react";
import { ejecutarConsulta, isNative, dexieDB } from "../../services/db";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function EstadisticasAnuales() {
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      const añoActual = new Date().getFullYear();
      let lista: { mes: string; total: number }[] = [];

      if (isNative) {
        // 📱 SQLite (ajustado a hora local)
        const sql = `
          SELECT 
            strftime('%m', date(fecha, '+5 hours')) AS mes,
            SUM(total) AS total
          FROM ventas
          WHERE strftime('%Y', date(fecha, '+5 hours')) = ?
          GROUP BY mes
          ORDER BY mes;
        `;
        const res = await ejecutarConsulta(sql, [String(añoActual)]);
        const filas = Array.isArray(res) ? res : res?.values ?? [];
        lista = filas.map((r: any) => ({
          mes: nombreMes(Number(r.mes)),
          total: Number(r.total),
        }));
      } else {
        // 🌐 Dexie (modo navegador)
        const ventas = await dexieDB.table("ventas").toArray();
        const agrupadas: Record<string, number> = {};
        ventas.forEach((v) => {
          const f = new Date(v.fecha);
          if (f.getFullYear() === añoActual) {
            const mes = f.getMonth() + 1;
            agrupadas[mes] = (agrupadas[mes] || 0) + (v.total || 0);
          }
        });

        lista = Object.keys(agrupadas)
          .sort((a, b) => Number(a) - Number(b))
          .map((m) => ({
            mes: nombreMes(Number(m)),
            total: Number(agrupadas[m].toFixed(2)),
          }));
      }

      setDatos(lista);
      setLoading(false);
    }

    cargarDatos();
  }, []);

  function nombreMes(n: number) {
    const nombres = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return nombres[n - 1] || "";
  }

  const money = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2 className="text-lg font-semibold mb-2">
        Estadísticas de ventas del año {new Date().getFullYear()}
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        Total de ventas registradas por mes
      </p>

      {loading ? (
        <p>Cargando datos...</p>
      ) : datos.length === 0 ? (
        <p>No hay ventas registradas este año.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={datos} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(v) => money(Number(v))} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#4F46E5"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
