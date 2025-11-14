import React, { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* Panel Innova Beach III - versión con reglas de aplicabilidad y 'Bajo escalera' como extra
   - Compatible con React 18, react-qr-code, html2canvas, jspdf
   - Reemplaza src/PanelInnovaBeach.jsx en tu repo
*/

const SHEET_ID = "17aB2MrWCG573pSNPatGqQ89UglR0mhCokGb1C0CG7bw";
const SHEET_GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

const TASKS = [
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
  "Bajo escalera",
  "Poner cristales solarium",
  "Poner cristales terraza",
  "Sellar cristales",
  "Poner vigas 7016",
  "Ventanas de sótano",
];

// ----------------- Helpers de aplicabilidad y 'bajo escalera' -----------------
function isArriba(numero) { return numero % 2 === 0; } // pares arriba
function isDuplex(numero) { return numero >= 23; } // V23,V24 dúplex

function esEsquineroPorBloque(numero) {
  if (numero >= 1 && numero <= 6) return numero === 1 || numero === 2 || numero === 5 || numero === 6;
  if (numero >= 7 && numero <= 22) return numero === 7 || numero === 8 || numero === 21 || numero === 22;
  if (numero >= 23) return true; // dúplex: incluir esquinero
  return false;
}

// Comprueba en la fila latest si hay columna indicando 'Bajo escalera activo' = 'sí'
// Si no existe, usa localStorage 'ib_bajo_V{numero}' como fallback
function isBajoActiveFromSheetOrLocal(latestRow, numero) {
  if (latestRow) {
    const keysToTry = ["Bajo escalera activo","Bajo escalera (activo)","Bajo escalera activo?","bajo escalera activo","bajo escalera"];
    for (const k of keysToTry) {
      const v = latestRow[k] ?? latestRow[k.toLowerCase()] ?? null;
      if (v && String(v).toLowerCase().includes("sí")) return true;
    }
  }
  try {
    const key = `ib_bajo_V${numero}`;
    const v = localStorage.getItem(key);
    return v === "1";
  } catch (e) {
    return false;
  }
}

function toggleBajoLocal(numero) {
  try {
    const key = `ib_bajo_V${numero}`;
    const current = localStorage.getItem(key) === "1";
    const v = current ? "0" : "1";
    localStorage.setItem(key, v);
    window.dispatchEvent(new CustomEvent("ib_bajo_toggled", { detail: { numero, value: v } }));
    return v === "1";
  } catch (e) {
    console.error("toggleBajoLocal", e);
    return false;
  }
}
// -------------------------------------------------------------------------------

// util: parse gviz result
function parseGVIZ(text) {
  try {
    const jsonText = text.replace(/^.*setResponse\(|\);?\s*$/gs, "");
    const data = JSON.parse(jsonText);
    const cols = (data.table.cols || []).map((c) => c.label || c.id);
    const rows = (data.table.rows || []).map((r) => {
      const obj = {};
      (r.c || []).forEach((cell, i) => (obj[cols[i]] = (cell && cell.v) || ""));
      return obj;
    });
    return { cols, rows };
  } catch (e) {
    console.error("parseGVIZ", e);
    return { cols: [], rows: [] };
  }
}

function pctToColor(pct) {
  if (pct === 100) return "bg-green-500";
  if (pct > 0) return "bg-yellow-400";
  return "bg-red-500";
}

function smallDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (!isNaN(d)) return d.toISOString().slice(0,10);
  const p = Date.parse(String(ts));
  if (!isNaN(p)) return new Date(p).toISOString().slice(0,10);
  return String(ts);
}

export default function PanelInnovaBeach() {
  const [rows, setRows] = useState([]);
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => {
    try {
      const s = localStorage.getItem("ib_dark");
      if (s !== null) return s === "1";
      const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|Mobile/.test(navigator.userAgent);
      return isMobile;
    } catch { return true; }
  });

  // Bajo escalera version state (force recalculation)
  const [bajoVersion, setBajoVersion] = useState(0);

  // UI state
  const [compact, setCompact] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showQR, setShowQR] = useState(false);
  const [showIncident, setShowIncident] = useState(false);
  const [selectedVivienda, setSelectedVivienda] = useState(null);
  const [collapsedBlocks, setCollapsedBlocks] = useState({ "Bloque 1": false, "Bloque 2": false, "Dúplex": false });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("ib_dark", dark ? "1" : "0"); } catch {}
  }, [dark]);

  useEffect(() => {
    setLoading(true);
    fetch(SHEET_GVIZ_URL).then(r=>r.text()).then(t=>parseGVIZ(t)).then(({cols, rows})=>{ setCols(cols); setRows(rows.reverse()); }).catch(e=>{console.error(e); setRows([]);}).finally(()=>setLoading(false));
  }, []);

  // listen to bajo toggle events triggered by toggleBajoLocal
  useEffect(() => {
    const handler = (e) => { setBajoVersion(s => s + 1); };
    window.addEventListener("ib_bajo_toggled", handler);
    return () => window.removeEventListener("ib_bajo_toggled", handler);
  }, []);

  // viviendas static
  const viviendasList = useMemo(() => {
    const list = [];
    for (let i = 1; i <= 24; i++) {
      const v = `V${i}`;
      const bloque = i <= 6 ? "Bloque 1" : i <= 22 ? "Bloque 2" : "Dúplex";
      list.push({ vivienda: v, numero: i, bloque });
    }
    return list;
  }, []);

  // latestByVivienda map
  const latestByVivienda = useMemo(() => {
    const map = {};
    for (const r of rows) {
      const v = r["Vivienda"] || r["vivienda"];
      if (!v) continue;
      if (!map[v]) map[v] = r;
    }
    return map;
  }, [rows]);

  // resumenViviendas with aplicability and bajo handling
  const resumenViviendas = useMemo(() => {
    const res = viviendasList.map((item) => {
      const latest = latestByVivienda[item.vivienda] || null;
      const numero = item.numero;

      // base aplicables (exclude 'Bajo escalera' initially)
      const aplicablesBase = TASKS.filter((t) => {
        const tareaLower = String(t).toLowerCase();
        const arriba = isArriba(numero), duplex = isDuplex(numero);
        if (tareaLower.includes("esquinero")) return esEsquineroPorBloque(numero);
        if (tareaLower.includes("fijos") || tareaLower.includes("cristales solarium") || tareaLower.includes("cristales terraza") || tareaLower.includes("sellar cristales") || tareaLower.includes("cristales fijo")) return arriba;
        if (tareaLower.includes("sótano") || tareaLower.includes("sotano")) return duplex;
        if (tareaLower.includes("bajo escalera")) return false; // managed separately
        return true;
      });

      // check if bajo escalera active (sheet or local)
      const bajoActivo = isBajoActiveFromSheetOrLocal(latest, numero);

      const aplicables = bajoActivo ? [...aplicablesBase, TASKS.find(t => t.toLowerCase().includes("bajo escalera"))].filter(Boolean) : aplicablesBase;

      // count done using latest or fallback to history rows
      let done = 0;
      aplicables.forEach((t) => {
        const claveExacta = t;
        const claveLower = t.toLowerCase();
        let valor = latest ? (latest[claveExacta] ?? latest[claveLower] ?? "") : "";
        let marcado = String(valor).toLowerCase().includes("sí");
        if (!marcado && rows && rows.length) {
          for (const r of rows) {
            const v = (r[claveExacta] ?? r[claveLower] ?? "");
            if (String(v).toLowerCase().includes("sí")) { marcado = true; break; }
          }
        }
        if (marcado) done++;
      });

      const total = aplicables.length;
      const pct = total ? Math.round((done / total) * 1000) / 10 : 0;
      const foto = latest && (latest["Foto"] || latest["foto"] || "");
      return { ...item, done, total, pct, foto, latest, aplicables, bajoActivo };
    });
    return res;
  }, [viviendasList, latestByVivienda, rows, bajoVersion]);

  // summary per block
  const bloques = useMemo(() => {
    const map = {};
    resumenViviendas.forEach((v) => {
      if (!map[v.bloque]) map[v.bloque] = [];
      map[v.bloque].push(v);
    });
    const summary = {};
    Object.keys(map).forEach((k) => {
      const arr = map[k];
      const avg = Math.round((arr.reduce((s, x) => s + x.pct, 0) / arr.length) * 10) / 10 || 0;
      summary[k] = {
        avg,
        viviendas: arr,
        finalizadas: arr.filter((x) => x.pct === 100).length,
        enproceso: arr.filter((x) => x.pct > 0 && x.pct < 100).length,
        pendientes: arr.filter((x) => x.pct === 0).length,
      };
    });
    return summary;
  }, [resumenViviendas]);

  // filtered viviendas
  const filteredViviendas = useMemo(() => {
    let arr = resumenViviendas;
    if (filter === "pendientes") arr = arr.filter((v) => v.pct === 0);
    if (filter === "completadas") arr = arr.filter((v) => v.pct === 100);
    return arr;
  }, [resumenViviendas, filter]);

  // stats
  const statsByTask = useMemo(() => {
    const counts = {};
    TASKS.forEach((t) => (counts[t] = 0));
    for (const r of rows) {
      TASKS.forEach((t) => {
        const v = r[t] || r[t.toLowerCase()];
        if (v && String(v).toLowerCase().includes("sí")) counts[t]++;
      });
    }
    return counts;
  }, [rows]);

  const statsByDate = useMemo(() => {
    const map = {};
    for (const r of rows) {
      const date = smallDate(r["Marca temporal"] || r["Marca Temporal"] || r["Timestamp"] || r["Fecha"]);
      if (!date) continue;
      map[date] = (map[date] || 0) + 1;
    }
    return Object.keys(map).sort().map((d) => ({ date: d, count: map[d] }));
  }, [rows]);

  function fotosDeVivienda(vivienda) {
    return rows.filter((r) => {
      const v = r["Vivienda"] || r["vivienda"];
      return v === vivienda && (r["Foto"] || r["foto"]);
    }).map(r => ({ url: r["Foto"] || r["foto"], time: r["Marca temporal"] || r["Marca Temporal"] }));
  }

  function openVivienda(v) { setSelectedVivienda(v); }

  async function generatePDF() {
    try {
      const el = document.getElementById("panel-root");
      if (!el) return alert("Elemento de panel no encontrado.");
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p","mm","a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Progreso_InnovaBeachIII_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) { console.error(e); alert("Error generando PDF: "+e.message); }
  }

  // simple components
  function ViviendaCard({ v }) {
    const colorClass = pctToColor(v.pct);
    return (
      <div className={`p-3 rounded shadow bg-white dark:bg-slate-800 ${compact ? "text-sm p-2" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-white font-semibold`}>{Math.round(v.pct)}</div>
            <div>
              <div className="font-semibold">{v.vivienda} <span className="text-sm text-slate-400 ml-2">{v.bloque}</span></div>
              <div className="text-sm text-slate-400">{v.done}/{v.total} tareas</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {v.foto ? <img src={v.foto} alt="foto" className="h-12 w-20 object-cover rounded" /> : <div className="text-sm text-slate-400">Sin foto</div>}
            <button onClick={() => openVivienda(v.vivienda)} className="px-2 py-1 bg-blue-600 text-white rounded">Ver</button>
          </div>
        </div>
      </div>
    );
  }

  function toggleBlock(bk) { setCollapsedBlocks(s => ({ ...s, [bk]: !s[bk] })); }

  const globalPct = useMemo(() => {
    const all = resumenViviendas;
    if (!all.length) return 0;
    return Math.round((all.reduce((s,x)=>s+x.pct,0)/all.length)*10)/10;
  }, [resumenViviendas]);

  return (
    <div id="panel-root" className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img src="/logo-innova.png" alt="Innova" className="h-10" />
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-300">PROGRESO OBRA</div>
            <div className="text-2xl font-semibold">Innova Beach III — Control de montaje</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={()=>setShowQR(true)} className="px-3 py-2 bg-white dark:bg-slate-800 border rounded">QR</button>
          <button onClick={()=>setShowIncident(true)} className="px-3 py-2 bg-green-600 text-white rounded">Incidencia</button>
          <button onClick={generatePDF} className="px-3 py-2 bg-indigo-600 text-white rounded">Descargar PDF</button>
          <button onClick={()=>setCompact(c=>!c)} className="px-3 py-2 border rounded">{compact ? "Vista normal" : "Compactar"}</button>
          <button onClick={()=>setDark(d=>!d)} className="px-3 py-2 bg-blue-600 text-white rounded">{dark ? "Claro" : "Oscuro"}</button>
          <img src="/logo-winplast.png" alt="Winplast" className="h-10" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 p-4 rounded shadow bg-white dark:bg-slate-800">
            <div className="text-sm text-slate-400">Progreso total</div>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{globalPct}%</div>
              <div className="flex-1">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full" style={{ width: `${globalPct}%`, background: "linear-gradient(90deg,#0A4BE0,#007AFF)" }} />
                </div>
              </div>
            </div>
          </div>

          {Object.keys(bloques).map((bk)=> (
            <div key={bk} className="p-4 rounded shadow bg-white dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">{bk}</div>
                <button onClick={()=>toggleBlock(bk)} className="text-xs px-2 py-1 border rounded">{collapsedBlocks[bk] ? "Expandir" : "Colapsar"}</button>
              </div>
              <div className="text-2xl font-semibold">{bloques[bk].avg}%</div>
              <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div className="h-3 rounded-full" style={{ width: `${bloques[bk].avg}%`, background: "linear-gradient(90deg,#0A4BE0,#007AFF)" }} />
              </div>
              <div className="mt-2 text-sm">{bloques[bk].finalizadas} finalizadas • {bloques[bk].enproceso} en proceso • {bloques[bk].pendientes} pendientes</div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          {Object.keys(bloques).map((bk)=> (
            <div key={bk}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{bk}</h3>
                <div className="text-sm text-slate-500">{bloques[bk].viviendas.length} viviendas</div>
              </div>
              {!collapsedBlocks[bk] && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {bloques[bk].viviendas.map((v)=>(<ViviendaCard key={v.vivienda} v={v} />))}
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-4 rounded shadow bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Viviendas (detalle)</h3>
              <div className="flex items-center gap-2">
                <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="p-2 rounded bg-slate-50 dark:bg-slate-700">
                  <option value="all">Todas</option>
                  <option value="pendientes">Pendientes</option>
                  <option value="completadas">Completadas</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {filteredViviendas.map(v=> (
                <div key={v.vivienda} className="p-3 rounded border-b flex items-center justify-between bg-white dark:bg-slate-800">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${pctToColor(v.pct)} flex items-center justify-center text-white font-semibold`}>{Math.round(v.pct)}</div>
                    <div>
                      <div className="font-semibold">{v.vivienda} <span className="text-sm text-slate-400 ml-2">{v.bloque}</span></div>
                      <div className="text-sm text-slate-400">{v.done}/{v.total} tareas {v.bajoActivo? "• Bajo activado": ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>openVivienda(v.vivienda)} className="px-3 py-1 bg-blue-600 text-white rounded">Abrir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded shadow bg-white dark:bg-slate-800">
            <h3 className="text-lg font-semibold mb-3">Estadísticas</h3>
            <div className="mb-3">
              <div className="text-sm text-slate-400 mb-1">Por tarea (ve cantidad de "sí")</div>
              <div className="space-y-2 max-h-36 overflow-auto">
                {Object.entries(statsByTask).map(([t,c])=> (<div key={t} className="flex justify-between items-center"><div className="text-sm">{t}</div><div className="font-semibold">{c}</div></div>))}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Respuestas por día</div>
              <div className="space-y-1 max-h-36 overflow-auto">{statsByDate.map(s=>(<div key={s.date} className="flex justify-between text-sm"><div>{s.date}</div><div className="font-semibold">{s.count}</div></div>))}</div>
            </div>
          </div>
        </section>

        <section className="p-4 rounded shadow bg-white dark:bg-slate-800">
          <h3 className="text-lg font-semibold mb-3">Últimas respuestas (tabla)</h3>
          {loading? <div>Cargando...</div> : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="text-left text-sm text-slate-500 border-b">
                  <tr><th className="py-2 px-2">Fecha</th><th className="py-2 px-2">Vivienda</th><th className="py-2 px-2">Bloque</th><th className="py-2 px-2">Tareas realizadas</th><th className="py-2 px-2">Foto</th></tr>
                </thead>
                <tbody>
                  {rows.slice(0,200).map((r,idx)=> (
                    <tr key={idx} className="border-b">
                      <td className="py-2 px-2 text-sm">{smallDate(r["Marca temporal"] || r["Marca Temporal"] || r["Timestamp"])}</td>
                      <td className="py-2 px-2 text-sm">{r["Vivienda"] || r["vivienda"] || "—"}</td>
                      <td className="py-2 px-2 text-sm">{r["Bloque"] || r["bloque"] || ""}</td>
                      <td className="py-2 px-2 text-sm">{r["Tareas realizadas"] || r["Tareas realizadas"] || ""}</td>
                      <td className="py-2 px-2">{r["Foto"]? <a href={r["Foto"]} target="_blank" rel="noreferrer"><img src={r["Foto"]} alt="foto" className="h-10 w-20 object-cover rounded"/></a> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded shadow text-center">
            <h4 className="font-semibold mb-4">QR para abrir el panel</h4>
            <div className="mb-4 inline-block p-2 bg-white"><QRCode value={typeof window !== "undefined"? window.location.href : ""} size={180} /></div>
            <div className="flex gap-2 justify-center mt-3"><button onClick={()=>{ navigator.clipboard?.writeText(window.location.href); }} className="px-3 py-2 bg-blue-600 text-white rounded">Copiar enlace</button><button onClick={()=>setShowQR(false)} className="px-3 py-2 bg-slate-200 rounded">Cerrar</button></div>
          </div>
        </div>
      )}

      {showIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded shadow max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-2">Reportar incidencia</h3>
            <IncidentForm onClose={()=>setShowIncident(false)} formUrl={""} />
          </div>
        </div>
      )}

      {selectedVivienda && (
        <ViviendaModal
          vivienda={selectedVivienda}
          onClose={()=>setSelectedVivienda(null)}
          fotos={fotosDeVivienda(selectedVivienda)}
          rows={rows.filter(r => (r["Vivienda"] || r["vivienda"]) === selectedVivienda)}
          toggleBajoLocal={toggleBajoLocal}
        />
      )}
    </div>
  );
}

/* IncidentForm (igual que antes) */
function IncidentForm({ onClose, formUrl }) {
  const [bloque, setBloque] = useState("");
  const [vivienda, setVivienda] = useState("");
  const [texto, setTexto] = useState("");
  const submit = () => {
    if (formUrl) { window.open(formUrl, "_blank"); onClose(); return; }
    const subject = encodeURIComponent("Incidencia - Innova Beach III");
    const body = encodeURIComponent(`Bloque: ${bloque}\nVivienda: ${vivienda}\nDescripcion:\n${texto}`);
    window.location.href = `mailto:tu-email@empresa.com?subject=${subject}&body=${body}`;
  };
  return (
    <>
      <div className="space-y-2">
        <div><label className="block text-sm">Bloque</label><input value={bloque} onChange={(e)=>setBloque(e.target.value)} className="w-full p-2 rounded bg-slate-50 dark:bg-slate-700" /></div>
        <div><label className="block text-sm">Vivienda</label><input value={vivienda} onChange={(e)=>setVivienda(e.target.value)} className="w-full p-2 rounded bg-slate-50 dark:bg-slate-700" /></div>
        <div><label className="block text-sm">Descripción</label><textarea value={texto} onChange={(e)=>setTexto(e.target.value)} className="w-full p-2 rounded h-28 bg-slate-50 dark:bg-slate-700" /></div>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <button onClick={submit} className="px-4 py-2 bg-green-600 text-white rounded">Enviar</button>
        <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded">Cerrar</button>
      </div>
    </>
  );
}

/* Vivienda modal con toggle 'Bajo escalera' incluido (reescrito para usar toggleBajoLocal) */
function ViviendaModal({ vivienda, onClose, fotos = [], rows = [], toggleBajoLocal }) {
  const latest = (rows && rows.length) ? rows[0] : null;
  const numero = Number(String(vivienda).replace(/\D/g,"")) || 0;

  // comprobar estado actual (sheet o local)
  const [bajoActivoState, setBajoActivoState] = useState(isBajoActiveFromSheetOrLocal(latest, numero));

  useEffect(() => {
    setBajoActivoState(isBajoActiveFromSheetOrLocal(latest, numero));
    // listen to toggle outside changes
    const h = () => setBajoActivoState(isBajoActiveFromSheetOrLocal(latest, numero));
    window.addEventListener("ib_bajo_toggled", h);
    return () => window.removeEventListener("ib_bajo_toggled", h);
  }, [latest, numero]);

  const aplicables = TASKS.filter((t) => {
    const tl = t.toLowerCase();
    if (tl.includes("esquinero")) return esEsquineroPorBloque(numero);
    if (tl.includes("fijos") || tl.includes("cristales solarium") || tl.includes("cristales terraza") || tl.includes("sellar cristales") || tl.includes("cristales fijo")) return isArriba(numero);
    if (tl.includes("sótano") || tl.includes("sotano")) return isDuplex(numero);
    if (tl.includes("bajo escalera")) return bajoActivoState;
    return true;
  });

  const taskStatuses = aplicables.map((t) => {
    const keyExact = t, keyLower = t.toLowerCase();
    const valLatest = latest ? (latest[keyExact] ?? latest[keyLower] ?? "") : "";
    let done = String(valLatest).toLowerCase().includes("sí");
    if (!done && rows && rows.length) {
      for (const r of rows) {
        const v = (r[keyExact] ?? r[keyLower] ?? "");
        if (String(v).toLowerCase().includes("sí")) { done = true; break; }
      }
    }
    return { task: t, done };
  });

  const doneCount = taskStatuses.filter(s=>s.done).length;
  const total = taskStatuses.length;
  const pct = total ? Math.round((doneCount/total)*1000)/10 : 0;
  const url = typeof window !== "undefined" ? window.location.href.split("?")[0] + `?vivienda=${vivienda}` : `?vivienda=${vivienda}`;

  const handleToggle = () => {
    const newVal = toggleBajoLocal ? toggleBajoLocal(numero) : toggleBajoLocal(numero);
    // set local state based on localStorage after toggling
    setBajoActivoState(isBajoActiveFromSheetOrLocal(latest, numero));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white dark:bg-slate-800 rounded shadow max-w-4xl w-full p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Vivienda {vivienda}</h3>
          <div className="flex items-center gap-2">
            <div className="inline-block p-2 bg-white"><QRCode value={url} size={80} /></div>
            <button onClick={onClose} className="px-3 py-1 bg-slate-200 rounded">Cerrar</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <h4 className="font-semibold mb-2">Fotos ({fotos.length})</h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {fotos.length ? fotos.map((f,i)=>(<a key={i} href={f.url} target="_blank" rel="noreferrer" className="block"><img src={f.url} alt={`foto-${i}`} className="w-full h-28 object-cover rounded"/><div className="text-xs text-slate-400 mt-1">{smallDate(f.time)}</div></a>)) : <div className="text-sm text-slate-400">No hay fotos para esta vivienda.</div>}
            </div>

            <div className="p-3 rounded border bg-white dark:bg-slate-800 mb-3">
              <div className="flex items-center justify-between mb-2"><div className="text-sm text-slate-400">Resumen progreso</div><div className="font-semibold">{pct}%</div></div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden mb-2"><div className="h-3 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#0A4BE0,#007AFF)" }} /></div>
              <div className="text-sm text-slate-400">{doneCount} de {total} tareas hechas</div>
            </div>

            <div className="p-3 rounded border bg-white dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div><div className="font-medium">Bajo escalera (extra)</div><div className="text-sm text-slate-400">Activar para incluir en cálculo</div></div>
                <div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={bajoActivoState} onChange={handleToggle} className="sr-only" />
                    <span className={`w-11 h-6 inline-block rounded-full ${bajoActivoState ? 'bg-green-500' : 'bg-slate-300'}`} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-semibold mb-2">Desglose tareas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {taskStatuses.map((s)=> (<div key={s.task} className="flex items-center gap-3 p-2 rounded border bg-white dark:bg-slate-800"><div className="w-8 flex-shrink-0">{s.done ? (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-500"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>) : (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-slate-400"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)}</div><div className="flex-1"><div className={`font-medium ${s.done ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>{s.task}</div><div className="text-xs text-slate-400">{s.done ? "Hecho" : "Pendiente"}</div></div></div>))}
            </div>

            <div className="mt-4">
              <h5 className="font-semibold mb-2">Historial reciente</h5>
              <div className="max-h-48 overflow-auto space-y-2">
                {rows.length ? rows.map((r,i)=>(<div key={i} className="p-2 border rounded bg-white dark:bg-slate-800"><div className="text-sm text-slate-400 mb-1">{smallDate(r["Marca temporal"] || r["Marca Temporal"] || r["Timestamp"])}</div><div className="text-sm">{r["Tareas realizadas"] || r["Tareas realizadas"] || ""}</div>{r["Foto"] ? <a href={r["Foto"]} target="_blank" rel="noreferrer"><img src={r["Foto"]} alt="foto" className="mt-2 h-20 w-full object-cover rounded" /></a> : null}</div>)) : <div className="text-sm text-slate-400">No hay historial para esta vivienda.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
