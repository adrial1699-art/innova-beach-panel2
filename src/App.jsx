
import { useState } from "react";
import { OBRAS } from "./config/obras";

export default function App(){
  const [obra,setObra]=useState("");
  return (
    <div style={{padding:20}}>
      <h2>Seleccionar obra</h2>
      <select onChange={e=>setObra(e.target.value)}>
        <option value="">-- seleccionar --</option>
        {Object.keys(OBRAS).map(o=><option key={o}>{o}</option>)}
      </select>
      {obra && <img src={OBRAS[obra].plano} style={{maxWidth:"100%",marginTop:20}} />}
    </div>
  );
}
