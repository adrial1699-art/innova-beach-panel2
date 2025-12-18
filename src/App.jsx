import { useEffect, useState } from "react";
import { OBRAS, SHEET_ID } from "./obras";

export default function App() {
  const [obra, setObra] = useState("INNOVA BEACH III");
  const [bloque, setBloque] = useState("");
  const [vivienda, setVivienda] = useState("");
  const [respuestas, setRespuestas] = useState([]);

  const obraConfig = OBRAS[obra];

  // Cargar datos del Sheet correcto
  useEffect(() => {
    setBloque("");
    setVivienda("");
    setRespuestas([]);

    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
      obraConfig.sheetName
    )}`;

    fetch(url)
      .then((r) => r.text())
      .then((t) => {
        const json = JSON.parse(t.substring(47).slice(0, -2));
        const rows = json.table.rows.map((r) => ({
          bloque: r.c[1]?.v || "",
          vivienda: Number(r.c[2]?.v),
          tareas: r.c[3]?.v || "",
        }));
        setRespuestas(rows);
      });
  }, [obra]);

  // Filtrar respuestas reales
  const respuestasVivienda = respuestas.filter(
    (r) => r.bloque === bloque && r.vivienda === vivienda
  );

  // Extraer tareas únicas
  const tareasHechas = new Set();
  respuestasVivienda.forEach((r) => {
    r.tareas
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => tareasHechas.add(t));
  });

  const TOTAL_TAREAS = 18; // AJUSTA si cambian
  const progreso = Math.round((tareasHechas.size / TOTAL_TAREAS) * 100);

  return (
    <div style={{ background: "#eee", minHeight: "100vh", padding: 20 }}>
      {/* CABECERA */}
      <div
        style={{
          border: "4px double blue",
          background: "#ddd",
          padding: 10,
          marginBottom: 20,
        }}
      >
        <h2 style={{ textAlign: "center" }}>Panel de Progreso de Obra</h2>
        {/* AQUÍ PUEDES VOLVER A METER LOGOS */}
      </div>

      {/* SELECTORES */}
      <div style={{ display: "flex", gap: 10 }}>
        <select value={obra} onChange={(e) => setObra(e.target.value)}>
          {Object.keys(OBRAS).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>

        <select
          value={bloque}
          onChange={(e) => setBloque(e.target.value)}
        >
          <option value="">Bloque</option>
          {Object.keys(obraConfig.bloques).map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>

        <select
          value={vivienda}
          onChange={(e) => setVivienda(Number(e.target.value))}
          disabled={!bloque}
        >
          <option value="">Vivienda</option>
          {bloque &&
            obraConfig.bloques[bloque].map((v) => (
              <option key={v}>V{v}</option>
            ))}
        </select>
      </div>

      {/* PANEL */}
      {bloque && vivienda && (
        <div
          style={{
            marginTop: 20,
            border: "2px solid green",
            padding: 15,
            background: "#f7f7f7",
          }}
        >
          <strong>
            {obra} · {bloque} · Vivienda V{vivienda}
          </strong>

          <p>Tareas completadas: {tareasHechas.size} / {TOTAL_TAREAS}</p>

          <div style={{ background: "#ccc", height: 20 }}>
            <div
              style={{
                width: `${progreso}%`,
                height: "100%",
                background: progreso === 100 ? "green" : "#4caf50",
              }}
            />
          </div>

          <p>{progreso}%</p>
        </div>
      )}
    </div>
  );
}
