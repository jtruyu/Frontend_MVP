
// El nuevo código completo de App.js es extenso, así que lo iré subiendo por bloques hasta completar todo
// Bloque 1: Imports y configuración inicial

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [pantalla, setPantalla] = useState("seleccion");
  const [modoSimulacroOficial, setModoSimulacroOficial] = useState(false);

  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [tiempo, setTiempo] = useState(0);
  const [tiempoActivo, setTiempoActivo] = useState(false);
  const [tiempoInicial, setTiempoInicial] = useState(0);
  const [resultadosTemporales, setResultadosTemporales] = useState(null);
  const [datosUsuario, setDatosUsuario] = useState({ nombre: "", correo: "" });

  const [comentarioResultado, setComentarioResultado] = useState("");

  // Temporizador
  useEffect(() => {
    let intervalo;
    if (tiempoActivo && tiempo > 0) {
      intervalo = setInterval(() => {
        setTiempo((prev) => prev - 1);
      }, 1000);
    } else if (tiempo === 0 && tiempoActivo) {
      finalizarSimulacro();
    }
    return () => clearInterval(intervalo);
  }, [tiempo, tiempoActivo]);

  useEffect(() => {
    if (window.MathJax && preguntas.length > 0) {
      window.MathJax.typesetPromise();
    }
  }, [preguntaActual, preguntas]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosUsuario({ ...datosUsuario, [name]: value });
  };

  const validarFormulario = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return datosUsuario.nombre.trim() !== "" && emailRegex.test(datosUsuario.correo);
  };

  const iniciarPrueba = async (oficial = false) => {
    setModoSimulacroOficial(oficial);
    setPantalla("formulario_inicio");
  };

  const comenzarSimulacro = async () => {
    try {
      const endpoint = modoSimulacroOficial ? "simulacro-oficial" : "simulacro";
      const response = await axios.get(`https://backend-mvp-a6w0.onrender.com/${endpoint}`);
      const datos = modoSimulacroOficial ? response.data.slice(0, 30) : response.data.slice(0, 10);

      setPreguntas(datos);
      setTiempo(modoSimulacroOficial ? 6480 : 2400);
      setTiempoInicial(modoSimulacroOficial ? 6480 : 2400);
      setRespuestas({});
      setPreguntaActual(0);
      setTiempoActivo(true);
      setPantalla("simulacro");
    } catch (err) {
      console.error("Error al cargar preguntas:", err);
      alert("No se pudieron cargar las preguntas");
    }
  };

  const seleccionarRespuesta = (ejercicio, letra) => {
    setRespuestas({ ...respuestas, [ejercicio]: letra });
  };

  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1);
    }
  };

  const anteriorPregunta = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1);
    }
  };

  const calcularPuntaje = (curso) => {
    const puntajes = {
      "RM": 0.63,
      "RV": 0.63,
      "Aritmética": 0.76,
      "Álgebra": 0.76,
      "Geometría": 0.76,
      "Trigonometría": 0.76,
      "Física": 0.81,
      "Química": 0.46
    };
    return puntajes[curso] || 0;
  };

  const finalizarSimulacro = () => {
    setTiempoActivo(false);
    let correctas = 0;
    let incorrectas = 0;
    let sinResponder = 0;
    let nota = 0;
    const claves = {};

    preguntas.forEach(p => {
      const marcada = respuestas[p.ejercicio];
      claves[p.ejercicio] = marcada || null;
      if (!marcada) {
        sinResponder++;
      } else if (marcada === p.respuesta_correcta) {
        correctas++;
        nota += calcularPuntaje(p.curso);
      } else {
        incorrectas++;
      }
    });

    const resultado = {
      nota,
      correctas,
      incorrectas,
      sinResponder,
      tiempoUsado: tiempoInicial - tiempo,
      claves
    };

    setResultadosTemporales(resultado);
    setPantalla(modoSimulacroOficial ? "gracias" : "resultados");

    axios.post("https://backend-mvp-a6w0.onrender.com/guardar-resultado", {
      nombre: datosUsuario.nombre,
      correo: datosUsuario.correo,
      resultado: nota,
      preguntas_correctas: correctas,
      preguntas_incorrectas: incorrectas,
      preguntas_sin_responder: sinResponder,
      tiempo_usado: resultado.tiempoUsado,
      tipo: modoSimulacroOficial ? "simulacro" : "diagnostico",
      respuestas_usuario: claves
    });
  };

  const formatoTiempo = (seg) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (pantalla === "seleccion") {
    return (
      <div className="container inicio-container">
        <h1>Bienvenido</h1>
        <div className="inicio-content">
          <p>Selecciona una opción:</p>
          <button className="boton-iniciar" onClick={() => iniciarPrueba(false)}>Prueba Diagnóstica</button>
          <button className="boton-iniciar" onClick={() => iniciarPrueba(true)}>Simulacro Oficial</button>
        </div>
      </div>
    );
  }

  if (pantalla === "formulario_inicio") {
    return (
      <div className="container formulario-container">
        <h1>Registro</h1>
        <div className="formulario-content">
          <p>Por favor completa tus datos para comenzar:</p>
          <input type="text" name="nombre" placeholder="Nombre completo" value={datosUsuario.nombre} onChange={handleInputChange} />
          <input type="email" name="correo" placeholder="Correo" value={datosUsuario.correo} onChange={handleInputChange} />
          <button className="boton-iniciar" onClick={comenzarSimulacro} disabled={!validarFormulario()}>Comenzar</button>
        </div>
      </div>
    );
  }

  if (pantalla === "simulacro" && preguntas.length > 0) {
    const p = preguntas[preguntaActual];
    return (
      <div className="container simulacro-container">
        <div className="encabezado-simulacro">
          <div className="progreso">
            <div className="texto-progreso">Pregunta: {preguntaActual + 1} / {preguntas.length}</div>
            <div className="barra-progreso">
              <div className="progreso-completado" style={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%` }}></div>
            </div>
          </div>
          <div className="temporizador">⏱️ {formatoTiempo(tiempo)}</div>
        </div>

        <div className="pregunta-container">
          <div className="ejercicio-texto" dangerouslySetInnerHTML={{ __html: p.ejercicio }}></div>
          {p.imagen && <img src={p.imagen} alt="ejercicio" className="imagen-ejercicio" />}
          <ul className="opciones-lista">
            {p.alternativas.map(alt => (
              <li key={alt.letra} className="opcion">
                <label>
                  <input type="radio" name={`pregunta-${preguntaActual}`} value={alt.letra} checked={respuestas[p.ejercicio] === alt.letra} onChange={() => seleccionarRespuesta(p.ejercicio, alt.letra)} />
                  <span className="letra-opcion">{alt.letra}</span>
                  <span className="texto-opcion" dangerouslySetInnerHTML={{ __html: alt.texto }}></span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="controles-navegacion">
          <button className="boton-nav" onClick={anteriorPregunta} disabled={preguntaActual === 0}>Anterior</button>
          {preguntaActual === preguntas.length - 1 ? (
            <button className="boton-finalizar" onClick={finalizarSimulacro}>Finalizar</button>
          ) : (
            <button className="boton-nav" onClick={siguientePregunta}>Siguiente</button>
          )}
        </div>
      </div>
    );
  }

  if (pantalla === "gracias") {
    return (
      <div className="container formulario-container">
        <h1>¡Gracias por completar el simulacro!</h1>
        <p>Tu evaluación ha sido enviada. Pronto recibirás los resultados oficiales.</p>
      </div>
    );
  }

  if (pantalla === "resultados" && resultadosTemporales) {
    return (
      <div className="container resultados-container">
        <h1>Resultados</h1>
        <p><strong>Nombre:</strong> {datosUsuario.nombre}</p>
        <p><strong>Correo:</strong> {datosUsuario.correo}</p>
        <p><strong>Nota:</strong> {resultadosTemporales.nota.toFixed(2)}</p>
        <p><strong>Correctas:</strong> {resultadosTemporales.correctas}</p>
        <p><strong>Incorrectas:</strong> {resultadosTemporales.incorrectas}</p>
        <p><strong>Sin responder:</strong> {resultadosTemporales.sinResponder}</p>
        <p><strong>Tiempo usado:</strong> {formatoTiempo(resultadosTemporales.tiempoUsado)}</p>
      </div>
    );
  }

  return <div className="container cargando-container"><div className="spinner"></div><p>Cargando...</p></div>;
}

export default App;
