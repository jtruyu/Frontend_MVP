// App.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [pantalla, setPantalla] = useState("inicio");
  const [tiempo, setTiempo] = useState(40 * 60);
  const [tiempoInicial] = useState(40 * 60);
  const [tiempoActivo, setTiempoActivo] = useState(false);
  const [datosUsuario, setDatosUsuario] = useState({ nombre: "", correo: "" });
  const [comentarioResultado, setComentarioResultado] = useState("");
  const [resultadosTemporales, setResultadosTemporales] = useState(null);

  const [pantallaBanco, setPantallaBanco] = useState(false);
  const [temasFisica, setTemasFisica] = useState([]);
  const [temasSeleccionados, setTemasSeleccionados] = useState([]);
  const [preguntasBanco, setPreguntasBanco] = useState([]);
  const [respuestasBanco, setRespuestasBanco] = useState({});
  const [preguntaActualBanco, setPreguntaActualBanco] = useState(0);

  const obtenerOrdenCurso = (curso) => {
    const ordenCursos = {
      "RM": 1,
      "Aritmética": 2,
      "Álgebra": 3,
      "Geometría": 4,
      "Trigonometría": 5,
      "Física": 6,
      "Química": 7
    };
    return ordenCursos[curso] || 999;
  };

  const iniciarDiagnostico = async () => {
    setCargando(true);
    setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(40 * 60);
    setTiempoActivo(true);
    setPantalla("diagnostico");

    try {
      const response = await axios.get("https://backend-mvp-a6w0.onrender.com/diagnostico", {
        params: { num_preguntas: 10 }
      });
      if (response.data && response.data.length > 0) {
        const preguntasOrdenadas = [...response.data].sort((a, b) => obtenerOrdenCurso(a.curso) - obtenerOrdenCurso(b.curso));
        setPreguntas(preguntasOrdenadas);
      } else {
        alert("No se pudieron cargar suficientes preguntas. Intenta nuevamente.");
        setPantalla("inicio");
      }
    } catch (error) {
      console.error("Error al obtener preguntas:", error);
      alert("Error al cargar las preguntas. Por favor, intenta de nuevo.");
      setPantalla("inicio");
    } finally {
      setCargando(false);
    }
  };

  const cargarTemasFisica = async () => {
    try {
      const response = await axios.get("https://backend-mvp-a6w0.onrender.com/temas-fisica");
      setTemasFisica(response.data);
    } catch (error) {
      console.error("Error al cargar temas de física:", error);
    }
  };

  const iniciarBancoPreguntas = async () => {
    try {
      const response = await axios.post("https://backend-mvp-a6w0.onrender.com/banco-preguntas", { temas: temasSeleccionados });
      const aleatorias = [...response.data].sort(() => Math.random() - 0.5);
      setPreguntasBanco(aleatorias);
      setRespuestasBanco({});
      setPreguntaActualBanco(0);
      setPantalla("banco");
    } catch (error) {
      console.error("Error al iniciar banco de preguntas:", error);
    }
  };

  const seleccionarRespuestaBanco = (id, letra) => {
    setRespuestasBanco((prev) => ({ ...prev, [id]: letra }));
  };

  const verificarRespuesta = (pregunta) => {
    const r = respuestasBanco[pregunta.ejercicio];
    return r === pregunta.alt_correcta;
  };

  const siguienteBanco = () => {
    if (preguntaActualBanco < preguntasBanco.length - 1) {
      setPreguntaActualBanco(preguntaActualBanco + 1);
    } else {
      const nuevaRonda = [...preguntasBanco].sort(() => Math.random() - 0.5);
      setPreguntasBanco(nuevaRonda);
      setPreguntaActualBanco(0);
    }
  };

  // Resto de pantallas de diagnóstico (sin modificar)
  // ...

  if (pantalla === "inicio") {
    return (
      <div className="container inicio-container">
        <h1>EDBOT</h1>
        <p style={{ marginBottom: "30px", fontSize: "1.2rem" }}>Preparación preuniversitaria impulsada por IA</p>
        <div style={{ display: "flex", gap: "30px", justifyContent: "center", flexWrap: "wrap" }}>
          <div className="inicio-content">
            <h2>Prueba diagnóstica</h2>
            <p>Evalúa tu nivel de preparación con 10 preguntas de admisión a la UNI.</p>
            <button className="boton-iniciar" onClick={iniciarDiagnostico}>Iniciar</button>
          </div>
          <div className="inicio-content">
            <h2>Banco de preguntas</h2>
            <p>Accede a ejercicios por temas de prácticas anteriores de Física CEPREUNI.</p>
            <button className="boton-iniciar" onClick={() => { cargarTemasFisica(); setPantalla("temas-banco"); }}>Iniciar</button>
          </div>
        </div>
      </div>
    );
  }

  if (pantalla === "temas-banco") {
    return (
      <div className="container">
        <h1>Selecciona los temas</h1>
        <p>Puedes elegir uno o varios temas.</p>
        {temasFisica.map((tema, i) => (
          <label key={i}>
            <input type="checkbox" checked={temasSeleccionados.includes(tema)} onChange={() => {
              setTemasSeleccionados((prev) => prev.includes(tema) ? prev.filter(t => t !== tema) : [...prev, tema]);
            }} /> {tema}
          </label>
        ))}
        <br />
        <button className="boton-iniciar" disabled={temasSeleccionados.length === 0} onClick={iniciarBancoPreguntas}>Empezar</button>
        <br />
        <button className="boton-nav" onClick={() => setPantalla("inicio")}>Volver a inicio</button>
      </div>
    );
  }

  if (pantalla === "banco") {
    const pregunta = preguntasBanco[preguntaActualBanco];
    const marcada = respuestasBanco[pregunta.ejercicio];
    const correcta = verificarRespuesta(pregunta);
    return (
      <div className="container">
        <h2 className="ejercicio-texto">
          <span dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></span>
        </h2>
        {pregunta.imagen && <img src={pregunta.imagen} alt="Ejercicio" className="imagen-ejercicio" />}
        <ul className="opciones-lista">
          {["a", "b", "c", "d", "e"].map((letra) => (
            <li key={letra} className="opcion">
              <label>
                <input
                  type="radio"
                  name={`pregunta-${pregunta.ejercicio}`}
                  value={letra.toUpperCase()}
                  checked={marcada === letra.toUpperCase()}
                  onChange={() => seleccionarRespuestaBanco(pregunta.ejercicio, letra.toUpperCase())}
                />
                <span className="texto-opcion">{letra.toUpperCase()}:</span>
                <span className="texto-opcion" dangerouslySetInnerHTML={{ __html: pregunta[letra] }}></span>
              </label>
            </li>
          ))}
        </ul>
        {marcada && <p style={{ marginTop: 20, fontWeight: "bold" }}>{correcta ? "✅ Correcta" : `❌ Incorrecta. Respuesta correcta: ${pregunta.alt_correcta}`}</p>}
        <div className="controles-navegacion">
          <button className="boton-nav" onClick={() => setPantalla("temas-banco")}>Volver a temas</button>
          <button className="boton-finalizar" onClick={siguienteBanco} disabled={!marcada}>Siguiente</button>
        </div>
      </div>
    );
  }

  return <div className="container cargando-container"><div className="spinner"></div><p>Cargando...</p></div>;
}

export default App;
