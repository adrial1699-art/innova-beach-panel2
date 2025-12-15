
import { useState } from "react";
import { OBRAS } from "./config/obras";

export default function App(){
  const [obra,setObra]=useState("");
  return (
    <div style={{padding:20,fontFamily:"Arial"}}>
      <h2>Seleccionar obra</h2>
      <select onChange={e=>setObra(e.target.value)}>
        <option value="">-- seleccionar --</option>
        {Object.keys(OBRAS).map(o=><option key={o}>{o}</option>)}
      </select>
      {obra && (
        <div>
          <h3>{obra}</h3>
          <img src={OBRAS[obra].plano} style={{maxWidth:"100%"}} />
        </div>
      )}
    </div>
  );
}
