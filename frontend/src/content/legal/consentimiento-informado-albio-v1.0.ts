/**
 * Consentimiento Informado para el uso de ALBIO
 * Versión 1.0 | 2026
 *
 * Fuente de verdad documental: /docs/legal/Consentimiento_Informado_ALBIO_SENS_v1.docx
 * Transcripción íntegra y fiel sin modificaciones.
 */

export interface ConsentTablePlatform {
  name: string;
  role: string;
  policy: string;
}

export interface ConsentSection {
  id: string;
  title: string;
  content?: string[];
  subsections?: {
    id: string;
    title: string;
    items: string[];
  }[];
  bullets?: string[];
  callout?: {
    title: string;
    content: string;
  };
  table?: ConsentTablePlatform[];
}

export const CONSENT_DOCUMENT_META = {
  organization: 'SENS Salud y Desarrollo Humano',
  website: 'senssd.com.ar',
  title: 'CONSENTIMIENTO INFORMADO PARA EL USO DE',
  subtitleAgent: 'ALBIO — Asistente en Bioenergética',
  agentType: 'Agente de Inteligencia Artificial conversacional',
  version: '1.0',
  year: '2026',
  displayVersion: 'Versión 1.0  |  2026',
};

export const CONSENT_DOCUMENT_INTRO = {
  title: 'Antes de continuar, leé este documento con atención.',
  text: 'Este Consentimiento Informado describe qué es ALBIO, para qué sirve, qué datos procesa, qué plataformas tecnológicas están involucradas y cuáles son tus derechos como usuario/a. Al registrarte y utilizar ALBIO, estás aceptando los términos aquí descriptos. Si tenés alguna duda, podés comunicarte con el equipo de SENS antes de completar tu registro.',
};

export const CONSENT_PLATFORMS_TABLE: ConsentTablePlatform[] = [
  {
    name: 'Wix.com',
    role: 'Plataforma de alojamiento del sitio web y gestión de usuarios (login, membresías, acceso al área de miembros).',
    policy: 'Nombre, email, contraseña (encriptada), datos de sesión y navegación. Política de privacidad: wix.com/about/privacy',
  },
  {
    name: 'Dify.ai',
    role: 'Motor de orquestación del agente IA. Procesa los mensajes enviados por el usuario y gestiona el flujo de la conversación.',
    policy: 'Contenido de los mensajes del chat. Dify puede almacenar logs de conversación en sus servidores. Política: dify.ai/privacy',
  },
  {
    name: 'Anthropic / Claude API',
    role: 'Modelo de lenguaje de IA que genera las respuestas conversacionales de ALBIO.',
    policy: 'Los mensajes de la conversación se envían al modelo de Claude para generar respuestas. Anthropic puede retener datos según su política. Política: anthropic.com/privacy',
  },
  {
    name: 'Otras APIs (potencial)',
    role: 'Integraciones adicionales que puedan incorporarse en el futuro (ej. bases de conocimiento externas, herramientas de análisis).',
    policy: 'Se informará al usuario/a ante cualquier nueva integración que implique transferencia de datos personales.',
  },
];

export const CONSENT_DECLARATION_ITEMS: string[] = [
  'Leíste y comprendiste este Consentimiento Informado en su totalidad.',
  'Aceptás voluntariamente los términos aquí descriptos.',
  'Comprendés que ALBIO es un agente de IA de estudio y consulta, y que no reemplaza la supervisión clínica, la formación profesional ni la atención psicológica o psiquiátrica de un/a paciente.',
  'Te comprometés a no incluir en las conversaciones datos que identifiquen a pacientes o terceros.',
  'Comprendés que tus datos serán procesados por SENS y las plataformas tecnológicas descritas en la Sección 4.',
  'Sos mayor de 18 años o contás con el consentimiento de tu representante legal.',
  'Podés revocar este consentimiento en cualquier momento comunicándote con SENS.',
];

export const CONSENT_FOOTER_INFO = {
  digitalNote: 'Nota: En la versión digital, la aceptación de este documento se registra mediante el tilde de confirmación durante el proceso de registro en la plataforma SENS.',
  organizationLine: 'SENS Salud y Desarrollo Humano  —  senssd.com.ar  —  info@senssd.com.ar',
  legalJurisdiction: 'Buenos Aires, Argentina  |  Documento sujeto a la Ley 25.326 de Protección de Datos Personales',
};
