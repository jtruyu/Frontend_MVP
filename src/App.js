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
  const [tiempo, setTiempo] = useState(0);
  const [tiempoInicial, setTiempoInicial] = useState(0);
  const [tiempoActivo, setTiempoActivo] = useState(false);
  const [tipoPrueba, setTipoPrueba] = useState(""); // 'diagnostico' o 'simulacro'
  
  const [datosUsuario, setDatosUsuario] = useState({
    nombre: "",
    correo: ""
  });
  
  const [comentarioResultado, setComentarioResultado] = useState("");
  const [resultadosTemporales, setResultadosTemporales] = useState(null);

  useEffect(() => {
    let intervalo;
    if (tiempoActivo && tiempo > 0) {
      intervalo = setInterval(() => {
        setTiempo((tiempoAnterior) => tiempoAnterior - 1);
      }, 1000);
    } else if (tiempo === 0 && tiempoInicial > 0) {
      finalizarPrueba();
    }

    return () => clearInterval(intervalo);
  }, [tiempoActivo, tiempo]);

  useEffect(() => {
    if (window.MathJax && preguntas.length > 0) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado"))
        .catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntaActual, preguntas]);

  useEffect(() => {
    if (pantalla === "resultados" && window.MathJax) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado en resultados"))
        .catch((err) => console.error("MathJax error en resultados:", err));
    }
  }, [pantalla]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosUsuario({
      ...datosUsuario,
      [name]: value
    });
  };

  const validarFormulario = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return datosUsuario.nombre.trim() !== "" && emailRegex.test(datosUsuario.correo);
  };

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
    setTipoPrueba("diagnostico");
    setCargando(true);
    setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(40 * 60); // 40 minutos
    setTiempoInicial(40 * 60);
    setTiempoActivo(true);
    setPantalla("simulacro");
    
    try {
      const response = await axios.get("https://backend-mvp-a6w0.onrender.com/simulacro", {
        params: { 
          num_preguntas: 10
        }
      });
  
      if (response.data && response.data.length > 0) {
        const preguntasOrdenadas = [...response.data].sort((a, b) => {
          return obtenerOrdenCurso(a.curso) - obtenerOrdenCurso(b.curso);
        });
        
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

  const iniciarSimulacro = async () => {
    setTipoPrueba("simulacro");
    setCargando(true);
    setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(120 * 60); // 120 minutos (2 horas)
    setTiempoInicial(120 * 60);
    setTiempoActivo(true);
    setPantalla("simulacro");
    
    try {
      const response = await axios.get("https://backend-mvp-a6w0.onrender.com/primer-simulacro");
  
      if (response.data && response.data.length > 0) {
        const preguntasOrdenadas = [...response.data].sort((a, b) => {
          return obtenerOrdenCurso(a.curso) - obtenerOrdenCurso(b.curso);
        });
        
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

  const seleccionarRespuesta = (ejercicio, letra) => {
    setRespuestas((prevRespuestas) => ({
      ...prevRespuestas,
      [ejercicio]: letra,
    }));
  };

  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1);
    }
  };

  const preguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1);
    }
  };

  const calcularPuntajePorCurso = (curso) => {
    switch (curso) {
      case "RM":
      case "RV":
        return 0.63;
      case "Aritmética":
      case "Álgebra":
      case "Geometría":
      case "Trigonometría":
        return 0.76;
      case "Física":
        return 0.81;
      case "Química":
        return 0.46;
      default:
        return 0.7;
    }
  };

  const obtenerComentario = (notaVigesimal) => {
    if (tipoPrueba === "diagnostico") {
      if (notaVigesimal < 10) {
        return "Es necesario fortalecer tu base para el examen de admisión a la UNI. Te animamos a practicar con dedicación y a revisar los conceptos fundamentales.";
      } else if (notaVigesimal < 14) {
        return "Tienes potencial para lograr el ingreso a la UNI, pero se requiere mayor consistencia. Identifica tus áreas de oportunidad y trabaja intensamente en ellas.";
      } else if (notaVigesimal < 18) {
        return "¡Vas por buen camino! Estás demostrando un buen nivel de preparación. Continúa practicando para afianzar tus conocimientos y aumentar tus posibilidades de éxito.";
      } else {
        return "¡Excelente desempeño! Tu preparación te posiciona para competir por los primeros puestos. ¡Sigue así y alcanzarás tus metas!";
      }
    } else {
      // Comentario para simulacro
      return "Los resultados detallados de tu simulacro serán enviados a tu correo electrónico. Revisa tu bandeja de entrada en las próximas horas.";
    }
  };

  const finalizarPrueba = () => {
    setTiempoActivo(false);
    
    let nuevosResultados = {};
    let preguntasCorrectas = 0;
    let preguntasIncorrectas = 0;
    let preguntasSinResponder = 0;
    let notaTotal = 0;
    
    preguntas.forEach((pregunta) => {
      const respuestaUsuario = respuestas[pregunta.ejercicio];
      
      if (!respuestaUsuario) {
        nuevosResultados[pregunta.ejercicio] = "Sin responder";
        preguntasSinResponder++;
      } else if (respuestaUsuario === pregunta.respuesta_correcta) {
        nuevosResultados[pregunta.ejercicio] = "Correcta";
        preguntasCorrectas++;
        notaTotal += calcularPuntajePorCurso(pregunta.curso);
      } else {
        nuevosResultados[pregunta.ejercicio] = `Incorrecta (Respuesta: ${pregunta.respuesta_correcta})`;
        preguntasIncorrectas++;
      }
    });
    
    const porcentaje = (preguntasCorrectas / preguntas.length) * 100;
    notaTotal = Math.min(notaTotal, 20);
    const tiempoUsado = tiempoInicial - tiempo;
    
    setResultadosTemporales({
      detalles: nuevosResultados,
      correctas: preguntasCorrectas,
      incorrectas: preguntasIncorrectas,
      sinResponder: preguntasSinResponder,
      porcentaje: porcentaje,
      notaVigesimal: notaTotal,
      tiempoUsado: tiempoUsado,
      respuestas: respuestas
    });
    
    setComentarioResultado(obtenerComentario(notaTotal));
    setPantalla("formulario");
  };

  const procesarFormulario = async () => {
    if (!validarFormulario()) {
      alert("Por favor, completa correctamente todos los campos del formulario");
      return;
    }

    setResultados(resultadosTemporales);
    
    try {
      const endpoint = tipoPrueba === "diagnostico" 
        ? "https://backend-mvp-a6w0.onrender.com/guardar-resultado" 
        : "https://backend-mvp-a6w0.onrender.com/guardar-simulacro";
      
      await axios.post(endpoint, {
        nombre: datosUsuario.nombre,
        correo: datosUsuario.correo,
        resultado: resultadosTemporales.notaVigesimal,
        preguntas_correctas: resultadosTemporales.correctas,
        preguntas_incorrectas: resultadosTemporales.incorrectas,
        preguntas_sin_responder: resultadosTemporales.sinResponder,
        tiempo_usado: resultadosTemporales.tiempoUsado,
        respuestas: JSON.stringify(resultadosTemporales.respuestas)
      });
      console.log("Resultado guardado con éxito");
    } catch (error) {
      console.error("Error al guardar el resultado:", error);
    }
    
    setPantalla("resultados");
  };

  const formatoTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };
  
  if (pantalla === "inicio") {
    return (
      <div className="container inicio-container">
        <h1>EDBOT<br />Preparación preuniversitaria implementada con IA</h1>
        <div className="inicio-content">
          <h2>Prueba de diagnóstico</h2>
          <p>Esta prueba de diagnóstico contiene 10 ejercicios seleccionados de exámenes de admisión a la Universidad Nacional de Ingeniería (UNI), que te permitirán evaluar tu nivel de preparación.</p>
          <p>Dispondrás de 40 minutos para resolverlos.</p>
          <button className="boton-iniciar" onClick={iniciarDiagnostico}>
            Comenzar diagnóstico
          </button>
          
          <h2 style={{marginTop: '40px'}}>Simulacro completo</h2>
          <p>Este simulacro completo contiene 30 ejercicios similares a los del examen de admisión de la UNI, que te permitirán evaluar tu nivel de preparación en condiciones reales.</p>
          <p>Dispondrás de 2 horas para resolverlos (tiempo real del examen).</p>
          <button className="boton-iniciar" onClick={iniciarSimulacro}>
            Comenzar simulacro
          </button>
        </div>
      </div>
    );
  }
  
  if (pantalla === "formulario") {
    return (
      <div className="container formulario-container">
        <h1>{tipoPrueba === "diagnostico" ? "¡Prueba completada!" : "¡Simulacro completado!"}</h1>
        <div className="formulario-content">
          <p>Por favor, completa tus datos para {tipoPrueba === "diagnostico" ? "ver tus resultados" : "recibir tus resultados por correo"}:</p>
          
          <form className="formulario-registro">
            <div className="campo-formulario">
              <label htmlFor="nombre">Nombre completo:</label>
              <input 
                type="text" 
                id="nombre" 
                name="nombre" 
                value={datosUsuario.nombre}
                onChange={handleInputChange}
                placeholder="Ingresa tu nombre completo"
                required
              />
            </div>
            
            <div className="campo-formulario">
              <label htmlFor="correo">Correo electrónico:</label>
              <input 
                type="email" 
                id="correo" 
                name="correo" 
                value={datosUsuario.correo}
                onChange={handleInputChange}
                placeholder="Ingresa tu correo electrónico"
                required
              />
            </div>
            
            <div className="formulario-info">
              <p>Estos datos nos permitirán {tipoPrueba === "diagnostico" ? "mostrarte tus resultados y recomendaciones" : "enviarte los resultados detallados de tu simulacro"}.</p>
            </div>
            
            <button 
              type="button" 
              className="boton-ver-resultados" 
              onClick={procesarFormulario} 
              disabled={!validarFormulario()}
            >
              {tipoPrueba === "diagnostico" ? "Ver mis resultados" : "Enviar mis resultados"}
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  if (pantalla === "simulacro" && preguntas.length > 0) {
    const pregunta = preguntas[preguntaActual];
    
    return (
      <div className="container simulacro-container">
        <div className="encabezado-simulacro">
          <div className="progreso">
            <div className="texto-progreso">Pregunta: {preguntaActual + 1} de {preguntas.length}</div>
            <div className="barra-progreso">
              <div 
                className="progreso-completado" 
                style={{ width: `${((preguntaActual + 1) / preguntas.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="temporizador">⏱️ {formatoTiempo(tiempo)}</div>
        </div>
        
        <div className="pregunta-container" key={pregunta.ejercicio}>
          <h2 className="ejercicio-texto">
            <span dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></span>
          </h2>

          {pregunta.imagen && (
            <img src={pregunta.imagen} alt="Ejercicio" className="imagen-ejercicio" />
          )}

          <ul className="opciones-lista">
            {pregunta.alternativas.map((alt) => (
              <li key={alt.letra} className="opcion">
                <label>
                  <input
                    type="radio"
                    name={`pregunta-${pregunta.ejercicio}`}
                    value={alt.letra}
                    checked={respuestas[pregunta.ejercicio] === alt.letra}
                    onChange={() => seleccionarRespuesta(pregunta.ejercicio, alt.letra)}
                  />
                  <span className="texto-opcion">{alt.letra}: </span>
                  <span className="texto-opcion" dangerouslySetInnerHTML={{ __html: alt.texto }}></span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="controles-navegacion">
          <button 
            className="boton-nav" 
            onClick={preguntaAnterior} 
            disabled={preguntaActual === 0}
          >
            Anterior
          </button>
          
          {preguntaActual === preguntas.length - 1 ? (
            <button className="boton-finalizar" onClick={finalizarPrueba}>
              Finalizar {tipoPrueba === "diagnostico" ? "prueba" : "simulacro"}
            </button>
          ) : (
            <button 
              className="boton-nav" 
              onClick={siguientePregunta}
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    );
  }
  
  if (pantalla === "resultados") {
    return (
      <div className="container resultados-container">
        <h1>{tipoPrueba === "diagnostico" ? "Resultados del Diagnóstico" : "Simulacro Completado"}</h1>
        
        <div className="datos-usuario">
          <p><strong>Nombre:</strong> {datosUsuario.nombre}</p>
          <p><strong>Correo:</strong> {datosUsuario.correo}</p>
          <p><strong>Tiempo utilizado:</strong> {formatoTiempo(resultados.tiempoUsado)}</p>
        </div>
        
        {tipoPrueba === "diagnostico" && (
          <>
            <div className="resumen-resultados">
              <div className="estadistica correcta">
                <div className="valor">{resultados.correctas}</div>
                <div className="etiqueta">Correctas</div>
              </div>
              <div className="estadistica incorrecta">
                <div className="valor">{resultados.incorrectas}</div>
                <div className="etiqueta">Incorrectas</div>
              </div>
              <div className="estadistica">
                <div className="valor">{resultados.sinResponder}</div>
                <div className="etiqueta">Sin responder</div>
              </div>
              <div className="estadistica">
                <div className="valor">{resultados.notaVigesimal.toFixed(1)}</div>
                <div className="etiqueta">Nota (0-20)</div>
              </div>
            </div>
            
            <div className="comentario-resultado">
              <h2>Evaluación de tu desempeño</h2>
              <p>{comentarioResultado}</p>
            </div>
            
            <h2>Detalle de respuestas</h2>
            
            <div className="lista-detalles">
              {preguntas.map((pregunta, index) => (
                <div 
                  key={pregunta.ejercicio} 
                  className={`detalle-pregunta ${
                    !respuestas[pregunta.ejercicio] 
                      ? "sin-responder" 
                      : respuestas[pregunta.ejercicio] === pregunta.respuesta_correcta 
                        ? "correcta" 
                        : "incorrecta"
                  }`}
                >
                  <div className="numero-pregunta">{index + 1}</div>
                  <div className="contenido-detalle">
                    <div className="texto-ejercicio" dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></div>
                    <div className="respuesta-detalle">
                      {!respuestas[pregunta.ejercicio] ? (
                        <span className="estado-respuesta sin-responder">Sin responder</span>
                      ) : respuestas[pregunta.ejercicio] === pregunta.respuesta_correcta ? (
                        <span className="estado-respuesta correcta">
                          Correcta: {pregunta.respuesta_correcta} ({calcularPuntajePorCurso(pregunta.curso)} pts)
                        </span>
                      ) : (
                        <span className="estado-respuesta incorrecta">
                          Incorrecta: Elegiste {respuestas[pregunta.ejercicio]}, 
                          Correcta: {pregunta.respuesta_correcta}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {tipoPrueba === "simulacro" && (
          <div className="comentario-resultado">
            <h2>¡Simulacro completado con éxito!</h2>
            <p>{comentarioResultado}</p>
            <p>Hemos registrado tus respuestas y calculado tu puntaje. Los resultados detallados, incluyendo tu desempeño por áreas y recomendaciones personalizadas, serán enviados a tu correo electrónico en las próximas horas.</p>
          </div>
        )}
        
        <button className="boton-reiniciar" onClick={() => setPantalla("inicio")}>
          Volver al inicio
        </button>
      </div>
    );
  }
  
  return (
    <div className="container cargando-container">
      <div className="spinner"></div>
      <p>Cargando {tipoPrueba === "diagnostico" ? "prueba de diagnóstico" : "simulacro"}...</p>
    </div>
  );
}

export default App;
