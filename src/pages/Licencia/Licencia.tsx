import { useState } from "react";
import { guardarLicencia, estaLicenciada } from "../../services/db/licenciaService";

export default function Licencia() {
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const limpia = clave.trim();
    if (!limpia) {
      setError("Ingresa la clave de licencia.");
      return;
    }

    try {
      setCargando(true);

      // 💾 Guardar en BD
      await guardarLicencia(limpia);

      // 🔍 Verificar si es válida
      const ok = await estaLicenciada();
      if (!ok) {
        setError("Licencia inválida. Verifica la clave.");
        setCargando(false);
        return;
      }

      // ✅ Es válida → recargar la app
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Error al guardar la licencia.");
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">🔐 Activar licencia</h1>
        <p className="text-sm text-gray-600 mb-4 text-center">
          Esta copia de <b>Vendix</b> requiere una licencia válida. Solicítala al desarrollador.
        </p>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={manejarSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Clave de licencia</label>
            <input
              type="text"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Ej: VENDIX-2025-PRO"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-emerald-600 text-white rounded-lg py-2 font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
          >
            {cargando ? "Verificando..." : "Activar"}
          </button>
        </form>
      </div>
    </div>
  );
}
