import { useState } from "react";

const DATA = {
  "Innova Beach III": {
    bloques: {
      "Bloque 1": [1,2,3,4,5,6],
      "Bloque 2": [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
      "Dúplex": [23,24]
    }
  },

  "Innova Beach IV": {
    bloques: {
      "Bloque 1": [1,2,3,4,5,6,7,8],
      "Bloque 2": [9,10,11,12,13,14,15,16],
      "Bloque 3": [17,18,19,20,21,22,23,24,25,26,27,28],
      "Bloque 4": [29,30,31,32,33,34],
      "Bloque 5": [35,36,37,38,39,40,41,42,43,44]
    }
  },

  "Innova Thiar": {
    bloques: {
      "Bloque 1": [1,2,3,4,5,6,7,8],
      "Bloque 2": [9,10,11,12,13,14,15,16],
      "Bloque 3": [17,18,19,20,21,22,23,24,25,26,27,28],
      "Bloque 4": [29,30,31,32,33,34],
      "Bloque 5": [35,36,37,38,39,40,41,42,43,44]
    }
  }
};

export default function App() {
  const [obra, setObra] = useState("");
  const [bloque, setBloque] = useState("");
  const [vivienda, setVivienda] = useState("");

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <img src="/logos/innova.png" style={styles.logo} />
        <h2>Panel de Progreso de Obra</h2>
        <img src="/logos/winplast.png" style={styles.logo} />
      </header>

      <div style={styles.container}>
        <aside style={styles.panel}>
          <h3>Selección</h3>

          <select
            style={styles.select}
            value={obra}
            onChange={e => {
              setObra(e.target.value);
              setBloque("");
              setVivienda("");
            }}
          >
            <option value="">Selecciona obra</option>
            {Object.keys(DATA).map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          {obra && (
            <select
              style={styles.select}
              value={bloque}
              onChange={e => {
                setBloque(e.target.value);
                setVivienda("");
              }}
            >
              <option value="">Selecciona bloque</option>
              {Object.keys(DATA[obra].bloques).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}

          {bloque && (
            <select
              style={styles.select}
              value={vivienda}
              onChange={e => setVivienda(e.target.value)}
            >
              <option value="">Selecciona vivienda</option>
              {DATA[obra].bloques[bloque].map(v => (
                <option key={v} value={v}>V{v}</option>
              ))}
            </select>
          )}
        </aside>

        <main style={styles.main}>
          {!vivienda && (
            <p>Selecciona una vivienda para ver su información.</p>
          )}

          {vivienda && (
            <div style={styles.card}>
              <h3>{obra}</h3>
              <p><strong>{bloque}</strong></p>
              <p><strong>Vivienda:</strong> V{vivienda}</p>

              <p style={{marginTop:10, color:"#666"}}>
                (Aquí irá el listado de tareas, progreso y fotos)
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#e5e5e5",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    background: "#f2f2f2",
    border: "4px double",
    borderColor: "blue green"
  },
  logo: {
    height: 40
  },
  container: {
    display: "flex"
  },
  panel: {
    width: 260,
    background: "#dcdcdc",
    padding: 15,
    borderRight: "4px double",
    borderColor: "blue green"
  },
  select: {
    width: "100%",
    padding: 6,
    marginBottom: 10
  },
  main: {
    flex: 1,
    padding: 20
  },
  card: {
    background: "#ffffff",
    padding: 20,
    border: "4px double",
    borderColor: "blue green"
  }
};
