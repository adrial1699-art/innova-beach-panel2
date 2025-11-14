import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const SHEET_ID = "17aB2MrWCG573pSNPatGqQ89UglR0mhCokGb1C0CG7bw";
const SHEET_GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

export default function PanelInnovaBeach(){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    fetch(SHEET_GVIZ_URL).then(r=>r.text()).then(t=>{
      const jsonText=t.replace(/^.*setResponse\(|\);?\s*$/gs,"");
      const data=JSON.parse(jsonText);
      const cols=data.table.cols.map(c=>c.label||c.id);
      const parsed=data.table.rows.map(r=>{
        const o={};
        r.c.forEach((c,i)=>o[cols[i]]=(c&&c.v)||"");
        return o;
      });
      setRows(parsed.reverse());
    }).catch(e=>console.error(e)).finally(()=>setLoading(false));
  },[]);

  async function generatePDF(){
    try{
      const el = document.getElementById('panel-root');
      if(!el) return alert('No se encontró el panel para generar PDF.');
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p','mm','a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Progreso_InnovaBeachIII_${new Date().toISOString().slice(0,10)}.pdf`);
    }catch(e){ console.error(e); alert('Error generando PDF: '+e.message); }
  }

  return (
    <div id="panel-root" className="p-4">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <img src="/logo-innova.png" alt="Innova" style={{height:40}}/>
          <div>
            <div className="text-sm text-gray-500">PROGRESO OBRA</div>
            <div className="text-2xl font-semibold">Innova Beach III — Control de montaje</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>navigator.clipboard?.writeText(window.location.href)} className="px-3 py-2 border rounded">QR</button>
          <button onClick={generatePDF} className="px-3 py-2 bg-blue-600 text-white rounded">Descargar PDF</button>
        </div>
      </header>

      <section className="mb-6 p-4 border rounded bg-white">
        <h2 className="text-lg font-semibold mb-2">Últimas respuestas</h2>
        {loading ? <div>Cargando...</div> : rows.slice(0,6).map((r,i)=>(
          <div key={i} className="p-2 border-b">
            <strong>{r["Vivienda"] || '—'}</strong> — {r["Tareas realizadas"] || ''}
          </div>
        ))}
      </section>
    </div>
  );
}
