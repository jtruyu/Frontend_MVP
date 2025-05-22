import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import axios from "axios";
import "./App.css";

function App() {
  const [preguntas, setPreguntas] = useState([]); // For diagnostic test
  const [respuestas, setRespuestas] = useState({}); // For diagnostic test
  const [resultados, setResultados] = useState({}); // For diagnostic test
 const [preguntaActual, setPreguntaActual] = useState(0); // For diagnostic test
  const [cargando, setCargando] = useState(false);
 const [pantalla, setPantalla] = useState("inicio"); // inicio, diagnostico, formulario, resultados, bancoPreguntas
 const [tiempo, setTiempo] = useState(40 * 60); 
  const [tiempoInicial] = useState(40 * 60);
 const [tiempoActivo, setTiempoActivo] = useState(false);
 const [datosUsuario, setDatosUsuario] = useState({
    nombre: "",
    correo: ""
  });
 const [comentarioResultado, setComentarioResultado] = useState("");
 const [resultadosTemporales, setResultadosTemporales] = useState(null);

  // --- NEW STATES FOR QUESTION BANK ---
  const [pantallaBanco, setPantallaBanco] = useState("seleccionTema"); // seleccionTema, mostrarEjercicio
  const [temasBanco, setTemasBanco] = useState([]);
  const [temasSeleccionadosBanco, setTemasSeleccionadosBanco] = useState([]);
  const [preguntasBanco, setPreguntasBanco] = useState([]);
  const [preguntaActualBanco, setPreguntaActualBanco] = useState(0);
  const [respuestaSeleccionadaBanco, setRespuestaSeleccionadaBanco] = useState(null);
  const [verificacionRespuestaBanco, setVerificacionRespuestaBanco] = useState(null); // null, 'correcta', 'incorrecta'
  const [preguntasBancoOriginales, setPreguntasBancoOriginales] = useState([]); // To hold all questions for selected topics
  const [preguntasBancoMostradasIndices, setPreguntasBancoMostradasIndices] = useState([]); // To track shown questions in current round

  // --- END NEW STATES FOR QUESTION BANK ---

 useEffect(() => {
    let intervalo;
    if (tiempoActivo && tiempo > 0 && pantalla === "diagnostico") { // Ensure timer runs only for diagnostic
      intervalo = setInterval(() => {
        setTiempo((tiempoAnterior) => tiempoAnterior - 1);
      }, 1000);
    } else if (tiempo === 0 && pantalla === "diagnostico") {
      finalizarDiagnostico();
    }
    return () => clearInterval(intervalo);
  }, [tiempoActivo, tiempo, pantalla]); // Added pantalla to dependency array

 useEffect(() => {
    if (window.MathJax) {
      if (pantalla === "diagnostico" && preguntas.length > 0 && preguntas[preguntaActual]) {
        window.MathJax.typesetPromise()
          .then(() => console.log("MathJax renderizado para diagnóstico"))
          .catch((err) => console.error("MathJax error:", err));
      } else if (pantalla === "bancoPreguntas" && pantallaBanco === "mostrarEjercicio" && preguntasBanco.length > 0 && preguntasBanco[preguntaActualBanco]) {
        window.MathJax.typesetPromise()
          .then(() => console.log("MathJax renderizado para banco de preguntas"))
          .catch((err) => console.error("MathJax error banco:", err));
      }
    }
  }, [preguntaActual, preguntas, pantalla, preguntaActualBanco, preguntasBanco, pantallaBanco]);

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
      "RM": 1, "Aritmética": 2, "Álgebra": 3, "Geometría": 4, "Trigonometría": 5, "Física": 6, "Química": 7
    };
    return ordenCursos[curso] || 999;
  };

 const iniciarDiagnostico = async () => {
    setCargando(true);
   setRespuestas({});
    setResultados({});
    setPreguntaActual(0);
    setTiempo(tiempoInicial); 
    setTiempoActivo(true);
    setPantalla("diagnostico");
   try {
      const response = await axios.get("https://backend-mvp-a6w0.onrender.com/diagnostico", {
        params: { num_preguntas: 10 }
      });
     if (response.data && response.data.length > 0) {
        const primerasDiezPreguntas = response.data.slice(0, 10); // Tomar solo las primeras 10 como antes
        const preguntasOrdenadas = [...primerasDiezPreguntas].sort((a, b) => {
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
      case "RM": return 1.8;
      case "Aritmética": case "Álgebra": case "Geometría": case "Trigonometría": return 2.2;
     case "Física": return 2.4;
     case "Química": return 1.4;
     default: return 2.0;
   }
  };

 const obtenerComentario = (notaVigesimal) => {
    if (notaVigesimal < 10) return "Es necesario fortalecer tu base para el examen de admisión a la UNI. Te animamos a practicar con dedicación y a revisar los conceptos fundamentales.";
   else if (notaVigesimal < 14) return "Tienes potencial para lograr el ingreso a la UNI, pero se requiere mayor consistencia. Identifica tus áreas de oportunidad y trabaja intensamente en ellas.";
   else if (notaVigesimal < 18) return "¡Vas por buen camino! Estás demostrando un buen nivel de preparación. Continúa practicando para afianzar tus conocimientos y aumentar tus posibilidades de éxito.";
   else return "¡Excelente desempeño! Tu preparación te posiciona para competir por los primeros puestos. ¡Sigue así y alcanzarás tus metas!";
 };

  const finalizarDiagnostico = useCallback(() => { // Wrapped in useCallback
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
   const porcentaje = preguntas.length > 0 ? (preguntasCorrectas / preguntas.length) * 100 : 0;
   notaTotal = Math.min(notaTotal, 20);
   const tiempoUsado = tiempoInicial - tiempo; 
    
    setResultadosTemporales({
      detalles: nuevosResultados, correctas: preguntasCorrectas, incorrectas: preguntasIncorrectas,
      sinResponder: preguntasSinResponder, porcentaje: porcentaje, notaVigesimal: notaTotal, tiempoUsado: tiempoUsado
    });
   setComentarioResultado(obtenerComentario(notaTotal));
   setPantalla("formulario");
  }, [preguntas, respuestas, tiempo, tiempoInicial]); // Added dependencies


const procesarFormulario = async () => {
    if (!validarFormulario()) {
      alert("Por favor, completa correctamente todos los campos del formulario");
     return;
    }
    setResultados(resultadosTemporales);
   try {
      await axios.post("https://backend-mvp-a6w0.onrender.com/guardar-diagnostico", {
        nombre: datosUsuario.nombre, correo: datosUsuario.correo,
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
    setPantalla("resultados");
  };

const formatoTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
   const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  // --- NEW FUNCTIONS FOR QUESTION BANK ---
  const iniciarBancoPreguntasFlow = async () => {
    setCargando(true);
    try {
      const response = await axios.get("https://backend-mvp-a6w0.onrender.com/banco-preguntas/fisica/temas");
      if (response.data && response.data.length > 0) {
        setTemasBanco(response.data);
        setPantalla("bancoPreguntas");
        setPantallaBanco("seleccionTema");
        // Resetear estados del banco por si se reingresa
        setTemasSeleccionadosBanco([]);
        setPreguntasBanco([]);
        setPreguntaActualBanco(0);
        setRespuestaSeleccionadaBanco(null);
        setVerificacionRespuestaBanco(null);
        setPreguntasBancoOriginales([]);
        setPreguntasBancoMostradasIndices([]);

      } else {
        alert("No se pudieron cargar los temas para el banco de preguntas.");
        setPantalla("inicio");
      }
    } catch (error) {
      console.error("Error al obtener temas del banco:", error);
      alert("Error al cargar los temas. Por favor, intenta de nuevo.");
      setPantalla("inicio");
    } finally {
      setCargando(false);
    }
  };

  const handleSeleccionTemaBanco = (tema) => {
    setTemasSeleccionadosBanco(prev => 
      prev.includes(tema) ? prev.filter(t => t !== tema) : [...prev, tema]
    );
  };

  const cargarEjerciciosBanco = async () => {
    if (temasSeleccionadosBanco.length === 0) {
      alert("Por favor, selecciona al menos un tema.");
      return;
    }
    setCargando(true);
    try {
      const temasQueryParam = temasSeleccionadosBanco.join(',');
      const response = await axios.get(`https://backend-mvp-a6w0.onrender.com/banco-preguntas/fisica/ejercicios?temas=${temasQueryParam}`);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setPreguntasBancoOriginales(response.data); // Guardamos las originales para re-shuffle
        setPreguntasBanco(response.data); // Ya vienen aleatorias del backend
        setPreguntaActualBanco(0);
        setPantallaBanco("mostrarEjercicio");
        setRespuestaSeleccionadaBanco(null);
        setVerificacionRespuestaBanco(null);
        setPreguntasBancoMostradasIndices([]); // Reiniciar para la nueva carga
      } else if (response.data && response.data.message) {
         alert(response.data.message); // Ej: "No hay ejercicios para los temas seleccionados"
         setPreguntasBanco([]);
         setPreguntasBancoOriginales([]);
      }else {
        alert("No se pudieron cargar ejercicios para los temas seleccionados.");
        setPreguntasBanco([]);
        setPreguntasBancoOriginales([]);
      }
    } catch (error) {
      console.error("Error al obtener ejercicios del banco:", error);
      alert("Error al cargar los ejercicios. Por favor, intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  const seleccionarRespuestaBanco = (preguntaId, letra) => {
    setRespuestaSeleccionadaBanco({ preguntaId, letra });
    setVerificacionRespuestaBanco(null); // Resetear verificación al cambiar respuesta
  };

  const verificarRespuestaBanco = () => {
    if (!respuestaSeleccionadaBanco) return;
    const preguntaActualData = preguntasBanco[preguntaActualBanco];
    if (preguntaActualData && respuestaSeleccionadaBanco.letra === preguntaActualData.respuesta_correcta) {
      setVerificacionRespuestaBanco("correcta");
    } else {
      setVerificacionRespuestaBanco("incorrecta");
    }
  };
  
  const siguientePreguntaBanco = () => {
    setVerificacionRespuestaBanco(null);
    setRespuestaSeleccionadaBanco(null);

    // Marcar la pregunta actual como vista (usando su ID si está disponible y es único, o índice)
    // Esto es una simplificación, una gestión más robusta de "vistos" podría ser necesaria si las preguntas no tienen ID único fiable
    const currentQuestion = preguntasBanco[preguntaActualBanco];
    const newShownIndices = [...preguntasBancoMostradasIndices, currentQuestion.id || preguntaActualBanco];
    setPreguntasBancoMostradasIndices(newShownIndices);

    if (preguntaActualBanco < preguntasBanco.length - 1) {
        setPreguntaActualBanco(preguntaActualBanco + 1);
    } else {
        // Todas las preguntas de la carga actual han sido mostradas
        alert("Has completado todas las preguntas de esta selección. Puedes volver a cargar los temas o seleccionar otros.");
        // Opcionalmente, reiniciar la ronda si se desea:
        // setPreguntasBanco([...preguntasBancoOriginales].sort(() => 0.5 - Math.random())); // Re-shuffle
        // setPreguntaActualBanco(0);
        // setPreguntasBancoMostradasIndices([]);
        // Por ahora, solo indicamos que se completó.
        setPantallaBanco("seleccionTema"); // Volver a selección de temas
    }
};


  const irAPantallaInicial = () => {
    setPantalla("inicio");
    // Opcional: resetear estados de banco de preguntas y diagnóstico si es necesario
    setTiempoActivo(false); 
  };

  const irASeleccionTemasBanco = () => {
    setPantallaBanco("seleccionTema");
    setVerificacionRespuestaBanco(null);
    setRespuestaSeleccionadaBanco(null);
  }

  // --- END NEW FUNCTIONS FOR QUESTION BANK ---

  // --- RENDER LOGIC ---

  if (cargando) {
    return (
      <div className="container cargando-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (pantalla === "inicio") {
    return (
      <div className="container inicio-container-main"> {/* Nuevo contenedor principal para inicio */}
        <h1>EDBOT</h1>
        <p className="inicio-subtitulo">Preparación preuniversitaria impulsada por IA</p>
        
        <div className="inicio-opciones-container">
          {/* Recuadro Prueba Diagnóstica */}
          <div className="inicio-opcion-recuadro">
            <h2>Prueba de diagnóstico</h2>
            <p>Esta prueba de diagnóstico contiene 10 ejercicios seleccionados de exámenes de admisión a la Universidad Nacional de Ingeniería (UNI), que te permitirán evaluar tu nivel de preparación.</p>
            <p>Dispondrás de 40 minutos para resolverlos.</p>
           <p>¡Mucho éxito!</p>
            <button className="boton-iniciar" onClick={iniciarDiagnostico}>
              Comenzar Prueba
            </button>
          </div>

          {/* Recuadro Banco de Preguntas */}
          <div className="inicio-opcion-recuadro">
            <h2>Banco de preguntas</h2>
            <p>Accede a un extenso banco de preguntas de Física de CEPREUNI. Elige los temas que deseas practicar y refuerza tus conocimientos ejercicio por ejercicio.</p>
            <button className="boton-iniciar" onClick={iniciarBancoPreguntasFlow}>
              Iniciar Banco
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pantalla === "bancoPreguntas") {
    if (pantallaBanco === "seleccionTema") {
      return (
        <div className="container seleccion-tema-container">
          <h1>Banco de Preguntas: Física CEPREUNI</h1>
          <h2>Selecciona los temas que deseas practicar:</h2>
          <div className="temas-lista">
            {temasBanco.map(tema => (
              <div key={tema} className="tema-item">
                <input 
                  type="checkbox"
                  id={`tema-${tema}`}
                  value={tema}
                  checked={temasSeleccionadosBanco.includes(tema)}
                  onChange={() => handleSeleccionTemaBanco(tema)}
                />
                <label htmlFor={`tema-${tema}`}>{tema}</label>
              </div>
            ))}
          </div>
          <div className="controles-navegacion">
            <button className="boton-nav" onClick={irAPantallaInicial}>Volver al Inicio</button>
            <button 
              className="boton-finalizar" 
              onClick={cargarEjerciciosBanco}
              disabled={temasSeleccionadosBanco.length === 0}
            >
              Empezar Ejercicios
            </button>
          </div>
        </div>
      );
    }

    if (pantallaBanco === "mostrarEjercicio" && preguntasBanco.length > 0) {
      const preguntaBP = preguntasBanco[preguntaActualBanco];
      if (!preguntaBP) { // Seguridad por si algo falla en la lógica de índices
        return (
            <div className="container">
                <p>Error: No se pudo cargar la pregunta actual.</p>
                <button className="boton-nav" onClick={irASeleccionTemasBanco}>Seleccionar Temas</button>
                <button className="boton-nav" onClick={irAPantallaInicial}>Volver al Inicio</button>
            </div>);
      }
      return (
        <div className="container diagnostico-container"> {/* Reutilizamos estilos de diagnóstico */}
          <div className="encabezado-simulacro sin-progreso-timer"> {/* Clase para ocultar progreso/timer si es necesario */}
             <h2>Pregunta de Física: {preguntaBP.tema}</h2>
             <p>(Pregunta {preguntaActualBanco + 1} de {preguntasBanco.length})</p>
          </div>
          
          <div className="pregunta-container" key={preguntaBP.id || preguntaActualBanco}> {/* Usar ID si existe */}
           <h3 className="ejercicio-texto"> {/* Usar h3 o ajustar CSS */}
              <span dangerouslySetInnerHTML={{ __html: preguntaBP.ejercicio }}></span>
            </h3>

            {preguntaBP.imagen && (
              <img src={preguntaBP.imagen} alt="Ejercicio" className="imagen-ejercicio" />
            )}

            <ul className="opciones-lista">
              {preguntaBP.alternativas.map((alt) => (
               <li key={alt.letra} className={`opcion ${respuestaSeleccionadaBanco?.letra === alt.letra ? 'opcion-seleccionada' : ''}`}>
                  <label>
                    <input
                      type="radio"
                      name={`pregunta-banco-${preguntaBP.id || preguntaActualBanco}`}
                     value={alt.letra}
                      checked={respuestaSeleccionadaBanco?.letra === alt.letra && respuestaSeleccionadaBanco?.preguntaId === (preguntaBP.id || preguntaActualBanco)}
                      onChange={() => seleccionarRespuestaBanco(preguntaBP.id || preguntaActualBanco, alt.letra)}
                    />
                    <span className="texto-opcion">{alt.letra}: </span>
                   <span className="texto-opcion" dangerouslySetInnerHTML={{ __html: alt.texto }}></span>
                  </label>
                </li>
              ))}
            </ul>
            {verificacionRespuestaBanco && (
              <div className={`verificacion-feedback ${verificacionRespuestaBanco}`}>
                {verificacionRespuestaBanco === 'correcta' ? '¡Correcto!' : `Incorrecto. La respuesta correcta es: ${preguntaBP.respuesta_correcta}`}
              </div>
            )}
          </div>
          
          <div className="controles-navegacion">
            <div>
                <button className="boton-nav" onClick={irAPantallaInicial}>Ir al Inicio</button>
                <button className="boton-nav" onClick={irASeleccionTemasBanco}>Elegir Temas</button>
            </div>
            <div>
                <button 
                className="boton-nav" 
                onClick={verificarRespuestaBanco}
                disabled={!respuestaSeleccionadaBanco || verificacionRespuestaBanco !== null}
                >
                Verificar Respuesta
                </button>
                <button 
                className="boton-finalizar" // Estilo de "siguiente"
                onClick={siguientePreguntaBanco}
                // disabled={verificacionRespuestaBanco === null} // Opcional: habilitar solo después de verificar
                >
                Siguiente Pregunta
                </button>
            </div>
          </div>
        </div>
      );
    } else if (pantallaBanco === "mostrarEjercicio" && preguntasBanco.length === 0 && !cargando) {
        return (
            <div className="container">
                <p>No hay ejercicios disponibles para los temas seleccionados o ya has completado todos.</p>
                <button className="boton-nav" onClick={irASeleccionTemasBanco}>Seleccionar Otros Temas</button>
                <button className="boton-nav" onClick={irAPantallaInicial}>Volver al Inicio</button>
            </div>
        )
    }
  }
  
  // --- PANTALLAS DE DIAGNÓSTICO (SIN CAMBIOS MAYORES, SOLO ASEGURAR QUE FUNCIONEN) ---
 if (pantalla === "diagnostico" && preguntas.length > 0) {
    const pregunta = preguntas[preguntaActual];
   return (
      <div className="container diagnostico-container">
        <div className="encabezado-simulacro"> {/* Cambio de clase para consistencia si es necesario */}
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
          {preguntaActual === preguntas.length - 1 ?
           (<button className="boton-finalizar" onClick={finalizarDiagnostico}> Finalizar diagnostico </button>) : 
            (<button className="boton-nav" onClick={siguientePregunta} > Siguiente </button>)
         }
        </div>
      </div>
    );
  }

 if (pantalla === "formulario") {
    return (
      <div className="container formulario-container">
        <h1>¡Prueba diagnóstica completada!</h1>
        <div className="formulario-content">
          <p>Por favor, completa tus datos para ver tus resultados:</p>
          <form className="formulario-registro">
           <div className="campo-formulario">
              <label htmlFor="nombre">Nombre completo:</label>
              <input type="text" id="nombre" name="nombre" value={datosUsuario.nombre}
               onChange={handleInputChange} placeholder="Ingresa tu nombre completo" required />
            </div>
           <div className="campo-formulario">
              <label htmlFor="correo">Correo electrónico:</label>
              <input type="email" id="correo" name="correo" value={datosUsuario.correo}
               onChange={handleInputChange} placeholder="Ingresa tu correo electrónico" required />
            </div>
           <div className="formulario-info">
              <p>Estos datos nos permitirán enviarte información sobre tus resultados y recomendaciones personalizadas para mejorar tu desempeño.</p>
            </div>
            <button type="button" 
             className="boton-ver-resultados" onClick={procesarFormulario} disabled={!validarFormulario()} >
              Ver mis resultados
            </button>
          </form>
        </div>
     </div>
    );
  }

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
            <div className="valor">{resultados.notaVigesimal?.toFixed(1)}</div> {/* Added optional chaining */}
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
            <div key={pregunta.ejercicio} className={`detalle-pregunta ${
                !respuestas[pregunta.ejercicio] ? "sin-responder" : 
                respuestas[pregunta.ejercicio] === pregunta.respuesta_correcta ? "correcta" : "incorrecta"
             }`}>
              <div className="numero-pregunta">{index + 1}</div>
              <div className="contenido-detalle">
               <div className="texto-ejercicio" dangerouslySetInnerHTML={{ __html: pregunta.ejercicio }}></div>
                <div className="respuesta-detalle">
                  {!respuestas[pregunta.ejercicio] ?
                   (<span className="estado-respuesta sin-responder">Sin responder</span>) : 
                  respuestas[pregunta.ejercicio] === pregunta.respuesta_correcta ?
                   (<span className="estado-respuesta correcta">Correcta: {pregunta.respuesta_correcta} ({calcularPuntajePorCurso(pregunta.curso)} pts)</span>) : 
                   (<span className="estado-respuesta incorrecta">Incorrecta: Elegiste {respuestas[pregunta.ejercicio]}, Correcta: {pregunta.respuesta_correcta}</span>)
                  }
               </div>
              </div>
            </div>
          ))}
        </div>
        <button className="boton-reiniciar" onClick={() => irAPantallaInicial()}> {/* Use new function */}
          Volver al inicio
        </button>
     </div>
    );
  }

  // Fallback si ninguna pantalla coincide (o para el estado inicial de carga antes de 'inicio')
  return (
    <div className="container cargando-container">
      <div className="spinner"></div>
      <p>Cargando aplicación...</p>
    </div>
  );
}

export default App;
