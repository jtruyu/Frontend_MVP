// Archivo App.js actualizado
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [pantalla, setPantalla] = useState("inicio");
  const [tipoPrueba, setTipoPrueba] = useState("");
  const [preguntas, setPreguntas] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [tiempo, setTiempo] = useState(0);
  const [tiempoInicial, setTiempoInicial] = useState(0);
  const [tiempoActivo, setTiempoActivo] = useState(false);
  const [datosUsuario, setDatosUsuario] = useState({ nombre: "", correo: "" });
  const [resultados, setResultados] = useState(null);

  useEffect(() => {
    let timer;
    if (tiempoActivo && tiempo > 0) {
      timer = setInterval(() => setTiempo(t => t - 1), 1000);
    } else if (tiempo === 0 && tiempoActivo) {
      finalizar();
    }
    return () => clearInterval(timer);
  }, [tiempo, tiempoActivo]);

  const iniciarPrueba = async (tipo) => {
    setTipoPrueba(tipo);
    setPantalla("cargando");
    setRespuestas({});
    setPreguntaActual(0);
    setTiempo(tipo === "diagnostico" ? 40 * 60 : 108 * 60);
    setTiempoInicial(tipo === "diagnostico" ? 40 * 60 : 108 * 60);
    setTiempoActivo(true);

    try {
      const endpoint = tipo === "diagnostico" ? "/simulacro" : "/simulacro_completo";
      const { data } = await axios.get(`https://backend-mvp-a6w0.onrender.com${endpoint}`);
      setPreguntas(data);
      setPantalla("simulacro");
    } catch (err) {
      alert("Error al cargar preguntas.");
      setPantalla("inicio");
    }
  };

  const seleccionarRespuesta = (ejercicio, letra) => {
    setRespuestas(r => ({ ...r, [ejercicio]: letra }));
  };

  const calcularPuntaje = (curso) => {
    if (tipoPrueba === "simulacro") {
      switch (curso) {
        case "RM":
        case "RV": return 0.63;
        case "Aritmética":
        case "Álgebra":
        case "Geometría":
        case "Trigonometría": return 0.76;
        case "Física": return 0.81;
        case "Química": return 0.46;
        default: return 0.5;
      }
    } else {
      switch (curso) {
        case "RM": return 1.8;
        case "Aritmética":
        case "Álgebra":
        case "Geometría":
        case "Trigonometría": return 2.2;
        case "Física": return 2.4;
        case "Química": return 1.4;
        default: return 2.0;
      }
    }
  };

  const finalizar = () => {
    setTiempoActivo(false);
    let correctas = 0, incorrectas = 0, sinResp = 0, nota = 0;
    const detalles = {};

    preguntas.forEach(p => {
      const r = respuestas[p.ejercicio];
      if (!r) {
        sinResp++;
        detalles[p.ejercicio] = "Sin responder";
      } else if (r === p.respuesta_correcta) {
        correctas++;
        detalles[p.ejercicio] = "Correcta";
        nota += calcularPuntaje(p.curso);
      } else {
        incorrectas++;
        detalles[p.ejercicio] = `Incorrecta (Correcta: ${p.respuesta_correcta})`;
      }
    });

    nota = Math.min(nota, 20);
    setResultados({ correctas, incorrectas, sinResp, nota, tiempoUsado: tiempoInicial - tiempo, detalles });
    setPantalla("formulario");
  };

  const enviarResultado = async () => {
    if (!datosUsuario.nombre || !datosUsuario.correo) return alert("Datos incompletos");
    try {
      await axios.post("https://backend-mvp-a6w0.onrender.com/guardar-resultado", {
        nombre: datosUsuario.nombre,
        correo: datosUsuario.correo,
        resultado: resultados.nota,
        preguntas_correctas: resultados.correctas,
        preguntas_incorrectas: resultados.incorrectas,
        preguntas_sin_responder: resultados.sinResp,
        tiempo_usado: resultados.tiempoUsado
      });
      setPantalla("resultados");
    } catch (e) {
      alert("Error al guardar resultados");
    }
  };

  const formatoTiempo = (s) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  if (pantalla === "inicio") {
    return <div><h1>Pruebas</h1>
      <button onClick={() => iniciarPrueba("diagnostico")}>Diagnóstico (10)</button>
      <button onClick={() => iniciarPrueba("simulacro")}>Simulacro (30)</button></div>;
  }

  if (pantalla === "simulacro") {
    const p = preguntas[preguntaActual];
    return <div>
      <h2>{`Pregunta ${preguntaActual + 1}/${preguntas.length}`}</h2>
      <div dangerouslySetInnerHTML={{ __html: p.ejercicio }} />
      {p.alternativas.map(alt => (
        <label key={alt.letra}>
          <input type="radio" name="resp" checked={respuestas[p.ejercicio] === alt.letra}
            onChange={() => seleccionarRespuesta(p.ejercicio, alt.letra)} />
          {alt.letra}: <span dangerouslySetInnerHTML={{ __html: alt.texto }} />
        </label>
      ))}
      <div>
        <button onClick={() => setPreguntaActual(p => p - 1)} disabled={preguntaActual === 0}>Anterior</button>
        {preguntaActual < preguntas.length - 1 ?
          <button onClick={() => setPreguntaActual(p => p + 1)}>Siguiente</button>
          : <button onClick={finalizar}>Finalizar</button>}
      </div>
      <p>Tiempo: {formatoTiempo(tiempo)}</p>
    </div>;
  }

  if (pantalla === "formulario") {
    return <div>
      <h2>Ingresa tus datos</h2>
      <input placeholder="Nombre" value={datosUsuario.nombre} onChange={e => setDatosUsuario({...datosUsuario, nombre: e.target.value})} />
      <input placeholder="Correo" value={datosUsuario.correo} onChange={e => setDatosUsuario({...datosUsuario, correo: e.target.value})} />
      <button onClick={enviarResultado}>Enviar</button>
    </div>;
  }

  if (pantalla === "resultados") {
    return <div>
      <h2>{tipoPrueba === "simulacro" ? "Resultados enviados" : "Tu resultado"}</h2>
      {tipoPrueba === "diagnostico" && resultados && (
        <p>Nota: {resultados.nota.toFixed(1)}</p>
      )}
      <button onClick={() => setPantalla("inicio")}>Volver al inicio</button>
    </div>;
  }

  return <p>Cargando...</p>;
}

export default App;
