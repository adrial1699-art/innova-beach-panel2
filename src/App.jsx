
import { useEffect, useState } from "react";
import { OBRAS, SHEET_ID } from "./obras";

export default function App() {
  const [obra, setObra] = useState("INNOVA BEACH III");
  const [bloque, setBloque] = useState("Bloque 1");
  const [vivienda, setVivienda] = useState(1);
  const [respuestas, setRespuestas] = useState([]);

  const obraConfig = OBRAS[obra];

  useEffect(() => {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(obraConfig.sheetName)}`;
    fetch(url)
      .then(r => r.text())
      .then(t => {
        const json = JSON.parse(t.substring(47).slice(0, -2));
        const rows = json.table.rows.map(r => ({
          bloque: r.c[1]?.v,
          vivienda: r.c[2]?.v,
          tareas: r.c[3]?.v
        }));
        setRespuestas(rows);
      });
  }, [obra]);

  const tareasHechas = respuestas.filter(r => r.bloque === bloque && r.vivienda === vivienda);
  const total = tareasHechas.length;
  const progreso = Math.min(100, total * 10);

  return (
    <div style={{ fontFamily: "Arial", padding: 20, background: "#eee", minHeight: "100vh" }}>
      <h2 style={{ border: "3px double blue", padding: 10, background: "#ddd" }}>
        Panel de Progreso de Obra
      </h2>

      <select value={obra} onChange={e => setObra(e.target.value)}>
        {Object.keys(OBRAS).map(o => <option key={o}>{o}</option>)}
      </select>

      <select value={bloque} onChange={e => setBloque(e.target.value)}>
        {Object.keys(obraConfig.bloques).map(b => <option key={b}>{b}</option>)}
      </select>

      <select value={vivienda} onChange={e => setVivienda(Number(e.target.value))}>
        {obraConfig.bloques[bloque].map(v => <option key={v}>{v}</option>)}
      </select>

      <div style={{ marginTop: 20, border: "2px solid green", padding: 10 }}>
        <strong>{obra} · {bloque} · Vivienda V{vivienda}</strong>
        <p>Respuestas registradas: {total}</p>
        <div style={{ background: "#ccc", height: 20 }}>
          <div style={{ width: progreso + "%", height: "100%", background: "green" }} />
        </div>
        <p>{progreso}%</p>
      </div>
    </div>
  );
}
