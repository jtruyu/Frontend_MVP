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
      const datos = Array.isArray(response.data) ? response.data : [];
      const seleccionadas = modoSimulacroOficial ? datos.slice(0, 30) : datos.slice(0, 10);

      if (seleccionadas.length === 0) throw new Error("No se recibieron preguntas");

      setPreguntas(seleccionadas);
      setTiempo(modoSimulacroOficial ? 6480 : 2400);
      setTiempoInicial(modoSimulacroOficial ? 6480 : 2400);
      setRespuestas({});
      setPreguntaActual(0);
      setTiempoActivo(true);
      setPantalla("simulacro");
    } catch (err) {
      console.error("Error al cargar preguntas:", err);
      alert("No se pudieron cargar las preguntas. Intenta más tarde.");
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
        <div className="inicio-content" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '10px', flex: '1 1 45%' }}>
            <h2>Test Diagnóstico</h2>
            <p>Evaluación breve de 10 preguntas para conocer tu nivel base. Tiempo: 40 minutos.</p>
            <button className="boton-iniciar" onClick={() => iniciarPrueba(false)}>Iniciar Diagnóstico</button>
          </div>
          <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '10px', flex: '1 1 45%' }}>
            <h2>Simulacro Oficial</h2>
            <p>Simulación completa con 30 preguntas. Tiempo: 1 hora 48 minutos. Resultados entregados oficialmente.</p>
            <button className="boton-iniciar" onClick={() => iniciarPrueba(true)}>Iniciar Simulacro</button>
          </div>
        </div>
      </div>
    );
  }

  // ... el resto del flujo (registro, simulacro, resultados, gracias) permanece sin cambios
}

export default App;
