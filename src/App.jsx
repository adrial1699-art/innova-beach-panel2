
import { useEffect, useState } from "react";
import { OBRAS, SHEET_ID } from "./obras";

export default function App() {
  const [obra, setObra] = useState("");
  const [bloque, setBloque] = useState("");
  const [vivienda, setVivienda] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!obra) return;
    const sheetName = OBRAS[obra].sheetName;
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

    fetch(url)
      .then(r => r.text())
      .then(t => {
        const json = JSON.parse(t.substring(47).slice(0, -2));
        const data = json.table.rows.map(r => ({
          bloque: r.c[1]?.v || "",
          vivienda: r.c[2]?.v || "",
          tareas: r.c[3]?.v || "",
          fecha: r.c[0]?.v || ""
        }));
        setRows(data);
      });
  }, [obra]);

  useEffect(() => {
    setBloque("");
    setVivienda("");
  }, [obra]);

  useEffect(() => {
    setVivienda("");
  }, [bloque]);

  const bloques = obra ? Object.keys(OBRAS[obra].bloques) : [];
  const viviendas = obra && bloque ? OBRAS[obra].bloques[bloque] : [];

  const registrosVivienda = rows.filter(
    r => r.bloque === bloque && String(r.vivienda) === String(vivienda)
  );

  const progreso = Math.min(100, registrosVivienda.length * 10);

  return (
    <div style={{ padding: 20, fontFamily: "Arial", background: "#eee", minHeight: "100vh" }}>
      <h2>Panel de Progreso de Obra</h2>

      <select value={obra} onChange={e => setObra(e.target.value)}>
        <option value="">Selecciona obra</option>
        {Object.keys(OBRAS).map(o => <option key={o}>{o}</option>)}
      </select>

      {obra && (
        <select value={bloque} onChange={e => setBloque(e.target.value)}>
          <option value="">Selecciona bloque</option>
          {bloques.map(b => <option key={b}>{b}</option>)}
        </select>
      )}

      {bloque && (
        <select value={vivienda} onChange={e => setVivienda(e.target.value)}>
          <option value="">Selecciona vivienda</option>
          {viviendas.map(v => <option key={v}>V{v}</option>)}
        </select>
      )}

      {vivienda && (
        <div style={{ marginTop: 20, padding: 15, border: "2px solid green", background: "#fff" }}>
          <strong>{obra} · {bloque} · Vivienda V{vivienda}</strong>
          <p>Registros: {registrosVivienda.length}</p>
          <div style={{ background: "#ccc", height: 20 }}>
            <div style={{ width: progreso + "%", height: "100%", background: "green" }} />
          </div>
          <p>{progreso}%</p>
        </div>
      )}
    </div>
  );
}
