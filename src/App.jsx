import { useEffect, useState } from "react";

const SHEET_ID = "17aB2MrWCG573pSNPatGqQ89UglR0mhCokGb1C0CG7bw";

const OBRAS = {
  "INNOVA BEACH III": {
    bloques: {
      "Bloque 1": [1,2,3,4,5,6],
      "Bloque 2": [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
      "Dúplex": [23,24]
    }
  },
  "INNOVA BEACH IV": {
    bloques: {
      "Bloque 1": [1,2,3,4,5,6,7,8],
      "Bloque 2": [9,10,11,12,13,14,15,16],
      "Bloque 3": [17,18,19,20,21,22,23,24,25,26,27,28],
      "Bloque 4": [29,30,31,32,33,34],
      "Bloque 5": [35,36,37,38,39,40,41,42,43,44],
    }
  },
  "INNOVA THIAR": {
    bloques: {
      "Bloque 1": [1,2,3,4,5,6,7,8],
      "Bloque 2": [9,10,11,12,13,14,15,16],
      "Bloque 3": [17,18,19,20,21,22,23,24,25,26,27,28],
      "Bloque 4": [29,30,31,32,33,34],
      "Bloque 5": [35,36,37,38,39,40,41,42,43,44],
    }
  }
};

// Lista base de tareas (luego afinamos reglas)
const TASKS = [
  "Poner Ventanas",
  "Poner hojas correderas",
  "Cristales fijos",
  "Poner manetas",
  "Regular",
  "Poner cierres",
  "Poner chapita",
  "Sellado interior",
  "Sellado exterior",
];

export default function App() {
  const [obra, setObra] = useState("");
  const [bloque, setBloque] = useState("");
  const [vivienda, setVivienda] = useState("");
  const [rows, setRows] = useState([]);

  // Cargar datos del Sheet según obra (pestaña)
  useEffect(() => {
    if (!obra) return;

    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(obra)}`;

    fetch(url)
      .then(r => r.text())
      .then(text => {
        const json = JSON.parse(text.substring(47, text.length - 2));
        const cols = json.table.cols.map(c => c.label);
        const data = json.table.rows.map(r => {
          const obj = {};
          r.c.forEach((cell, i) => {
            obj[cols[i]] = cell ? cell.v : "";
          });
          return obj;
        });
        setRows(data);
      })
      .catch(err => {
        console.error("Error leyendo sheet", err);
        setRows([]);
      });
  }, [obra]);

  // Filas SOLO de la vivienda seleccionada
  const rowsVivienda = rows.filter(r => String(r["Vivienda"]).replace("V","") === String(vivienda));

  // Progreso por tarea (último estado manda)
  const tareasEstado = TASKS.map(t => {
    let hecho = false;
    rowsVivienda.forEach(r => {
      if (String(r[t]).toLowerCase().includes("sí")) {
        hecho = true;
      }
    });
    return { tarea: t, hecho };
  });

  const progreso = Math.round(
    (tareasEstado.filter(t => t.hecho).length / TASKS.length) * 100
  );

  return (
    <div style={{ background:"#e5e5e5", minHeight:"100vh", fontFamily:"Arial" }}>
      <header style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
        padding:10,
        background:"#f0f0f0",
        border:"4px double",
        borderColor:"blue green"
      }}>
        <img src="/logos/innova.png" height={40} />
        <h2>Panel de Progreso de Obra</h2>
        <img src="/logos/winplast.png" height={40} />
      </header>

      <div style={{ display:"flex" }}>
        <aside style={{
          width:260,
          padding:15,
          background:"#ddd",
          borderRight:"4px double",
          borderColor:"blue green"
        }}>
          <select style={{ width:"100%", marginBottom:10 }} onChange={e=>{setObra(e.target.value);setBloque("");setVivienda("");}}>
            <option value="">Selecciona obra</option>
            {Object.keys(OBRAS).map(o=>(
              <option key={o}>{o}</option>
            ))}
          </select>

          {obra && (
            <select style={{ width:"100%", marginBottom:10 }} onChange={e=>{setBloque(e.target.value);setVivienda("");}}>
              <option value="">Selecciona bloque</option>
              {Object.keys(OBRAS[obra
