import { useEffect, useState } from "react";
import { OBRAS } from "./obras";

const SHEET_ID = "17aB2MrWCG573pSNPatGqQ89UglR0mhCokGb1C0CG7bw";

export default function App() {
  const [obraSeleccionada, setObraSeleccionada] = useState("");
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- CARGA DATOS CUANDO CAMBIA LA OBRA ---
  useEffect(() => {
    if (!obraSeleccionada) return;

    const cargarDatos = async () => {
      setLoading(true);
      setError("");
      setTareas([]);

      try {
        const url = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(
          obraSeleccionada
        )}`;

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("No se pudo cargar el Sheet");
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("Datos inválidos");
        }

        setTareas(data);
      } catch (err) {
        console.error(err);
        setError("Error cargando datos de la obra");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [obraSeleccionada]);

  // --- RENDER ---
  return (
    <div style={{ padding: 20 }}>
      <h2>Control de obras</h2>

      {/* SELECTOR DE OBRA */}
      <select
        value={obraSeleccionada}
        onChange={(e) => setObraSeleccionada(e.target.value)}
      >
        <option value="">Selecciona una obra</option>
        {OBRAS.map((obra) => (
          <option key={obra} value={obra}>
            {obra}
          </option>
        ))}
      </select>

      {/* MENSAJES DE ESTADO */}
      {!obraSeleccionada && (
        <p style={{ marginTop: 20 }}>Selecciona una obra para empezar</p>
      )}

      {loading && <p style={{ marginTop: 20 }}>Cargando datos…</p>}

      {error && (
        <p style={{ marginTop: 20, color: "red" }}>
          {error}
        </p>
      )}

      {/* LISTADO DE TAREAS */}
      {!loading && !error && tareas.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Tareas</h3>
          <ul>
            {tareas.map((tarea, index) => (
              <li key={index}>
                {tarea.Tarea || "Sin nombre"}{" "}
                {tarea.Estado && `— ${tarea.Estado}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SIN TAREAS */}
      {!loading && obraSeleccionada && tareas.length === 0 && !error && (
        <p style={{ marginTop: 20 }}>
          No hay tareas para esta obra
        </p>
      )}
    </div>
  );
}
