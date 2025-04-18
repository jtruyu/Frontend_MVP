import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [cargando, setCargando] = useState(false);
  // Cambiamos el flujo de pantallas: inicio -> simulacro -> formulario -> resultados
  const [pantalla, setPantalla] = useState("inicio");
  const [tiempo, setTiempo] = useState(40 * 60); // 40 minutos en segundos
  const [tiempoInicial] = useState(40 * 60); // Guardar el tiempo inicial para calcular tiempo usado
  const [tiempoActivo, setTiempoActivo] = useState(false);
  
  // Estado para los datos del usuario (ahora se llenarán al final)
  const [datosUsuario, setDatosUsuario] = useState({
    nombre: "",
    correo: ""
  });
  
  // Estado para mensaje de comentario según resultado
  const [comentarioResultado, setComentarioResultado] = useState("");
  // Estado para almacenar resultados temporales antes de pedir datos del usuario
  const [resultadosTemporales, setResultadosTemporales] = useState(null);

  // Controlar el temporizador
  useEffect(() => {
    let intervalo;
    if (tiempoActivo && tiempo > 0) {
      intervalo = setInterval(() => {
        setTiempo((tiempoAnterior) => tiempoAnterior - 1);
      }, 1000);
    } else if (tiempo === 0) {
      finalizarSimulacro();
    }

    return () => clearInterval(intervalo);
  }, [tiempoActivo, tiempo]);

  // Renderizar MathJax cuando cambie la pregunta actual
  useEffect(() => {
    if (window.MathJax && preguntas.length > 0) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado"))
        .catch((err) => console.error("MathJax error:", err));
    }
  }, [preguntaActual, preguntas]);

  // Renderizar MathJax en la pantalla de resultados
  useEffect(() => {
    if (pantalla === "resultados" && window.MathJax) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado en resultados"))
        .catch((err) => console.error("MathJax error en resultados:", err));
    }
  }, [pantalla]);

  // Función para manejar cambios en el formulario de datos
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosUsuario({
      ...datosUsuario,
      [name]: value
    });
  };

  // Función para validar el formulario
  const validarFormulario = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return datosUsuario.nombre.trim() !== "" && emailRegex.test(datosUsuario.correo);
  };

  // Función para iniciar el simulacro directamente desde la pantalla de inicio
  const iniciarSimulacro = async () => {
    setCargando(true);
    setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(40 * 60); // Reiniciar el tiempo a 40 minutos
    setTiempoActivo(true);
    setPantalla("simulacro");
    
    try {
      const response = await axios.get("https://mi-proyecto-fastapi.onrender.com/simulacro", {
        params: { 
          num_preguntas: 10 // Solicitamos 10 preguntas
        }
      });

      if (response.data && response.data.length > 0) {
        setPreguntas(response.data);
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

  // Función para obtener comentario según porcentaje
  const obtenerComentario = (porcentaje) => {
    if (porcentaje < 40) {
      return "Aún te falta adquirir el nivel necesario para rendir un examen de admisión a la UNI. Continúa practicando y refuerza los conceptos básicos.";
    } else if (porcentaje < 50) {
      return "Tienes opciones, pero muy bajas, de ingresar a la UNI. Enfócate en mejorar tus áreas más débiles y practica con más intensidad.";
    } else if (porcentaje < 60) {
      return "Tienes opciones de ingreso, pero sin asegurar. Continúa trabajando en las áreas donde tuviste dificultades para aumentar tus probabilidades.";
    } else if (porcentaje < 70) {
      return "¡Tienes buenas opciones de ingreso! Estás en el camino correcto, sigue practicando para consolidar tus conocimientos.";
    } else if (porcentaje < 80) {
      return "¡Tu ingreso es prácticamente seguro! Mantén el ritmo de estudio y prepárate para destacar en la universidad.";
    } else if (porcentaje < 90) {
      return "¡Excelente! Estás luchando para ser de los primeros puestos de tu carrera. Continúa con esta dedicación.";
    } else {
      return "¡Impresionante! Con este nivel estás preparado para estar en el cómputo general y entre los mejores ingresantes. ¡Felicitaciones!";
    }
  };

  const finalizarSimulacro = () => {
    setTiempoActivo(false);
    
    // Calcular resultados
    let nuevosResultados = {};
    let preguntasCorrectas = 0;
    let preguntasIncorrectas = 0;
    let preguntasSinResponder = 0;
    
    preguntas.forEach((pregunta) => {
      const respuestaUsuario = respuestas[pregunta.ejercicio];
      
      if (!respuestaUsuario) {
        nuevosResultados[pregunta.ejercicio] = "Sin responder";
        preguntasSinResponder++;
      } else if (respuestaUsuario === pregunta.respuesta_correcta) {
        nuevosResultados[pregunta.ejercicio] = "Correcta";
        preguntasCorrectas++;
      } else {
        nuevosResultados[pregunta.ejercicio] = `Incorrecta (Respuesta: ${pregunta.respuesta_correcta})`;
        preguntasIncorrectas++;
      }
    });
    
    const porcentaje = (preguntasCorrectas / preguntas.length) * 100;
    const tiempoUsado = tiempoInicial - tiempo; // Tiempo usado en segundos
    
    // Guardar resultados temporalmente
    setResultadosTemporales({
      detalles: nuevosResultados,
      correctas: preguntasCorrectas,
      incorrectas: preguntasIncorrectas,
      sinResponder: preguntasSinResponder,
      porcentaje: porcentaje,
      tiempoUsado: tiempoUsado
    });
    
    // Establecer el comentario según el porcentaje
    setComentarioResultado(obtenerComentario(porcentaje));
    
    // Mostrar pantalla de formulario para recoger datos del usuario
    setPantalla("formulario");
  };

  // Nueva función para procesar el formulario y mostrar resultados
  const procesarFormulario = async () => {
    if (!validarFormulario()) {
      alert("Por favor, completa correctamente todos los campos del formulario");
      return;
    }

    // Establecer los resultados finales
    setResultados(resultadosTemporales);
    
    // Guardar los resultados en la base de datos
    try {
      await axios.post("https://mi-proyecto-fastapi.onrender.com/guardar-resultado", {
        nombre: datosUsuario.nombre,
        correo: datosUsuario.correo,
        resultado: resultadosTemporales.porcentaje,
        preguntas_correctas: resultadosTemporales.correctas,
        preguntas_incorrectas: resultadosTemporales.incorrectas,
        preguntas_sin_responder: resultadosTemporales.sinResponder,
        tiempo_usado: resultadosTemporales.tiempoUsado
      });
      console.log("Resultado guardado con éxito");
    } catch (error) {
      console.error("Error al guardar el resultado:", error);
    }
    
    // Mostrar pantalla de resultados
    setPantalla("resultados");
  };

  const formatoTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };
  
  // Pantalla de inicio
  if (pantalla === "inicio") {
    return (
      <div className="container inicio-container">
        <h1>EDBOT: Simulador de Examen</h1>
        <div className="inicio-content">
          <p>Este simulacro contiene 10 ejercicios seleccionados de Física que te permitirán evaluar tu nivel de preparación.</p>
          <p>Dispondrás de 40 minutos para resolverlos.</p>
          <p>¡Mucho éxito!</p>
          <button className="boton-iniciar" onClick={iniciarSimulacro}>
            Comenzar
          </button>
        </div>
      </div>
    );
  }
  
  // Nueva pantalla de formulario (después del simulacro)
  if (pantalla === "formulario") {
    return (
      <div className="container formulario-container">
        <h1>¡Simulacro completado!</h1>
        <div className="formulario-content">
          <p>Por favor, completa tus datos para ver tus resultados:</p>
          
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
              <p>Estos datos nos permitirán enviarte información sobre tus resultados y
                recomendaciones personalizadas para mejorar tu desempeño.</p>
            </div>
            
            <button 
              type="button" 
              className="boton-ver-resultados" 
              onClick={procesarFormulario} 
              disabled={!validarFormulario()}
            >
              Ver mis resultados
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  // Pantalla de simulacro
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
            <button className="boton-finalizar" onClick={finalizarSimulacro}>
              Finalizar simulacro
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
  
  // Pantalla de resultados
  if (pantalla === "resultados") {
    return (
      <div className="container resultados-container">
        <h1>Resultados del Simulacro</h1>
        
        <div className="datos-usuario">
          <p><strong>Nombre:</strong> {datosUsuario.nombre}</p>
          <p><strong>Correo:</strong> {datosUsuario.correo}</p>
          <p><strong>Tiempo utilizado:</strong> {formatoTiempo(resultados.tiempoUsado)}</p>
        </div>
        
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
            <div className="valor">{resultados.porcentaje.toFixed(1)}%</div>
            <div className="etiqueta">Puntuación</div>
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
                      Correcta: {pregunta.respuesta_correcta}
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
        
        <button className="boton-reiniciar" onClick={() => setPantalla("inicio")}>
          Volver al inicio
        </button>
      </div>
    );
  }
  
  // Pantalla de carga
  return (
    <div className="container cargando-container">
      <div className="spinner"></div>
      <p>Cargando simulacro...</p>
    </div>
  );
}

export default App;
