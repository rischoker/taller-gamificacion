// Contenido del taller "Gamificar en el aula".
// Cada escena tiene un `type` (plantilla visual) y `lv` (sección: 0 intro, 1-3 niveles, 4 cierre).
// Las escenas con `act` abren una actividad en los celulares.
//   act.type: 'quiz' | 'poll' | 'fsw' (Find someone who) | 'cloud'
//   quiz.correct = índice de la opción correcta (nunca se envía a los celulares antes de revelar)

module.exports = [
  {
    type: 'cover', lv: 0, title: 'Portada'
  },
  {
    type: 'poll', lv: 0, title: 'PRESS START: ¿esto es gamificar?',
    kicker: 'PRESS START',
    question: '¿Cuál de estas es gamificar?',
    act: {
      type: 'poll',
      question: '¿Cuál de estas es gamificar?',
      options: [
        { label: 'A', title: 'Cronómetro + puntos', desc: 'Responde rápido y sube al podio.' },
        { label: 'B', title: 'Historia + decisiones', desc: 'Cada elección cambia el camino.' },
        { label: 'C', title: 'Juego para practicar', desc: 'El reto enseña el contenido.' },
        { label: '★', title: 'Todas', desc: 'Las tres son gamificar.' }
      ]
    }
  },
  {
    type: 'path', lv: 0, title: 'Mapa del taller',
    kicker: 'WORLD MAP',
    steps: ['Entender', 'Elegir', 'Crear', 'Jugar', 'Reflexionar']
  },
  {
    type: 'cards', lv: 0, title: 'Tres conceptos. Tres propósitos.', cols: 3,
    cards: [
      { tag: '01', title: 'Gamificación', text: 'Diseña una experiencia completa con metas, progreso, narrativa y decisiones.' },
      { tag: '02', title: 'Elementos de juego', text: 'Añade puntos, insignias o tiempo a una actividad que ya existe.' },
      { tag: '03', title: 'Aprendizaje basado en juegos', text: 'Usa un juego completo para lograr un objetivo de aprendizaje.' }
    ]
  },
  {
    type: 'quiz', lv: 0, title: 'Quiz 1/3', kicker: 'QUIZ · 1/3',
    act: {
      type: 'quiz', duration: 20,
      question: 'Pones un cronómetro de 2 minutos y das puntos al grupo más rápido. Esto es…',
      options: ['Gamificación', 'Elementos de juego', 'Aprendizaje basado en juegos'],
      correct: 1,
      explain: 'Añadiste piezas sueltas (tiempo y puntos) a una actividad que ya existía.'
    }
  },
  {
    type: 'quiz', lv: 0, title: 'Quiz 2/3', kicker: 'QUIZ · 2/3',
    act: {
      type: 'quiz', duration: 20,
      question: 'Toda la unidad es un viaje: pasaporte, insignias, niveles y misiones semanales. Esto es…',
      options: ['Gamificación', 'Elementos de juego', 'Aprendizaje basado en juegos'],
      correct: 0,
      explain: 'Es un sistema que dura toda la unidad: metas, progreso y narrativa.'
    }
  },
  {
    type: 'quiz', lv: 0, title: 'Quiz 3/3', kicker: 'QUIZ · 3/3',
    act: {
      type: 'quiz', duration: 20,
      question: 'La clase juega Shark Bait para salvar piratas eligiendo la oración correcta. Esto es…',
      options: ['Gamificación', 'Elementos de juego', 'Aprendizaje basado en juegos'],
      correct: 2,
      explain: 'Es un juego completo diseñado para practicar el tema.'
    }
  },
  {
    type: 'compare', lv: 0, title: 'No es lo mismo — y ambos sirven',
    left: { tag: 'RÁPIDO', title: 'Temporizador + puntos', items: ['Gamificación ligera', 'Motivación externa', 'Rápida de montar', 'Ideal para activar y repasar'] },
    right: { tag: 'INMERSIVO', title: 'Juego diseñado para el tema', items: ['Narrativa + reto', 'Feedback inmediato', 'Inmersión', 'Mayor inversión de tiempo'] }
  },
  {
    type: 'ingredients', lv: 0, title: 'Los ingredientes que enganchan',
    items: [
      { icon: '🎯', t: 'META' }, { icon: '⚔️', t: 'RETO' }, { icon: '🔀', t: 'ELECCIÓN' },
      { icon: '⚡', t: 'FEEDBACK' }, { icon: '📈', t: 'PROGRESO' }, { icon: '📜', t: 'HISTORIA' }
    ],
    note: 'Ojo: la competencia puede afectar a quien va más lento. Combina reto con colaboración.'
  },
  {
    type: 'mission', lv: 0, title: 'Caso práctico: el presente perfecto',
    objective: 'Hablar de experiencias con confianza',
    mission: 'Preguntar y responder con Have you ever…?',
    chips: ['ever', 'never', 'already', 'yet', 'for', 'since'],
    question: 'Mañana tengo que enseñarlo. ¿Qué puedo usar?'
  },
  {
    type: 'fsw', lv: 0, title: 'Opción A · Solo elementos de juego',
    kicker: 'OPCIÓN A · SOLO ELEMENTOS DE JUEGO',
    note: 'Find someone who + tiempo + puntos. Energía inmediata… pero la motivación termina con la actividad.',
    act: {
      type: 'fsw',
      question: 'Have you ever played a video game for more than 3 hours straight?',
      options: ["Yes, I have!", "No, I haven't."]
    }
  },
  {
    type: 'passport', lv: 0, title: 'Opción B · Gamificar la unidad',
    badges: [
      { name: 'Explorer', g: 'ever / never', c: 'mg' },
      { name: 'On Time', g: 'already / yet', c: 'cy' },
      { name: 'Time Keeper', g: 'for / since', c: 'yl' }
    ],
    levels: ['Tourist', 'Backpacker', 'Globetrotter'],
    missions: ['Misiones semanales', 'Recompensas que motivan: elegir la canción del warm-up'],
    tagline: 'Usa el presente perfecto. Acumula experiencias. Llega más lejos.'
  },
  {
    type: 'level', lv: 1, n: 1, title: 'LEVEL 1', sub: 'Fácil · plataformas listas para usar'
  },
  {
    type: 'cards', lv: 1, title: 'Tu caja de herramientas · Nivel 1', cols: 3, small: true,
    cards: [
      { tag: 'APP', title: 'Kahoot', text: 'Quiz competitivo con música y podio.' },
      { tag: 'APP', title: 'Wayground', text: 'Antes Quizizz. Práctica a ritmo propio.' },
      { tag: 'APP', title: 'Baamboozle', text: 'Equipos, una sola pantalla, sin celulares.' },
      { tag: 'APP', title: 'Wordwall', text: 'Plantillas rápidas: ruleta, anagrama, parejas.' },
      { tag: 'APP', title: 'Blooket / Gimkit', text: 'Modos de juego con personajes y economía.' },
      { tag: 'APP', title: 'Mentimeter', text: 'Votaciones y nube de ideas en vivo.' }
    ]
  },
  {
    type: 'table', lv: 1, title: 'Cuándo usar cada una',
    head: ['Herramienta', 'Celulares', 'Sin internet*', 'Ideal para'],
    rows: [
      ['Kahoot', 'Sí', 'No', 'Warm-up'],
      ['Wayground', 'Sí', 'No', 'Repaso'],
      ['Baamboozle', 'No*', 'Sí*', 'Equipos'],
      ['Wordwall', 'Opcional', 'Sí*', 'Práctica']
    ],
    tip: 'TIP: empieza con una sola herramienta y domínala.',
    foot: '* Los estudiantes no necesitan conexión; el profe sí la necesita en su pantalla.'
  },
  {
    type: 'cards', lv: 1, title: 'Ejemplo nivel 1 · Presente perfecto', cols: 4, kicker: 'EJEMPLO',
    cards: [
      { tag: 'WORDWALL', title: 'Ruleta', text: 'Preguntas Have you ever…? para hablar en parejas.' },
      { tag: 'KAHOOT', title: 'Quiz', text: 'for vs since y already vs yet como repaso.' },
      { tag: 'GIMKIT', title: 'Práctica', text: 'Participios pasados irregulares.' },
      { tag: 'BAAMBOOZLE', title: 'Equipos', text: 'Juego en el proyector sin celulares.' }
    ],
    foot: 'Preparación: 10 a 15 minutos. Muchas tienen plantillas ya hechas.'
  },
  {
    type: 'quiz', lv: 1, title: 'Reto 1/3', kicker: 'RETO PRESENTE PERFECTO · 1/3', banner: 'Ahora ustedes son los estudiantes',
    act: {
      type: 'quiz', duration: 20,
      question: "I haven't finished my coffee ___.",
      options: ['already', 'yet', 'since', 'ever'],
      correct: 1,
      explain: 'yet va en negativas y preguntas, al final de la oración.'
    }
  },
  {
    type: 'quiz', lv: 1, title: 'Reto 2/3', kicker: 'RETO PRESENTE PERFECTO · 2/3', banner: 'Ahora ustedes son los estudiantes',
    act: {
      type: 'quiz', duration: 20,
      question: 'She has lived in Bogotá ___ 2019.',
      options: ['for', 'since', 'yet', 'already'],
      correct: 1,
      explain: 'since + punto de inicio (2019). for + duración (5 years).'
    }
  },
  {
    type: 'quiz', lv: 1, title: 'Reto 3/3', kicker: 'RETO PRESENTE PERFECTO · 3/3', banner: 'Ahora ustedes son los estudiantes',
    act: {
      type: 'quiz', duration: 20,
      question: 'Have you ___ been to Cartagena?',
      options: ['ever', 'never', 'yet', 'since'],
      correct: 0,
      explain: 'ever en preguntas sobre experiencias de vida.'
    }
  },
  {
    type: 'level', lv: 2, n: 2, title: 'LEVEL 2', sub: 'Intermedio · recursos más robustos'
  },
  {
    type: 'cards', lv: 2, title: 'Herramientas · Nivel 2', cols: 3,
    cards: [
      { tag: 'CREA', title: 'Genially', text: 'Escape rooms con pistas, rutas y contenido interactivo.' },
      { tag: 'NARRA', title: 'Twine', text: 'Historias ramificadas donde cada decisión practica lenguaje.' },
      { tag: 'DISEÑA', title: 'Canva + Forms', text: 'Tableros, misiones y escape rooms con secciones en Google Forms.' }
    ]
  },
  {
    type: 'escape', lv: 2, title: 'Ejemplo nivel 2 · Escape room',
    name: 'Lost at the Airport',
    story: 'Perdiste tu vuelo y debes salir del aeropuerto.',
    locks: [
      { t: 'Candado 1', d: 'Completa con already o yet' },
      { t: 'Candado 2', d: 'Elige for o since' },
      { t: 'Candado 3', d: 'Ordena la pregunta Have you ever…' }
    ],
    foot: 'Cada respuesta correcta abre la siguiente puerta. Preparación: una tarde, reutilizable con todos tus grupos.'
  },
  {
    type: 'level', lv: 3, n: 3, title: 'LEVEL 3', sub: 'Avanzado · crea tus propios juegos con IA'
  },
  {
    type: 'steps', lv: 3, title: 'De la idea al juego en línea',
    steps: [
      { t: 'OBJETIVO', d: '¿Qué practicarán?' },
      { t: 'MECÁNICA', d: '¿Qué harán?' },
      { t: 'PROTOTIPO', d: 'Prueba lo mínimo con Claude, Gemini o ChatGPT' },
      { t: 'PUBLICA', d: 'GitHub Pages o Render. Comparte y observa' }
    ],
    foot: 'Bonus: celulares como control con un código QR (como esta presentación).'
  },
  {
    type: 'prompt', lv: 3, title: 'Pídele a la IA un juego jugable',
    tips: [
      'Define objetivo, nivel MCER e idioma',
      'Describe reglas y condición de victoria',
      'Pide feedback inmediato y claro',
      'Limita pantalla, tiempo y controles',
      'Prueba con 3 estudiantes antes de escalar'
    ],
    prompt: 'Crea un juego web multijugador en un solo archivo HTML para practicar el presente perfecto con estudiantes de inglés nivel A2. Los celulares son los controles y la pantalla del profesor muestra votaciones y ranking.'
  },
  {
    type: 'quiz', lv: 3, title: 'Ejemplo nivel 3', kicker: 'EJEMPLO NIVEL 3 · HECHO CON IA', banner: 'Two truths and a lie · Have you ever edition',
    act: {
      type: 'quiz', duration: 20,
      question: 'Which sentence is correct?',
      options: ['I have ever visited Japan.', 'I have never met a celebrity.', 'I have met a dolphins.'],
      correct: 1,
      explain: 'ever no va en afirmativas; "a dolphins" mezcla singular y plural.'
    }
  },
  {
    type: 'sharkbait', lv: 3, title: 'Demo en vivo: Shark Bait'
  },
  {
    type: 'chips', lv: 3, title: '¿Qué acabamos de vivir?',
    chips: ['TIEMPO', 'VOTACIÓN', 'NARRATIVA', 'TENSIÓN', 'COLABORACIÓN'],
    statement: 'El juego refuerza un tema; no solo reparte puntos.'
  },
  {
    type: 'cards', lv: 4, title: 'Retos de gamificar en el aula', cols: 5, small: true,
    cards: [
      { tag: 'RETO', title: 'Tiempo', text: 'Diseñar toma más que jugar.' },
      { tag: 'RETO', title: 'Acceso', text: 'No todos llegan igual.' },
      { tag: 'RETO', title: 'Ruido', text: 'Competir puede distraer.' },
      { tag: 'RETO', title: 'Datos', text: 'Privacidad y cuentas.' },
      { tag: 'RETO', title: 'Propósito', text: 'La mecánica debe enseñar.' }
    ]
  },
  {
    type: 'statement', lv: 4, title: 'Las brechas: ¿para quién es el juego?',
    big: 'Gamificar no debe ampliar la brecha.',
    sub: 'Dispositivos · internet · pagos · habilidades digitales',
    altTitle: 'Diseña para incluir',
    alts: ['Equipos con un solo dispositivo', 'Versiones sin conexión', 'Papel + tablero', 'Roles diversos dentro del equipo']
  },
  {
    type: 'poll', lv: 4, title: 'La barrera más grande', kicker: 'ENCUESTA',
    act: {
      type: 'poll',
      question: '¿Cuál es la barrera más grande en tu contexto?',
      options: [
        { label: '📱', title: 'Dispositivos' },
        { label: '📶', title: 'Internet' },
        { label: '⏳', title: 'Tiempo para preparar' },
        { label: '💳', title: 'Pagos y licencias' },
        { label: '🧠', title: 'Habilidades digitales' }
      ]
    }
  },
  {
    type: 'cloud', lv: 4, title: 'Pausa de reflexión', kicker: 'PAUSA DE REFLEXIÓN',
    act: {
      type: 'cloud',
      question: '¿Qué recursos tienes realmente en tu aula?',
      hint: 'Escribe hasta 3 respuestas cortas'
    }
  },
  {
    type: 'matrix', lv: 4, title: 'Mismo tema, tres caminos',
    rows: ['Tiempo de preparación', 'Recursos necesarios', 'Personalización', 'Impacto emocional'],
    cols: [
      { lv: 'LEVEL 1', c: 'cy', v: ['Minutos', 'Dispositivos e internet', 'Baja', 'Alto en el momento'], m: [1, 2, 1, 2] },
      { lv: 'LEVEL 2', c: 'mg', v: ['Una tarde', 'Computador', 'Media', 'Inmersivo'], m: [2, 2, 2, 3] },
      { lv: 'LEVEL 3', c: 'yl', v: ['Varios días', 'IA y hosting', 'Total', 'Memorable'], m: [3, 3, 3, 3] }
    ],
    foot: 'No hay un nivel mejor: hay un nivel adecuado para tu contexto.'
  },
  {
    type: 'flow', lv: 4, title: '¿Qué recurso uso?'
  },
  {
    type: 'poll', lv: 4, title: 'Tu próximo nivel', kicker: 'ENCUESTA',
    act: {
      type: 'poll',
      question: '¿Qué vas a probar primero?',
      options: [
        { label: '1', title: 'Nivel 1 · Una plataforma lista' },
        { label: '2', title: 'Nivel 2 · Un recurso robusto' },
        { label: '3', title: 'Nivel 3 · Mi propio juego con IA' },
        { label: '★', title: 'Gamificar toda una unidad' }
      ]
    }
  },
  {
    type: 'steps', lv: 4, title: 'Tu siguiente misión', vertical: true,
    steps: [
      { t: 'ELIGE', d: 'una necesidad real' },
      { t: 'PRUEBA', d: 'una mecánica' },
      { t: 'OBSERVA', d: 'a tus estudiantes' },
      { t: 'AJUSTA', d: 'antes de añadir más' },
      { t: 'COMPARTE', d: 'lo aprendido' }
    ]
  },
  {
    type: 'podium', lv: 4, title: 'Podio final'
  },
  {
    type: 'end', lv: 4, title: 'Game over'
  }
];
