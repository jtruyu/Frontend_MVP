// App.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [pantalla, setPantalla] = useState("inicio");
  const [modo, setModo] = useState(""); // "diagnostico" o "simulacro"
  const [preguntas, setPreguntas] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [tiempo, setTiempo] = useState(0);
  const [tiempoActivo, setTiempoActivo] = useState(false);
  const [tiempoInicial, setTiempoInicial] = useState(0);
  const [datosUsuario, setDatosUsuario] = useState({ nombre: "", correo: "" });
  const [resultados, setResultados] = useState(null);

  useEffect(() => {
    let timer;
    if (tiempoActivo && tiempo > 0) {
      timer = setInterval(() => setTiempo((t) => t - 1), 1000);
    } else if (tiempo === 0 && pantalla === "ejercicios") {
      finalizar();
    }
    return () => clearInterval(timer);
  }, [tiempoActivo, tiempo]);

  const formatoTiempo = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const iniciar = async (tipo) => {
    const endpoint = tipo === "simulacro" ? "/simulacro30/" : "/simulacro/";
    const duracion = tipo === "simulacro" ? 60 * 60 : 40 * 60;
    setModo(tipo);
    setPantalla("cargando");
    setTiempo(duracion);
    setTiempoInicial(duracion);
    try {
      const res = await axios.get(`https://backend-mvp-a6w0.onrender.com${endpoint}`);
      setPreguntas(res.data);
      setPantalla("ejercicios");
      setTiempoActivo(true);
    } catch (e) {
      alert("Error cargando preguntas");
      setPantalla("inicio");
    }
  };

  const seleccionarRespuesta = (ej, letra) => {
    setRespuestas({ ...respuestas, [ej]: letra });
  };

  const calcularPuntaje = (curso) => {
    const puntos = {
      RM: 0.63, RV: 0.63,
      "Aritmética": 0.76, Álgebra: 0.76, Geometría: 0.76, Trigonometría: 0.76,
      Física: 0.81, Química: 0.46,
    };
    return puntos[curso] || 0.5;
  };

  const finalizar = () => {
    setPantalla("formulario");
    setTiempoActivo(false);
  };

  const enviarResultados = async () => {
    const correctas = preguntas.filter(p => respuestas[p.ejercicio] === p.respuesta_correcta);
    const incorrectas = preguntas.filter(p => respuestas[p.ejercicio] && respuestas[p.ejercicio] !== p.respuesta_correcta);
    const sinResponder = preguntas.length - correctas.length - incorrectas.length;
    const nota = correctas.reduce((acc, p) => acc + calcularPuntaje(p.curso), 0);
    const payload = {
      nombre: datosUsuario.nombre,
      correo: datosUsuario.correo,
      resultado: nota,
      preguntas_correctas: correctas.length,
      preguntas_incorrectas: incorrectas.length,
      preguntas_sin_responder: sinResponder,
      tiempo_usado: tiempoInicial - tiempo
    };

    const endpoint = modo === "simulacro"
      ? "https://backend-mvp-a6w0.onrender.com/guardar-resultado"
      : "https://backend-mvp-a6w0.onrender.com/guardar-diagnostico";

    try {
      await axios.post(endpoint, payload);
      setResultados(payload);
      setPantalla("final");
    } catch {
      alert("Error guardando resultado");
    }
  };

  if (pantalla === "inicio") {
    return (
      <div className="container inicio-container">
        <h1>EDBOT<br/>Preparación preuniversitaria implementada con IA</h1>
        <div className="inicio-content">
          <p>Selecciona una prueba para comenzar:</p>
          <button className="boton-iniciar" onClick={() => iniciar("diagnostico")}>Prueba Diagnóstico</button>
          <button className="boton-iniciar" onClick={() => iniciar("simulacro")}>Simulacro</button>
        </div>
      </div>
    );
  }

  if (pantalla === "cargando") return <div className="cargando-container"><div className="spinner"></div><p>Cargando...</p></div>;

  if (pantalla === "ejercicios") {
    const actual = preguntas[preguntaActual];
    return (
      <div className="container simulacro-container">
        <div className="encabezado-simulacro">
          <div className="progreso">
            <div className="texto-progreso">Pregunta {preguntaActual + 1} de {preguntas.length}</div>
            <div className="barra-progreso"><div className="progreso-completado" style={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%` }}></div></div>
          </div>
          <div className="temporizador">⏱️ {formatoTiempo(tiempo)}</div>
        </div>

        <div className="pregunta-container">
          <h2 className="ejercicio-texto" dangerouslySetInnerHTML={{ __html: actual.ejercicio }}></h2>
          {actual.imagen && <img src={actual.imagen} alt="Ejercicio" className="imagen-ejercicio" />}
          <ul className="opciones-lista">
            {actual.alternativas.map((alt) => (
              <li key={alt.letra} className="opcion">
                <label>
                  <input
                    type="radio"
                    name={`pregunta-${actual.ejercicio}`}
                    value={alt.letra}
                    checked={respuestas[actual.ejercicio] === alt.letra}
                    onChange={() => seleccionarRespuesta(actual.ejercicio, alt.letra)}
                  />
                  <span className="texto-opcion">{alt.letra}: </span>
                  <span className="texto-opcion" dangerouslySetInnerHTML={{ __html: alt.texto }}></span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="controles-navegacion">
          <button className="boton-nav" onClick={() => setPreguntaActual(p => Math.max(0, p - 1))} disabled={preguntaActual === 0}>Anterior</button>
          {preguntaActual === preguntas.length - 1 ? (
            <button className="boton-finalizar" onClick={finalizar}>Finalizar</button>
          ) : (
            <button className="boton-nav" onClick={() => setPreguntaActual(p => p + 1)}>Siguiente</button>
          )}
        </div>
      </div>
    );
  }

  if (pantalla === "formulario") {
    return (
      <div className="container formulario-container">
        <h1>¡Prueba finalizada!</h1>
        <div className="formulario-content">
          <p>Por favor ingresa tus datos para recibir tus resultados:</p>
          <input type="text" placeholder="Nombre completo" value={datosUsuario.nombre} onChange={(e) => setDatosUsuario({ ...datosUsuario, nombre: e.target.value })} className="campo-formulario" />
          <input type="email" placeholder="Correo electrónico" value={datosUsuario.correo} onChange={(e) => setDatosUsuario({ ...datosUsuario, correo: e.target.value })} className="campo-formulario" />
          <button className="boton-ver-resultados" onClick={enviarResultados}>Ver mis resultados</button>
        </div>
      </div>
    );
  }

  if (pantalla === "final") {
    return (
      <div className="container resultados-container">
        <h1>¡Resultados enviados!</h1>
        <p>Gracias, {datosUsuario.nombre}. Tus resultados se han enviado a {datosUsuario.correo}.</p>
        <p>Correctas: {resultados.preguntas_correctas}, Incorrectas: {resultados.preguntas_incorrectas}, Sin responder: {resultados.preguntas_sin_responder}</p>
        <p>Nota final: {resultados.resultado.toFixed(2)} / 20</p>
        <p>Tiempo usado: {formatoTiempo(resultados.tiempo_usado)}</p>
        <button className="boton-reiniciar" onClick={() => window.location.reload()}>Volver al inicio</button>
      </div>
    );
  }

  return null;
}

export default App;
