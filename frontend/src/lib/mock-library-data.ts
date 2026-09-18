/**
 * Datos mock para el Índice / Biblioteca de Contenidos de ALBIO.
 * Diseñado para ser reemplazado fácilmente por fuentes reales en el futuro.
 */

export type LibraryCategoryKey =
  | 'VIDEOS EJERCICIOS BIO'
  | 'GUÍAS BIO'
  | 'LIBROS BIO'
  | 'PODCAST BIO';

export interface LibraryItem {
  id: string;
  title: string;
  category: LibraryCategoryKey;
  type: string; // Ej: 'Video Práctico', 'Guía PDF', 'Texto Teórico', 'Audio Episodio'
  metadata: string; // Ej: '15 min', 'PDF · 24 págs', '320 págs', '42 min'
  description: string;
  badge: string;
  iconType: 'video' | 'guide' | 'book' | 'podcast';
  accentColor: string;
}

export interface LibrarySection {
  id: string;
  title: LibraryCategoryKey;
  subtitle: string;
  description: string;
  items: LibraryItem[];
}

export const MOCK_LIBRARY_SECTIONS: LibrarySection[] = [
  {
    id: 'videos-ejercicios',
    title: 'VIDEOS EJERCICIOS BIO',
    subtitle: 'Prácticas corporales y dinámicas de movimiento',
    description: 'Secuencias guiadas para trabajo de enraizamiento, respiración y descarga.',
    items: [
      {
        id: 'vid-1',
        title: 'Ejercicio de grounding y enraizamiento básico',
        category: 'VIDEOS EJERCICIOS BIO',
        type: 'Video Práctico',
        metadata: '14 min',
        description: 'Postura del arco bioenergético, flexión de rodillas y conexión con la tierra.',
        badge: 'Práctica',
        iconType: 'video',
        accentColor: '#009688',
      },
      {
        id: 'vid-2',
        title: 'Respiración diafragmática y presencia corporal',
        category: 'VIDEOS EJERCICIOS BIO',
        type: 'Video Práctico',
        metadata: '18 min',
        description: 'Ampliación de la capacidad ventilatoria y apertura de la caja torácica.',
        badge: 'Respiración',
        iconType: 'video',
        accentColor: '#009688',
      },
      {
        id: 'vid-3',
        title: 'Movilidad pélvica y descarga de tensiones',
        category: 'VIDEOS EJERCICIOS BIO',
        type: 'Video Práctico',
        metadata: '22 min',
        description: 'Técnicas de balanceo pélvico para liberar el segmento lumbosacro.',
        badge: 'Movilidad',
        iconType: 'video',
        accentColor: '#009688',
      },
      {
        id: 'vid-4',
        title: 'Liberación de corazas en cuello y hombros',
        category: 'VIDEOS EJERCICIOS BIO',
        type: 'Video Práctico',
        metadata: '16 min',
        description: 'Movimientos rotacionales y expresión de tensiones retenidas en el segmento cervical.',
        badge: 'Cervical',
        iconType: 'video',
        accentColor: '#009688',
      },
      {
        id: 'vid-5',
        title: 'Trabajo de ojos y mandíbula (segmento ocular y oral)',
        category: 'VIDEOS EJERCICIOS BIO',
        type: 'Video Práctico',
        metadata: '12 min',
        description: 'Expresión facial y desmovilización de la mordida y la mirada fija.',
        badge: 'Segmental',
        iconType: 'video',
        accentColor: '#009688',
      },
      {
        id: 'vid-6',
        title: 'Secuencia integradora de vibración y descanso',
        category: 'VIDEOS EJERCICIOS BIO',
        type: 'Video Práctico',
        metadata: '25 min',
        description: 'Cierre de sesión con vibración involuntaria regulada y relajación activa.',
        badge: 'Integración',
        iconType: 'video',
        accentColor: '#009688',
      },
    ],
  },
  {
    id: 'guias-bio',
    title: 'GUÍAS BIO',
    subtitle: 'Materiales conceptuales y fichas de lectura',
    description: 'Documentos esquemáticos para la comprensión teórica y la articulación conceptual.',
    items: [
      {
        id: 'guia-1',
        title: 'Introducción al Análisis Bioenergético',
        category: 'GUÍAS BIO',
        type: 'Guía PDF',
        metadata: 'PDF · 18 págs',
        description: 'Fundamentos de Alexander Lowen: energía, coraza muscular y carácter.',
        badge: 'Fundamentos',
        iconType: 'guide',
        accentColor: '#0284c7',
      },
      {
        id: 'guia-2',
        title: 'Guía de ejercicios básicos de bioenergética',
        category: 'GUÍAS BIO',
        type: 'Guía PDF',
        metadata: 'PDF · 24 págs',
        description: 'Compendio ilustrado de posturas corporales, precauciones y contraindicaciones.',
        badge: 'Ejercicios',
        iconType: 'guide',
        accentColor: '#0284c7',
      },
      {
        id: 'guia-3',
        title: 'Lectura corporal y estructuras de carácter',
        category: 'GUÍAS BIO',
        type: 'Guía PDF',
        metadata: 'PDF · 32 págs',
        description: 'Identificación de patrones posturales según las cinco estructuras bioenergéticas.',
        badge: 'Diagnóstico',
        iconType: 'guide',
        accentColor: '#0284c7',
      },
      {
        id: 'guia-4',
        title: 'El concepto de carga y descarga energética',
        category: 'GUÍAS BIO',
        type: 'Guía PDF',
        metadata: 'PDF · 15 págs',
        description: 'Ciclo energético de cuatro fases: carga, acumulación, descarga y relajación.',
        badge: 'Teoría',
        iconType: 'guide',
        accentColor: '#0284c7',
      },
      {
        id: 'guia-5',
        title: 'Glosario de términos clínicos bioenergéticos',
        category: 'GUÍAS BIO',
        type: 'Ficha de Consulta',
        metadata: 'PDF · 12 págs',
        description: 'Definición operativa de conceptos clave utilizados por Wilhelm Reich y Alexander Lowen.',
        badge: 'Glosario',
        iconType: 'guide',
        accentColor: '#0284c7',
      },
      {
        id: 'guia-6',
        title: 'Articulación bioenergética y clínica contemporánea',
        category: 'GUÍAS BIO',
        type: 'Guía PDF',
        metadata: 'PDF · 28 págs',
        description: 'Puntos de encuentro con neurobiología interpersonal y trauma somático.',
        badge: 'Clínica',
        iconType: 'guide',
        accentColor: '#0284c7',
      },
    ],
  },
  {
    id: 'libros-bio',
    title: 'LIBROS BIO',
    subtitle: 'Bibliografía de referencia y obras canónicas',
    description: 'Fichas bibliográficas y sinopsis analíticas de la literatura fundacional.',
    items: [
      {
        id: 'lib-1',
        title: 'Bioenergética (1975) — Alexander Lowen',
        category: 'LIBROS BIO',
        type: 'Obra Fundamental',
        metadata: '350 págs',
        description: 'El texto central de Lowen que sistematiza la terapia bioenergética y el uso del cuerpo.',
        badge: 'Canónico',
        iconType: 'book',
        accentColor: '#0f766e',
      },
      {
        id: 'lib-2',
        title: 'El lenguaje del cuerpo (1958) — Alexander Lowen',
        category: 'LIBROS BIO',
        type: 'Obra Fundamental',
        metadata: '400 págs',
        description: 'Estudio clásico sobre la dinámica física de la estructura del carácter y su expresión somática.',
        badge: 'Canónico',
        iconType: 'book',
        accentColor: '#0f766e',
      },
      {
        id: 'lib-3',
        title: 'La depresión y el cuerpo (1972) — Alexander Lowen',
        category: 'LIBROS BIO',
        type: 'Estudio Clínico',
        metadata: '280 págs',
        description: 'Exploración de la falta de vitalidad somática y la desconexión afectiva.',
        badge: 'Clínica',
        iconType: 'book',
        accentColor: '#0f766e',
      },
      {
        id: 'lib-4',
        title: 'El placer: Un enfoque creativo de la vida (1970)',
        category: 'LIBROS BIO',
        type: 'Obra Teórica',
        metadata: '260 págs',
        description: 'Análisis de la pulsión placentera, la pulsación vital y los bloqueos psicosomáticos.',
        badge: 'Filosofía',
        iconType: 'book',
        accentColor: '#0f766e',
      },
      {
        id: 'lib-5',
        title: 'Miedo a la vida (1980) — Alexander Lowen',
        category: 'LIBROS BIO',
        type: 'Obra Teórica',
        metadata: '240 págs',
        description: 'Comprensión de la histeria, el miedo al afecto profundo y la defensa corporal.',
        badge: 'Teoría',
        iconType: 'book',
        accentColor: '#0f766e',
      },
      {
        id: 'lib-6',
        title: 'Ejercicios de bioenergética — Alexander y Leslie Lowen',
        category: 'LIBROS BIO',
        type: 'Manual de Ejercicios',
        metadata: '210 págs',
        description: 'Manual práctico paso a paso de los ejercicios diseñados por el matrimonio Lowen.',
        badge: 'Manual',
        iconType: 'book',
        accentColor: '#0f766e',
      },
    ],
  },
  {
    id: 'podcast-bio',
    title: 'PODCAST BIO',
    subtitle: 'Conversaciones audibles y reflexiones conceptuales',
    description: 'Episodios de audio con debates, análisis de casos teóricos y entrevistas.',
    items: [
      {
        id: 'pod-1',
        title: 'Conversaciones sobre Bioenergética: El concepto de cuerpo',
        category: 'PODCAST BIO',
        type: 'Audio Episodio',
        metadata: '45 min · Ep. 1',
        description: 'Diálogo introductorio sobre qué implica habitar el cuerpo en el siglo XXI.',
        badge: 'Episodio 1',
        iconType: 'podcast',
        accentColor: '#6366f1',
      },
      {
        id: 'pod-2',
        title: 'Cuerpo, emoción y presencia: De Reich a Lowen',
        category: 'PODCAST BIO',
        type: 'Audio Episodio',
        metadata: '52 min · Ep. 2',
        description: 'Evolución histórica de la vegetoterapia de Reich hacia el análisis bioenergético.',
        badge: 'Episodio 2',
        iconType: 'podcast',
        accentColor: '#6366f1',
      },
      {
        id: 'pod-3',
        title: 'Grounding: Anclaje a la realidad en tiempos de hiperconexión',
        category: 'PODCAST BIO',
        type: 'Audio Episodio',
        metadata: '38 min · Ep. 3',
        description: 'Cómo opera el contacto con el suelo como regulador del sistema nervioso.',
        badge: 'Episodio 3',
        iconType: 'podcast',
        accentColor: '#6366f1',
      },
      {
        id: 'pod-4',
        title: 'La armadura muscular y los 7 segmentos de tensión',
        category: 'PODCAST BIO',
        type: 'Audio Episodio',
        metadata: '48 min · Ep. 4',
        description: 'Recorrido detallado por los anillos de tensión somática desde la cabeza a la pelvis.',
        badge: 'Episodio 4',
        iconType: 'podcast',
        accentColor: '#6366f1',
      },
      {
        id: 'pod-5',
        title: 'Respiración, voz y resonancia emocional',
        category: 'PODCAST BIO',
        type: 'Audio Episodio',
        metadata: '41 min · Ep. 5',
        description: 'La voz como manifestación directa del pasaje de aire y la apertura torácica.',
        badge: 'Episodio 5',
        iconType: 'podcast',
        accentColor: '#6366f1',
      },
      {
        id: 'pod-6',
        title: 'Diálogos de supervisión teórica en bioenergética',
        category: 'PODCAST BIO',
        type: 'Audio Episodio',
        metadata: '56 min · Ep. 6',
        description: 'Reflexiones y consideraciones éticas en el encuadre psicocorporal.',
        badge: 'Episodio 6',
        iconType: 'podcast',
        accentColor: '#6366f1',
      },
    ],
  },
];
