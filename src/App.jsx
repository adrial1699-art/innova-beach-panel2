import { useEffect, useState } from "react";

/* === CONFIGURACIÓN OBRAS === */
const OBRAS = {
  "Innova Beach III": {
    sheetId: "AQUI_TU_SHEET_ID_III",
    bloques: {
      "Bloque 1": [1,2,3,4,5,6],
      "Bloque 2": [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
      "Dúplex": [23,24]
    }
  },
  "Innova Beach IV": {
    sheetId: "AQUI_TU_SHEET_ID_IV",
    bloques: {
      "Bloque 1": [1,2,3,4,5,6,7,8],
      "Bloque 2": [9,10,11,12,13,14,15,16],
      "Bloque 3": [17,18,19,20,21,22,23,24,25,26,27,28],
      "Bloque 4": [29,30,31,32,33,34],
      "Bloque 5": [35,36,37,38,39,40,41,42,43,44]
    }
  },
  "Innova Thiar": {
    sheetId: "AQUI_TU_SHEET_ID_THIAR",
    bloques: {
      "Bloque 1": [1,2,3,4,5,6,7,8],
      "Bloque 2": [9,10,11,12,13,14,15,16],
      "Bloque 3": [17,18,19,20,21,22,23,24,25,26,27,28],
      "Bloque 4": [29,30,31,32,33,34],
      "Bloque 5": [35,36,37,38,39,40,41,42,43,44]
    }
  }
};

/* === TAREAS === */
const TAREAS = [
  "Poner ventanas",
  "Poner hojas correderas",
  "Cristales fijos",
  "Poner manetas",
  "Regular",
  "Poner cierres",
  "Poner chapita",
  "Sellado interior",
  "Sellado exterior"
];

export default function App() {
  const [obra, setObra] = useState("");
  const [bloque, setBloque] = useState("");
  const [vivienda, setVivienda] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  /* === CARGA DATOS GOOGLE SHEETS === */
  useEffect(() => {
    if (!obra) return;
    const url = `https://docs.google.com/spreadsheets/d/${OBRAS[obra].sheetId}/gviz/tq?tqx=out:json`;
    setLoading(true);

    fetch(url)
      .then(r => r.text())
      .then(txt => {
        const json = JSON.parse(txt.replace(/.*setResponse\(|\);/g,""));
        const cols = json.table.cols.map(c => c.label);
        const data = json.table.rows.map(r => {
          const obj = {};
          r.c.forEach((cell,i)=>obj[cols[i]] = cell?.v || "");
          return obj;
        });
        setRows(data.reverse());
      })
      .finally(()=>setLoading(false));
  }, [obra]);

  /* === PROGRESO VIVIENDA === */
  function progresoVivienda(num){
    const r = rows.find(x => String(x["Vivienda"]) === `V${num}`);
    if(!r) return {done:0,total:TAREAS.length,pct:0};
    let done = 0;
    TAREAS.forEach(t=>{
      if(String(r[t]||"").toLowerCase().includes("sí")) done++;
    });
    return {
      done,
      total:TAREAS.length,
      pct: Math.round((done/TAREAS.length)*100)
    };
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <img src="/logos/innova.png" style={styles.logo}/>
        <h2>Panel de Obra</h2>
        <img src="/logos/winplast.png" style={styles.logo}/>
      </header>

      <div style={styles.body}>
        <aside style={styles.panel}>
          <select style={styles.select} onChange={e=>{setObra(e.target.value);setBloque("");setVivienda("");}}>
            <option value="">Obra</option>
            {Object.keys(OBRAS).map(o=><option key={o}>{o}</option>)}
          </select>

          {obra && (
            <select style={styles.select} onChange={e=>{setBloque(e.target.value);setVivienda("");}}>
              <option value="">Bloque</option>
              {Object.keys(OBRAS[obra].bloques).map(b=><option key={b}>{b}</option>)}
            </select>
          )}

          {bloque && (
            <select style={styles.select} onChange={e=>setVivienda(e.target.value)}>
              <option value="">Vivienda</option>
              {OBRAS[obra].bloques[bloque].map(v=><option key={v}>V{v}</option>)}
            </select>
          )}
        </aside>

        <main style={styles.main}>
          {loading && <p>Cargando…</p>}
          {vivienda && (
            (()=> {
              const p = progresoVivienda(vivienda);
              return (
                <div style={styles.card}>
                  <h3>Vivienda V{vivienda}</h3>
                  <div style={styles.bar}>
                    <div style={{...styles.fill,width:`${p.pct}%`}}/>
                  </div>
                  <p>{p.done} / {p.total} tareas · {p.pct}%</p>
                </div>
              );
            })()
          )}
        </main>
      </div>
    </div>
  );
}

/* === ESTILOS === */
const styles = {
  page:{background:"#e6e6e6",minHeight:"100vh"},
  header:{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    padding:10,
    background:"#f2f2f2",
    border:"4px double",
    borderColor:"blue green"
  },
  logo:{height:40},
  body:{display:"flex"},
  panel:{
    width:260,
    background:"#dcdcdc",
    padding:15,
    borderRight:"4px double",
    borderColor:"blue green"
  },
  select:{width:"100%",padding:6,marginBottom:10},
  main:{flex:1,padding:20},
  card:{
    background:"#fff",
    padding:20,
    border:"4px double",
    borderColor:"blue green"
  },
  bar:{height:12,background:"#ccc",borderRadius:6,overflow:"hidden"},
  fill:{height:12,background:"#00aa44"}
};
