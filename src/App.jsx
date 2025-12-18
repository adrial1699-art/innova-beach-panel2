import { useEffect, useState } from "react";

const SHEET_ID = "17aB2MrWCG573pSNPatGqQ89UglR0mhCokGb1C0CG7bw";

export const OBRAS = {
  "INNOVA BEACH III": {
    sheetId: "17aB2MrWCG573pSNPatGqQ89UglR0mhCokGb1C0CG7bw",
    bloques: {
      "Bloque 1": [...],
      "Bloque 2": [...],
      ...
    }
  },
  "INNOVA BEACH IV": {
    sheetId: "17aB2MrWCG573pSNPatGqQ89UglR0mhCokGb1C0CG7bw",
    bloques: { ... }
  },
  "INNOVA THIAR": {
    sheetId: "17aB2MrWCG573pSNPatGqQ89UglR0mhCokGb1C0CG7bw",
    bloques: { ... }
  }
  }
};

export default function App() {
  const [obra, setObra] = useState("");
  const [bloque, setBloque] = useState("");
  const [vivienda, setVivienda] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!obra) return;

    const sheetName = OBRAS[obra].sheetName;
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(sheetName)}&tqx=out:json`;

    fetch(url)
      .then(r => r.text())
      .then(text => {
        const json = JSON.parse(text.substring(47).slice(0, -2));
        const cols = json.table.cols.map(c => c.label);
        const data = json.table.rows.map(r => {
          const obj = {};
          r.c.forEach((cell, i) => {
            obj[cols[i]] = cell?.v || "";
          });
          return obj;
        });
        setRows(data);
      });
  }, [obra]);

  return (
    <div style={{ background: "#e5e5e5", minHeight: "100vh" }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        border: "4px double blue",
        background: "#f0f0f0"
      }}>
        <img src="/logos/innova.png" height={40} />
        <h2>Panel de Obra</h2>
        <img src="/logos/winplast.png" height={40} />
      </header>

      <div style={{ display: "flex" }}>
        <aside style={{
          width: 260,
          background: "#ddd",
          padding: 15,
          borderRight: "4px double green"
        }}>
          <select onChange={e => { setObra(e.target.value); setBloque(""); }}>
            <option value="">Obra</option>
            {Object.keys(OBRAS).map(o => <option key={o}>{o}</option>)}
          </select>

          {obra && (
            <select onChange={e => { setBloque(e.target.value); setVivienda(""); }}>
              <option value="">Bloque</option>
              {Object.keys(OBRAS[obra].bloques).map(b => <option key={b}>{b}</option>)}
            </select>
          )}

          {bloque && (
            <select onChange={e => setVivienda(e.target.value)}>
              <option value="">Vivienda</option>
              {OBRAS[obra].bloques[bloque].map(v => (
                <option key={v}>V{v}</option>
              ))}
            </select>
          )}
        </aside>

        <main style={{ padding: 20, flex: 1 }}>
          {!vivienda && <p>Selecciona una vivienda</p>}
          {vivienda && (
            <div style={{
              background: "#fff",
              padding: 20,
              border: "4px double green"
            }}>
              <h3>{obra} · {bloque} · V{vivienda}</h3>
              <p>Respuestas registradas: {rows.filter(r => r.Vivienda === `V${vivienda}`).length}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
