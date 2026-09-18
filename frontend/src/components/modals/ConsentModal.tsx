'use client';

import React, { useEffect } from 'react';
import { X, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  CONSENT_DOCUMENT_META,
  CONSENT_DOCUMENT_INTRO,
  CONSENT_PLATFORMS_TABLE,
  CONSENT_DECLARATION_ITEMS,
  CONSENT_FOOTER_INFO,
} from '@/content/legal/consentimiento-informado-albio-v1.0';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="consent-modal-overlay"
      id="consentModalOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="consent-modal-card"
        id="consentModalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consentModalTitle"
      >
        {/* Header fijo */}
        <div className="consent-modal-header">
          <div className="consent-modal-header-text">
            <div className="consent-org-badge">
              <ShieldCheck size={16} className="consent-badge-icon" />
              <span>{CONSENT_DOCUMENT_META.organization}</span>
            </div>
            <h2 id="consentModalTitle" className="consent-modal-title">
              {CONSENT_DOCUMENT_META.title}
              <br />
              <span className="consent-title-highlight">{CONSENT_DOCUMENT_META.subtitleAgent}</span>
            </h2>
            <div className="consent-version-pill">
              {CONSENT_DOCUMENT_META.displayVersion}
            </div>
          </div>
          <button
            id="btnCloseConsentX"
            onClick={onClose}
            className="consent-close-btn"
            title="Cerrar documento"
            aria-label="Cerrar modal de consentimiento"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo scrolleable */}
        <div className="consent-modal-body" id="consentModalBody">
          {/* Advertencia inicial */}
          <div className="consent-callout consent-callout-intro">
            <h4 className="consent-callout-title">{CONSENT_DOCUMENT_INTRO.title}</h4>
            <p>{CONSENT_DOCUMENT_INTRO.text}</p>
          </div>

          {/* Sección 1 */}
          <section className="consent-section">
            <h3 className="consent-section-title">1. Identificación del servicio y responsable</h3>
            <div className="consent-section-content">
              <p><strong>Nombre del servicio:</strong> ALBIO — Asistente en Bioenergética</p>
              <p><strong>Organización responsable:</strong> SENS Salud y Desarrollo Humano</p>
              <p><strong>Director:</strong> Lic. Tomás Ciminari — Psicólogo (M.N. / M.P. [número])</p>
              <p><strong>Contacto:</strong> info@sensdesarrollohumano.com</p>
            </div>
          </section>

          {/* Sección 2 */}
          <section className="consent-section">
            <h3 className="consent-section-title">2. ¿Qué es ALBIO?</h3>
            <div className="consent-section-content">
              <p>
                ALBIO es un agente conversacional basado en Inteligencia Artificial (IA), desarrollado por SENS Salud y Desarrollo Humano, diseñado como herramienta de estudio y consulta para terapeutas, profesionales de la salud y estudiantes avanzados que trabajan desde el enfoque del Análisis Bioenergético de Alexander Lowen.
              </p>
              <p>
                ALBIO no acompaña directamente a pacientes: está pensado para asistir a quien acompaña a otros, aportando información y marcos conceptuales para pensar consultas teóricas y prácticas.
              </p>

              <h4 className="consent-subsection-title">ALBIO puede:</h4>
              <ul className="consent-bullet-list">
                <li>Responder consultas teóricas sobre el enfoque bioenergético de Alexander Lowen.</li>
                <li>Ofrecer recursos y lecturas basados en la bibliografía especializada del enfoque.</li>
                <li>Ayudar a pensar situaciones clínicas o de acompañamiento desde el marco conceptual bioenergético, sin necesidad de acceder a datos identificables de terceros.</li>
                <li>Facilitar la reflexión sobre casos y prácticas dentro del marco teórico de SENS.</li>
              </ul>

              <h4 className="consent-subsection-title">ALBIO NO puede:</h4>
              <ul className="consent-bullet-list">
                <li>Reemplazar la supervisión clínica ni la formación profesional.</li>
                <li>Reemplazar la atención psicológica, psiquiátrica ni ningún tratamiento de salud mental de un/a paciente.</li>
                <li>Emitir diagnósticos clínicos ni prescribir medicamentos o tratamientos.</li>
                <li>Actuar en situaciones de emergencia o crisis aguda de salud mental.</li>
                <li>Garantizar resultados terapéuticos de ningún tipo.</li>
              </ul>

              {/* Callout Urgencias */}
              <div className="consent-callout consent-callout-warning">
                <div className="consent-callout-header">
                  <AlertTriangle size={18} className="consent-warning-icon" />
                  <h4 className="consent-callout-title">⚠️ Importante — Situaciones de urgencia o crisis</h4>
                </div>
                <p>
                  ALBIO no está disponible para intervención en crisis. Si en el marco de tu trabajo profesional te encontrás ante una situación de riesgo o crisis con un/a paciente o consultante, actuá según los protocolos profesionales y de derivación que correspondan. Si vos mismo/a atravesás una situación de urgencia psicológica o riesgo para tu vida o la de terceros, contactá de inmediato al Centro de Asistencia al Suicida (135), a los servicios de emergencias (107 / 911) o a un profesional de tu confianza. ALBIO no puede sustituir ese acompañamiento.
                </p>
              </div>

              {/* Callout Responsabilidad datos */}
              <div className="consent-callout consent-callout-notice">
                <h4 className="consent-callout-title">Responsabilidad sobre datos de pacientes o consultantes</h4>
                <p>
                  Si utilizás ALBIO para pensar situaciones clínicas o de acompañamiento vinculadas a terceros (pacientes, consultantes, alumnos/as, etc.), es tu responsabilidad no incluir en la conversación datos que permitan identificarlos (nombre, datos de contacto u otra información sensible). Te recomendamos anonimizar o generalizar la información antes de consultarla con el agente.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 3 */}
          <section className="consent-section">
            <h3 className="consent-section-title">3. Datos personales que se recopilan y procesan</h3>
            <div className="consent-section-content">
              <h4 className="consent-subsection-title">3.1. Datos que proporcionás al registrarte</h4>
              <ul className="consent-bullet-list">
                <li>Nombre y apellido</li>
                <li>Dirección de correo electrónico</li>
                <li>Contraseña (almacenada de forma encriptada por Wix)</li>
                <li>Otros datos opcionales que el formulario de registro pueda incluir</li>
              </ul>

              <h4 className="consent-subsection-title">3.2. Datos generados durante el uso de ALBIO</h4>
              <ul className="consent-bullet-list">
                <li>Contenido de las conversaciones que mantengas con el agente.</li>
                <li>Fecha, hora y duración de las sesiones de uso.</li>
                <li>Datos de navegación y dispositivo (recopilados por la plataforma Wix).</li>
              </ul>

              <h4 className="consent-subsection-title">3.3. Finalidad del tratamiento de datos</h4>
              <ul className="consent-bullet-list">
                <li>Brindar el servicio de consulta conversacional de ALBIO.</li>
                <li>Mejorar la calidad y precisión de las respuestas del agente.</li>
                <li>Comunicaciones relacionadas con el servicio (novedades, cambios en los términos).</li>
                <li>Cumplimiento de obligaciones legales aplicables.</li>
              </ul>
            </div>
          </section>

          {/* Sección 4 */}
          <section className="consent-section">
            <h3 className="consent-section-title">4. Plataformas tecnológicas e infraestructura</h3>
            <div className="consent-section-content">
              <p>
                ALBIO está construido sobre un ecosistema de plataformas de terceros. A continuación se describe cada una y el rol que cumple en el procesamiento de los datos:
              </p>

              <div className="consent-table-wrapper">
                <table className="consent-table">
                  <thead>
                    <tr>
                      <th>Plataforma</th>
                      <th>Función en ALBIO</th>
                      <th>Datos que puede procesar / Política</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CONSENT_PLATFORMS_TABLE.map((item, index) => (
                      <tr key={index}>
                        <td className="consent-platform-name">{item.name}</td>
                        <td>{item.role}</td>
                        <td className="consent-policy-cell">{item.policy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="consent-subprocessor-note">
                SENS actúa como responsable del tratamiento de datos. Las plataformas listadas actúan como encargadas del tratamiento (subprocesadoras) en los términos de la Ley 25.326 (Argentina) y normativas aplicables. SENS ha seleccionado estas plataformas evaluando sus estándares de seguridad y privacidad.
              </p>
            </div>
          </section>

          {/* Sección 5 */}
          <section className="consent-section">
            <h3 className="consent-section-title">5. Confidencialidad y tratamiento de la información</h3>
            <div className="consent-section-content">
              <p>
                SENS se compromete a tratar la información de los/as usuarios/as con estricta confidencialidad, en los siguientes términos:
              </p>
              <ul className="consent-bullet-list">
                <li>Los datos personales no serán vendidos, cedidos ni compartidos con terceros con fines comerciales.</li>
                <li>Las conversaciones con ALBIO no serán leídas de forma individual por el equipo de SENS salvo que sea estrictamente necesario para mejorar el servicio o ante requerimiento legal fundado.</li>
                <li>El equipo de SENS accede únicamente a datos agregados y anonimizados para evaluar el desempeño del agente.</li>
                <li>Toda persona que acceda a los datos en el marco de SENS está sujeta al deber de confidencialidad profesional.</li>
              </ul>

              <div className="consent-callout consent-callout-notice">
                <h4 className="consent-callout-title">Limitación importante sobre la confidencialidad técnica</h4>
                <p>
                  Dado que ALBIO opera a través de plataformas de terceros (Dify, Anthropic/Claude, Wix), SENS no tiene control absoluto sobre el procesamiento que dichas plataformas realizan con los datos. Te recomendamos revisar sus políticas de privacidad para tener un panorama completo. Los datos transmitidos a la API de Anthropic pueden quedar sujetos a su propia política de retención de datos. Por esta razón, reiteramos la importancia de no incluir en la conversación datos identificables de pacientes o terceros.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 6 */}
          <section className="consent-section">
            <h3 className="consent-section-title">6. Almacenamiento y seguridad de los datos</h3>
            <div className="consent-section-content">
              <ul className="consent-bullet-list">
                <li>Los datos de registro y acceso se almacenan en los servidores de Wix, que cuenta con certificación de seguridad estándar de la industria (SSL/TLS, encriptación en reposo).</li>
                <li>Los registros de conversación pueden almacenarse en los servidores de Dify y/o Anthropic según sus respectivas políticas.</li>
                <li>SENS aplica medidas razonables de seguridad técnica y organizativa para proteger los datos bajo su control directo.</li>
                <li>No se garantiza la seguridad absoluta en entornos de transmisión de datos por Internet.</li>
                <li><strong>Período de retención:</strong> Los datos se conservarán mientras la cuenta del/la usuario/a permanezca activa. Ante solicitud de baja, SENS eliminará los datos bajo su control directo dentro de un plazo razonable, sin perjuicio de lo que corresponda a las plataformas subprocesadoras.</li>
              </ul>
            </div>
          </section>

          {/* Sección 7 */}
          <section className="consent-section">
            <h3 className="consent-section-title">7. Derechos del/la usuario/a</h3>
            <div className="consent-section-content">
              <p>
                De acuerdo con la Ley de Protección de Datos Personales N° 25.326 (Argentina) y sus modificatorias, y en línea con estándares internacionales como el RGPD (UE), el/la usuario/a tiene derecho a:
              </p>
              <ul className="consent-bullet-list">
                <li><strong>Acceso:</strong> solicitar información sobre los datos personales que SENS conserva sobre vos.</li>
                <li><strong>Rectificación:</strong> corregir datos incorrectos, incompletos o inexactos.</li>
                <li><strong>Supresión (derecho al olvido):</strong> solicitar la eliminación de tus datos personales.</li>
                <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos para determinadas finalidades.</li>
                <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y de uso común.</li>
                <li><strong>Revocación del consentimiento:</strong> podés revocar este consentimiento en cualquier momento, sin que ello afecte la licitud del tratamiento previo a la revocación.</li>
              </ul>
              <p>
                Para ejercer cualquiera de estos derechos, escribinos a: <strong>info@sensdesarrollohumano.com</strong>
              </p>
              <p className="consent-legal-authority">
                La DIRECCIÓN NACIONAL DE PROTECCIÓN DE DATOS PERSONALES (DNPDP) es el organismo competente para recibir denuncias en materia de protección de datos personales en Argentina.
              </p>
            </div>
          </section>

          {/* Sección 8 */}
          <section className="consent-section">
            <h3 className="consent-section-title">8. Menores de edad</h3>
            <div className="consent-section-content">
              <p>
                ALBIO está destinado exclusivamente a personas mayores de 18 años, en el marco de su formación o ejercicio profesional. Si sos menor de edad, no podés registrarte ni utilizar este servicio sin el consentimiento expreso de tu padre, madre o tutor/a legal, quien deberá comunicarse con SENS antes del registro.
              </p>
            </div>
          </section>

          {/* Sección 9 */}
          <section className="consent-section">
            <h3 className="consent-section-title">9. Modificaciones a este documento</h3>
            <div className="consent-section-content">
              <p>
                SENS se reserva el derecho de actualizar este Consentimiento Informado cuando se produzcan cambios relevantes en el servicio, las plataformas tecnológicas utilizadas o el marco legal aplicable. Ante cualquier modificación sustancial, se notificará a los/as usuarios/as registrados/as por correo electrónico o mediante aviso en la plataforma, y se requerirá la aceptación expresa del nuevo documento.
              </p>
            </div>
          </section>

          {/* Sección 10 */}
          <section className="consent-section">
            <h3 className="consent-section-title">10. Declaración de aceptación y consentimiento</h3>
            <div className="consent-section-content">
              <div className="consent-declaration-box">
                <p className="consent-declaration-intro">Al completar tu registro en ALBIO, declarás que:</p>
                <ul className="consent-declaration-list">
                  {CONSENT_DECLARATION_ITEMS.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>

              {/* Cuadro versión impresa */}
              <div className="consent-signature-grid">
                <div className="consent-signature-box">
                  <div className="consent-signature-label">Nombre completo del/la usuario/a</div>
                </div>
                <div className="consent-signature-box">
                  <div className="consent-signature-label">Fecha</div>
                </div>
              </div>
              <div className="consent-signature-box consent-signature-full">
                <div className="consent-signature-label">Firma (si aplica — versión impresa)</div>
              </div>

              <div className="consent-digital-note">
                {CONSENT_FOOTER_INFO.digitalNote}
              </div>
            </div>
          </section>

          {/* Footer institucional del documento */}
          <div className="consent-doc-footer-info">
            <p className="consent-footer-org">{CONSENT_FOOTER_INFO.organizationLine}</p>
            <p className="consent-footer-jurisdiction">{CONSENT_FOOTER_INFO.legalJurisdiction}</p>
          </div>
        </div>

        {/* Footer fijo del modal */}
        <div className="consent-modal-actions">
          <button
            id="btnCerrarConsentModal"
            type="button"
            onClick={onClose}
            className="btn-primary consent-action-btn"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
