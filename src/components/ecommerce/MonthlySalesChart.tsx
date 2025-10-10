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
} from "recharts";

export default function MonthlySalesChart() {
  const [datos, setDatos] = useState<any[]>([]);

  useEffect(() => {
    async function cargarVentas() {
      if (isNative) {
        // 📱 Modo SQLite
        const sql = `
          SELECT
            strftime('%m', fecha) AS mes,
            SUM(total) AS total
          FROM ventas
          GROUP BY mes
          ORDER BY mes;
        `;
        const res = await ejecutarConsulta(sql);
        procesarDatos(res);
      } else {
        // 🌐 Modo navegador (Dexie)
        const ventas = await dexieDB.table("ventas").toArray();

        // Agrupar por mes
        const agrupadas: Record<string, number> = {};
        ventas.forEach((v) => {
          const mes = new Date(v.fecha).getMonth(); // 0-11
          agrupadas[mes] = (agrupadas[mes] || 0) + (v.total || 0);
        });

        // Convertir a formato del gráfico
        const nombresMeses = [
          "Ene", "Feb", "Mar", "Abr", "May", "Jun",
          "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
        ];

        const res = Object.keys(agrupadas)
          .map((m) => ({
            mes: nombresMeses[Number(m)],
            total: Number(agrupadas[m].toFixed(2)),
          }))
          .sort(
            (a, b) =>
              nombresMeses.indexOf(a.mes) - nombresMeses.indexOf(b.mes)
          );

        setDatos(res);
      }
    }

    function procesarDatos(res: any[]) {
      const nombresMeses = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
      ];
      const datosFormateados = res.map((r) => ({
        mes: nombresMeses[Number(r.mes) - 1],
        total: Number(r.total),
      }));
      setDatos(datosFormateados);
    }

    cargarVentas();
  }, []);

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2 className="text-lg font-semibold mb-3">Ventas mensuales</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={datos} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#4F46E5" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
