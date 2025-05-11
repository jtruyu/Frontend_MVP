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

  useEffect(() => {
    let intervalo;
    if (tiempoActivo && tiempo > 0) {
      intervalo = setInterval(() => setTiempo(prev => prev - 1), 1000);
    } else if (tiempo === 0 && tiempoActivo) {
      finalizarSimulacro();
    }
    return () => clearInterval(intervalo);
  }, [tiempo, tiempoActivo]);

  useEffect(() => {
    if (window.MathJax && preguntas.length > 0) window.MathJax.typesetPromise();
  }, [preguntaActual, preguntas]);

  const handleInputChange = (e) => setDatosUsuario({ ...datosUsuario, [e.target.name]: e.target.value });
  const validarFormulario = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datosUsuario.correo) && datosUsuario.nombre.trim();

  const iniciarPrueba = (oficial = false) => {
    setModoSimulacroOficial(oficial);
    setPantalla("formulario_inicio");
  };

  const comenzarSimulacro = async () => {
    try {
      const endpoint = modoSimulacroOficial ? "simulacro-oficial" : "simulacro";
      const response = await axios.get(`https://backend-mvp-a6w0.onrender.com/${endpoint}`);
      const datos = modoSimulacroOficial ? response.data.slice(0, 30) : response.data.slice(0, 10);

      setPreguntas(datos);
      setTiempo(oficial => oficial ? 6480 : 2400);
      setTiempoInicial(oficial => oficial ? 6480 : 2400);
      setRespuestas({});
      setPreguntaActual(0);
      setTiempoActivo(true);
      setPantalla("simulacro");
    } catch (err) {
      alert("No se pudieron cargar las preguntas");
    }
  };

  const seleccionarRespuesta = (ejercicio, letra) => setRespuestas({ ...respuestas, [ejercicio]: letra });
  const siguientePregunta = () => setPreguntaActual(prev => prev + 1);
  const anteriorPregunta = () => setPreguntaActual(prev => prev - 1);

  const calcularPuntaje = (curso) => ({ RM: 0.63, RV: 0.63, Aritmética: 0.76, Álgebra: 0.76, Geometría: 0.76, Trigonometría: 0.76, Física: 0.81, Química: 0.46 }[curso] || 0);

  const finalizarSimulacro = () => {
    setTiempoActivo(false);
    let correctas = 0, incorrectas = 0, sinResponder = 0, nota = 0;
    const claves = {};

    preguntas.forEach(p => {
      const marcada = respuestas[p.ejercicio];
      claves[p.ejercicio] = marcada || null;
      if (!marcada) sinResponder++;
      else if (marcada === p.respuesta_correcta) { correctas++; nota += calcularPuntaje(p.curso); }
      else incorrectas++;
    });

    const resultado = {
      nota, correctas, incorrectas, sinResponder,
      tiempoUsado: tiempoInicial - tiempo, claves
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

  const formatoTiempo = (seg) => `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;

  if (pantalla === "seleccion") {
    return (
      <div className="container inicio-container">
        <h1>EDBOT<br /><small>Preparación preuniversitaria impulsada por IA</small></h1>
        <div className="inicio-content" style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            <h2>Prueba Diagnóstica</h2>
            <p>Contiene 10 preguntas para evaluar tu nivel general. Tienes 40 minutos para completarla.</p>
            <button className="boton-iniciar" onClick={() => iniciarPrueba(false)}>Iniciar Diagnóstico</button>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
            <h2>Simulacro Oficial</h2>
            <p>Simulacro con 30 preguntas en 1h 48min. Los resultados se entregarán oficialmente.</p>
            <button className="boton-iniciar" onClick={() => iniciarPrueba(true)}>Iniciar Simulacro</button>
          </div>
        </div>
      </div>
    );
  }

  // ... las demás pantallas permanecen igual
}

export default App;
