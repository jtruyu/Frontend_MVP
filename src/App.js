import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  // Estados para la Prueba Diagnóstica
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [resultados, setResultados] = useState({});
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [tiempo, setTiempo] = useState(40 * 60); // 40 minutos en segundos
  const [tiempoInicial] = useState(40 * 60); // Guardar el tiempo inicial para calcular tiempo usado
  const [tiempoActivo, setTiempoActivo] = useState(false);
  const [datosUsuario, setDatosUsuario] = useState({
    nombre: "",
    correo: ""
  });
  const [comentarioResultado, setComentarioResultado] = useState("");
  const [resultadosTemporales, setResultadosTemporales] = useState(null);

  // Estados para el Banco de Preguntas
  const [temasBanco, setTemasBanco] = useState([]); // Almacena los temas disponibles del backend
  const [temasSeleccionados, setTemasSeleccionados] = useState([]); // Almacena los temas seleccionados por el usuario
  const [preguntasBanco, setPreguntasBanco] = useState([]); // Preguntas actuales del banco para la ronda
  const [preguntaActualBanco, setPreguntaActualBanco] = useState(0);
  const [respuestasBanco, setRespuestasBanco] = useState({}); // Respuestas del usuario en el banco
  const [feedbackBanco, setFeedbackBanco] = useState({}); // Retroalimentación para la pregunta actual del banco
  const [preguntasBancoOriginales, setPreguntasBancoOriginales] = useState([]); // Todas las preguntas obtenidas para los temas

  // Estado global para controlar la pantalla actual
  const [pantalla, setPantalla] = useState("mainInicio"); // "mainInicio", "diagnostico", "formulario", "resultados", "bancoPreguntasTemas", "bancoPreguntasSimulacro"
  const [cargando, setCargando] = useState(false); // Estado de carga global

  // Efecto para el temporizador de la Prueba Diagnóstica
  useEffect(() => {
    let intervalo;
    if (tiempoActivo && tiempo > 0 && pantalla === "diagnostico") {
      intervalo = setInterval(() => {
        setTiempo((tiempoAnterior) => tiempoAnterior - 1);
      }, 1000);
    } else if (tiempo === 0 && pantalla === "diagnostico") {
      finalizarDiagnostico();
    }
    return () => clearInterval(intervalo);
  }, [tiempoActivo, tiempo, pantalla]);

  // Efecto para renderizar MathJax en la Prueba Diagnóstica
  useEffect(() => {
    if (window.MathJax && preguntas.length > 0 && pantalla === "diagnostico") {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado en diagnóstico"))
        .catch((err) => console.error("MathJax error en diagnóstico:", err));
    }
  }, [preguntaActual, preguntas, pantalla]);

  // Efecto para renderizar MathJax en el Banco de Preguntas
  useEffect(() => {
    if (window.MathJax && preguntasBanco.length > 0 && pantalla === "bancoPreguntasSimulacro") {
      window.MathJax.typesetPromise()
        .then(() => {
          console.log("MathJax renderizado en banco de preguntas");
          // Resetear explícitamente el feedback para la pregunta actual cuando se carga
          const currentQuestion = preguntasBanco[preguntaActualBanco];
          if (currentQuestion && feedbackBanco[currentQuestion.ejercicio] !== null) {
            setFeedbackBanco(prevFeedback => ({
              ...prevFeedback,
              [currentQuestion.ejercicio]: null
            }));
            console.log(`Feedback para ${currentQuestion.ejercicio} reseteado en carga.`);
          }
        })
        .catch((err) => console.error("MathJax error en banco de preguntas:", err));
    }
  }, [preguntaActualBanco, preguntasBanco, pantalla]); // Dependencias son correctas

  // Efecto para renderizar MathJax en la pantalla de resultados del Diagnóstico
  useEffect(() => {
    if (pantalla === "resultados" && window.MathJax) {
      window.MathJax.typesetPromise()
        .then(() => console.log("MathJax renderizado en resultados"))
        .catch((err) => console.error("MathJax error en resultados:", err));
    }
  }, [pantalla]);

  // Función para manejar cambios en el formulario de datos del Diagnóstico
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosUsuario({
      ...datosUsuario,
      [name]: value
    });
  };

  // Función para validar el formulario del Diagnóstico
  const validarFormulario = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return datosUsuario.nombre.trim() !== "" && emailRegex.test(datosUsuario.correo);
  };

  // Función para definir el orden de los cursos en el Diagnóstico
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
    return ordenCursos[curso] || 999; // Si no encuentra el curso, lo coloca al final
  };

  // --- FUNCIONES PARA LA PRUEBA DIAGNÓSTICA ---
  const iniciarDiagnostico = async () => {
    setCargando(true);
    setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(40 * 60); // Reiniciar el tiempo a 40 minutos
    setTiempoActivo(true);
    setPantalla("diagnostico"); // Cambiar a la pantalla de diagnóstico
    try {
      const response = await axios.get("https://backend-mvp-a6w0.onrender.com/diagnostico");
      if (response.data && response.data.length > 0) {
        // Las preguntas ya vienen ordenadas y aleatorias del backend
        setPreguntas(response.data);
      } else {
        alert("No se pudieron cargar suficientes preguntas para el diagnóstico. Intenta nuevamente.");
        setPantalla("mainInicio"); // Volver a la pantalla principal
      }
    } catch (error) {
      console.error("Error al obtener preguntas de diagnóstico:", error);
      alert("Error al cargar las preguntas del diagnóstico. Por favor, intenta de nuevo.");
      setPantalla("mainInicio"); // Volver a la pantalla principal
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

  // Función para calcular puntaje según el curso en el Diagnóstico
  const calcularPuntajePorCurso = (curso) => {
    switch (curso) {
      case "RM":
        return 1.8;
      case "Aritmética":
      case "Álgebra":
      case "Geometría":
      case "Trigonometría":
        return 2.2;
      case "Física":
        return 2.4;
      case "Química":
        return 1.4;
      default:
        return 2.0; // Valor por defecto en caso de curso no especificado
    }
  };

  // Función para obtener comentario según nota vigesimal en el Diagnóstico
  const obtenerComentario = (notaVigesimal) => {
    if (notaVigesimal < 10) {
      return "Es necesario fortalecer tu base para el examen de admisión a la UNI. Te animamos a practicar con dedicación y a revisar los conceptos fundamentales.";
    } else if (notaVigesimal < 14) {
      return "Tienes potencial para lograr el ingreso a la UNI, pero se requiere mayor consistencia. Identifica tus áreas de oportunidad y trabaja intensamente en ellas.";
    } else if (notaVigesimal < 18) {
      return "¡Vas por buen camino! Estás demostrando un buen nivel de preparación. Continúa practicando para afianzar tus conocimientos y aumentar tus posibilidades de éxito.";
    } else {
      return "¡Excelente desempeño! Tu preparación te posiciona para competir por los primeros puestos. ¡Sigue así y alcanzarás tus metas!";
    }
  };

  const finalizarDiagnostico = () => {
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
      tiempoUsado: tiempoUsado
    });

    setComentarioResultado(obtenerComentario(notaTotal));
    setPantalla("formulario"); // Ir a la pantalla del formulario
  };

  const procesarFormulario = async () => {
    if (!validarFormulario()) {
      alert("Por favor, completa correctamente todos los campos del formulario");
      return;
    }

    setResultados(resultadosTemporales);
    try {
      await axios.post("https://backend-mvp-a6w0.onrender.com/guardar-diagnostico", {
        nombre: datosUsuario.nombre,
        correo: datosUsuario.correo,
        resultado: resultadosTemporales.notaVigesimal,
        preguntas_correctas: resultadosTemporales.correctas,
        preguntas_incorrectas: resultadosTemporales.incorrectas,
        preguntas_sin_responder: resultadosTemporales.sinResponder,
        tiempo_usado: resultadosTemporales.tiempoUsado
      });
      console.log("Resultado guardado con éxito");
    } catch (error) {
      console.error("Error al guardar el resultado:", error);
    }
    setPantalla("resultados"); // Ir a la pantalla de resultados
  };

  const formatoTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  // --- FUNCIONES PARA EL BANCO DE PREGUNTAS ---

  // Función para iniciar el flujo del Banco de Preguntas (obtener temas)
  const iniciarBancoPreguntasFlow = async () => {
    setCargando(true);
    setPantalla("bancoPreguntasTemas"); // Ir a la pantalla de selección de temas
    setTemasSeleccionados([]); // Resetear temas seleccionados
    setPreguntasBanco([]); // Resetear preguntas del banco
    setPreguntaActualBanco(0); // Resetear pregunta actual del banco
    setRespuestasBanco({}); // Resetear respuestas del banco
    setFeedbackBanco({}); // Resetear feedback del banco
    setPreguntasBancoOriginales([]); // Resetear preguntas originales

    try {
      const response = await axios.get("https://backend-mvp-a6w0.onrender.com/banco-preguntas/fisica/temas");
      if (response.data && response.data.length > 0) {
        setTemasBanco(response.data); // Almacenar los temas disponibles
      } else {
        alert("No se pudieron cargar los temas para el banco de preguntas.");
        volverInicio();
      }
    } catch (error) {
      console.error("Error al obtener temas del banco:", error);
      alert("Error al cargar los temas. Por favor, intenta de nuevo.");
      volverInicio();
    } finally {
      setCargando(false);
    }
  };

  // Función para manejar la selección/deselección de temas
  const handleTemaSeleccionado = (tema) => {
    setTemasSeleccionados(prev =>
      prev.includes(tema) ? prev.filter(t => t !== tema) : [...prev, tema]
    );
  };

  // Función para mezclar un array (Algoritmo Fisher-Yates)
  const mezclarArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  // Función para obtener las preguntas del banco basadas en los temas seleccionados
  const obtenerPreguntasBanco = async () => {
    if (temasSeleccionados.length === 0) {
      alert("Por favor, selecciona al menos un tema.");
      return;
    }
    setCargando(true);
    setPreguntasBanco([]);
    setRespuestasBanco({});
    setFeedbackBanco({});
    setPreguntaActualBanco(0);

    try {
      const response = await axios.get("https://backend-mvp-a6w0.onrender.com/banco-preguntas", {
        params: {
          temas: temasSeleccionados.join(',') // Enviar temas como string separado por comas
        }
      });
      if (response.data && response.data.length > 0) {
        setPreguntasBancoOriginales(response.data); // Guardar todas las preguntas originales
        const preguntasMezcladas = mezclarArray([...response.data]); // Mezclar para la primera ronda
        setPreguntasBanco(preguntasMezcladas);
        setPantalla("bancoPreguntasSimulacro"); // Ir a la pantalla de simulacro del banco
      } else {
        alert("No se encontraron preguntas para los temas seleccionados. Intenta con otros temas.");
        // Permanecer en la pantalla de selección de temas
      }
    } catch (error) {
      console.error("Error al obtener preguntas del banco:", error);
      alert("Error al cargar las preguntas del banco. Por favor, intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  // Función para seleccionar respuesta en el Banco de Preguntas
  const seleccionarRespuestaBanco = (ejercicio, letra) => {
    setRespuestasBanco((prevRespuestas) => ({
      ...prevRespuestas,
      [ejercicio]: letra,
    }));
    // Al seleccionar una nueva respuesta, se limpia el feedback para esa pregunta
    setFeedbackBanco((prevFeedback) => ({
      ...prevFeedback,
      [ejercicio]: null
    }));
  };

  // Función para verificar la respuesta en el Banco de Preguntas
  const verificarRespuestaBanco = () => {
    const preguntaActualObj = preguntasBanco[preguntaActualBanco];
    const respuestaUsuario = respuestasBanco[preguntaActualObj.ejercicio];

    if (!respuestaUsuario) {
      alert("Por favor, selecciona una respuesta antes de verificar.");
      return;
    }

    if (respuestaUsuario === preguntaActualObj.respuesta_correcta) {
      setFeedbackBanco((prevFeedback) => ({
        ...prevFeedback,
        [preguntaActualObj.ejercicio]: "correcta"
      }));
    } else {
      setFeedbackBanco((prevFeedback) => ({
        ...prevFeedback,
        [preguntaActualObj.ejercicio]: "incorrecta"
      }));
    }
  };

  // Función para avanzar a la siguiente pregunta en el Banco de Preguntas
  const siguientePreguntaBanco = () => {
    const nextIndex = preguntaActualBanco + 1;
    if (nextIndex < preguntasBanco.length) {
      setPreguntaActualBanco(nextIndex);
      // El feedback para la nueva pregunta se limpiará en el useEffect de MathJax
    } else {
      // Si se terminaron las preguntas de la ronda actual, iniciar una nueva ronda
      alert("Has completado todos los ejercicios de esta selección. ¡Iniciando una nueva ronda!");
      setPreguntaActualBanco(0);
      setPreguntasBanco(mezclarArray([...preguntasBancoOriginales])); // Volver a mezclar las preguntas originales
      setRespuestasBanco({}); // Limpiar respuestas
      setFeedbackBanco({}); // Limpiar feedback
    }
  };

  // Función para retroceder a la pregunta anterior en el Banco de Preguntas
  const preguntaAnteriorBanco = () => {
    if (preguntaActualBanco > 0) {
      const prevIndex = preguntaActualBanco - 1;
      setPreguntaActualBanco(prevIndex);
      // El feedback para la nueva pregunta se limpiará en el useEffect de MathJax
    }
  };

  // --- FUNCIONES DE NAVEGACIÓN GENERAL ---
  const volverInicio = () => {
    setPantalla("mainInicio");
    // Resetear todos los estados relacionados con Diagnóstico
    setPreguntas([]);
    setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(40 * 60);
    setTiempoActivo(false);
    setDatosUsuario({ nombre: "", correo: "" });
    setComentarioResultado("");
    setResultadosTemporales(null);
    // Resetear todos los estados relacionados con Banco de Preguntas
    setTemasBanco([]);
    setTemasSeleccionados([]);
    setPreguntasBanco([]);
    setPreguntaActualBanco(0);
    setRespuestasBanco({});
    setFeedbackBanco({});
    setPreguntasBancoOriginales([]);
    setCargando(false);
  };

  const volverBancoInicio = () => {
    setPantalla("bancoPreguntasTemas");
    setPreguntasBanco([]);
    setPreguntaActualBanco(0);
    setRespuestasBanco({});
    setFeedbackBanco({});
    setPreguntasBancoOriginales([]);
  };

  // Renderizado condicional de pantallas
  if (cargando) {
    return (
      <div className="container cargando-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Pantalla Principal (mainInicio)
  if (pantalla === "mainInicio") {
    return (
      <div className="container main-inicio-container">
        <h1>EDBOT</h1>
        <p>Preparación preuniversitaria impulsada por IA.</p>

        <div className="opciones-container">
          <div className="opcion-card">
            <h2>Prueba de diagnóstico</h2>
            <p>Evalúa tu nivel de preparación con 10 ejercicios seleccionados de exámenes de admisión UNI. Dispones de 40 minutos.</p>
            <button className="boton-principal" onClick={iniciarDiagnostico}>
              Comenzar prueba
            </button>
          </div>

          <div className="opcion-card">
            <h2>Banco de preguntas</h2>
            <p>Practica con un amplio repertorio de ejercicios de física de evaluaciones pasadas de CEPREUNI. Elige los temas de tu interés.</p>
            <button className="boton-principal" onClick={iniciarBancoPreguntasFlow}>
              Explorar banco
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de simulacro (Prueba Diagnóstica)
  if (pantalla === "diagnostico" && preguntas.length > 0) {
    const pregunta = preguntas[preguntaActual];
    return (
      <div className="container simulacro-container">
        <button onClick={volverInicio} className="boton-nav" style={{ marginBottom: '20px' }}>
          ← Volver a Inicio
        </button>
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
                  <span className="texto-opcion" dangerouslySetInnerHTML={{ __html: `${alt.letra}) ${alt.texto}` }}></span> {/* Combinado y cambiado a ')' */}
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
            <button className="boton-finalizar" onClick={finalizarDiagnostico}>
              Finalizar diagnóstico
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

  // Pantalla de formulario (después del simulacro de Diagnóstico)
  if (pantalla === "formulario") {
    return (
      <div className="container formulario-container">
        <h1>¡Prueba diagnóstica completada!</h1>
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

  // Pantalla de resultados (Prueba Diagnóstica)
  if (pantalla === "resultados") {
    return (
      <div className="container resultados-container">
        <h1>Resultados de la prueba diagnóstica</h1>

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

        <button className="boton-reiniciar" onClick={volverInicio}>
          Volver al inicio
        </button>
      </div>
    );
  }

  // Pantalla de selección de temas (Banco de Preguntas)
  if (pantalla === "bancoPreguntasTemas") {
    return (
      <div className="container banco-preguntas-inicio-container">
        <button onClick={volverInicio} className="boton-nav" style={{ marginBottom: '20px' }}>
          ← Volver a Inicio
        </button>
        <h1>Selecciona los temas para practicar</h1>
        <p>Puedes elegir uno o varios temas. Los ejercicios se mostrarán de forma aleatoria.</p>

        <div className="temas-grid">
          {temasBanco.map((tema) => (
            <div
              key={tema}
              className={`tema-card ${temasSeleccionados.includes(tema) ? "selected" : ""}`}
              onClick={() => handleTemaSeleccionado(tema)}
            >
              <h3>{tema}</h3>
              {/* <p>Ejercicios de {tema}</p> <-- Se ha eliminado la descripción */}
            </div>
          ))}
        </div>

        <div className="controles-banco-preguntas">
          <button
            className="boton-principal"
            onClick={obtenerPreguntasBanco}
            disabled={temasSeleccionados.length === 0}
          >
            Empezar práctica
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de simulacro del Banco de Preguntas
  if (pantalla === "bancoPreguntasSimulacro" && preguntasBanco.length > 0) {
    const pregunta = preguntasBanco[preguntaActualBanco];
    const respuestaSeleccionada = respuestasBanco[pregunta.ejercicio];
    const feedback = feedbackBanco[pregunta.ejercicio];

    return (
      <div className="container banco-preguntas-simulacro-container">
        <button onClick={volverBancoInicio} className="boton-nav" style={{ marginBottom: '20px' }}>
          ← Volver a Temas
        </button>
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
                    name={`pregunta-banco-${pregunta.ejercicio}`}
                    value={alt.letra}
                    checked={respuestaSeleccionada === alt.letra}
                    onChange={() => seleccionarRespuestaBanco(pregunta.ejercicio, alt.letra)}
                    disabled={feedback !== null} // Deshabilitar si ya hay feedback
                  />
                  <span className="texto-opcion" dangerouslySetInnerHTML={{ __html: `${alt.letra}) ${alt.texto}` }}></span> {/* Combinado y cambiado a ')' */}
                </label>
              </li>
            ))}
          </ul>
          {feedback && (
            <div className={`feedback-container ${feedback === "correcta" ? "feedback-correcta" : "feedback-incorrecta"}`}>
              {feedback === "correcta" ? "¡Correcto!" : `Incorrecto. La respuesta correcta era: ${pregunta.respuesta_correcta}`}
            </div>
          )}
        </div>

        <div className="controles-navegacion">
          <button
            className="boton-nav"
            onClick={preguntaAnteriorBanco}
            disabled={preguntaActualBanco === 0}
          >
            Anterior
          </button>
          {!feedback ? (
            <button
              className="boton-finalizar" // Usar estilo similar a finalizar para resaltar
              onClick={verificarRespuestaBanco}
              disabled={!respuestaSeleccionada}
            >
              Verificar respuesta
            </button>
          ) : (
            <button
              className="boton-nav"
              onClick={siguientePreguntaBanco}
            >
              Siguiente pregunta
            </button>
          )}
        </div>
      </div>
    );
  }

  // Fallback para cualquier estado no manejado (debería mostrar el cargando)
  return (
    <div className="container cargando-container">
      <div className="spinner"></div>
      <p>Cargando...</p>
    </div>
  );
}

export default App;
