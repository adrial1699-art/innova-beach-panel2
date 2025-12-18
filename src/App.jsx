import { useEffect, useState } from "react";

// ===== CONFIG OBRAS =====
const OBRAS = {
  "Innova Beach III": {
    sheetId: "17aB2MrWCG573pSNPatGqQ89UglR0mhCokGb1C0CG7bw ",
    bloques: {
      "Bloque 1": [1,2,3,4,5,6],
      "Bloque 2": [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
      "Dúplex": [23,24]
    }
  },
  "Innova Beach IV": {
    sheetId: "17aB2MrWCG573pSNPatGqQ89UglR0mhCokGb1C0CG7bw",
    bloques: {
      "Bloque 1": [1,2,3,4,5,6,7,8],
      "Bloque 2": [9,10,11,12,13,14,15,16],
      "Bloque 3": [17,18,19,20,21,22,23,24,25,26,27,28],
      "Bloque 4": [29,30,31,32,33,34],
      "Bloque 5": [35,36,37,38,39,40,41,42,43,44]
    }
  },
  "Innova Thiar": {
    sheetId: "17aB2MrWCG573pSNPatGqQ89UglR0mhCokGb1C0CG7bw",
    bloques: {
      "Bloque 1": [1,2,3,4,5,6,7,8],
      "Bloque 2": [9,10,11,12,13,14,15,16],
      "Bloque 3": [17,18,19,20,21,22,23,24,25,26,27,28],
      "Bloque 4": [29,30,31,32,33,34],
      "Bloque 5": [35,36,37,38,39,40,41,42,43,44]
    }
  }
};

// ===== TODAS LAS TAREAS =====
const TAREAS = [
  "Poner ventanas",
  "Poner hojas correderas",
  "Cristales fijos",
  "Poner manetas",
  "Regular",
  "Poner cierres",
  "Poner chapita",
  "Poner ángulos exteriores",
  "Esquinero",
  "Sellado interior",
  "Sellado exterior",
  "Poner puerta peatonal",
  "Poner cristales solarium",
  "Poner cristales terraza",
  "Sellar cristales",
  "Poner vigas 7016",
  "Ventanas de sótano",
  "Bajo escalera"
];

export default function App(){
  const [obra,setObra] = useState("");
  const [bloque,setBloque] = useState("");
  const [vivienda,setVivienda] = useState("");
  const [rows,setRows] = useState([]);

  // ===== CARGAR SHEET =====
  useEffect(()=>{
    if(!obra) return;
    const sheetId = OBRAS[obra].sheetId;
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

    fetch(url)
      .then(r=>r.text())
      .then(txt=>{
        const json = JSON.parse(txt.substring(txt.indexOf("{"), txt.lastIndexOf("}")+1));
        const cols = json.table.cols.map(c=>c.label);
        const data = json.table.rows.map(r=>{
          const o={};
          r.c.forEach((c,i)=>o[cols[i]] = c?.v || "");
          return o;
        });
        setRows(data.reverse());
      });
  },[obra]);

  // ===== PROGRESO =====
  function progresoVivienda(num){
    const ult = rows.find(r => r["Vivienda"] === `V${num}`);
    if(!ult) return {pct:0, done:0, total:TAREAS.length};

    let done = 0;
    TAREAS.forEach(t=>{
      if(String(ult[t]).toLowerCase().includes("sí")) done++;
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
        <h2>Panel de Progreso de Obra</h2>
        <img src="/logos/winplast.png" style={styles.logo}/>
      </header>

      <div style={styles.body}>
        <aside style={styles.panel}>
          <select onChange={e=>{setObra(e.target.value);setBloque("");}}>
            <option value="">Obra</option>
            {Object.keys(OBRAS).map(o=><option key={o}>{o}</option>)}
          </select>

          {obra && (
            <select onChange={e=>{setBloque(e.target.value);setVivienda("");}}>
              <option value="">Bloque</option>
              {Object.keys(OBRAS[obra].bloques).map(b=><option key={b}>{b}</option>)}
            </select>
          )}

          {bloque && (
            <select onChange={e=>setVivienda(e.target.value)}>
              <option value="">Vivienda</option>
              {OBRAS[obra].bloques[bloque].map(v=><option key={v}>V{v}</option>)}
            </select>
          )}
        </aside>

        <main style={styles.main}>
          {!vivienda && <p>Selecciona una vivienda</p>}
          {vivienda && (()=> {
            const p = progresoVivienda(vivienda);
            return (
              <div style={styles.card}>
                <h3>Vivienda V{vivienda}</h3>
                <p>{p.done}/{p.total} tareas</p>
                <div style={styles.bar}>
                  <div style={{...styles.barFill,width:`${p.pct}%`}} />
                </div>
                <strong>{p.pct}%</strong>
              </div>
            )
          })()}
        </main>
      </div>
    </div>
  );
}

// ===== ESTILOS =====
const styles = {
  page:{background:"#e6e6e6",minHeight:"100vh"},
  header:{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    padding:10,
    border:"4px double",
    borderColor:"blue green",
    background:"#f2f2f2"
  },
  logo:{height:40},
  body:{display:"flex"},
  panel:{
    width:260,
    background:"#d9d9d9",
    padding:10,
    borderRight:"4px double",
    borderColor:"blue green"
  },
  main:{flex:1,padding:20},
  card:{
    background:"#fff",
    padding:20,
    border:"4px double",
    borderColor:"blue green"
  },
  bar:{height:12,background:"#ccc",borderRadius:6,overflow:"hidden"},
  barFill:{height:12,background:"green"}
};
