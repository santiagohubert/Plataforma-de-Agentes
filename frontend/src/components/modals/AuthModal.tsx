'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { signIn, signUp } from '@/lib/auth-client';
import { api } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Argentina');
  const [city, setCity] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [consent, setConsent] = useState(false);
  const [mailing, setMailing] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!consent) {
          setError('Debes aceptar las condiciones de uso para continuar.');
          setLoading(false);
          return;
        }

        const res = await signUp.email({
          email,
          password,
          name: name || 'Usuario SENS',
        });

        if (res.error) {
          setError(res.error.message || 'Error al crear la cuenta.');
          setLoading(false);
          return;
        }

        try {
          await api.saveConsent({
            mailing,
            country,
            city,
            birthYear: birthYear ? parseInt(birthYear, 10) : undefined,
          });
        } catch (consentErr) {
          console.error('Error guardando consentimiento:', consentErr);
        }

        onSuccess();
      } else {
        const res = await signIn.email({
          email,
          password,
        });

        if (res.error) {
          setError(res.error.message || 'Credenciales incorrectas.');
          setLoading(false);
          return;
        }

        onSuccess();
      }
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" id="registroBox">
      <div className="modal-card">
        <button
          onClick={onClose}
          className="modal-close-btn"
          title="Cerrar"
        >
          <X size={20} />
        </button>

        <h3 className="modal-title">
          {mode === 'register' ? 'Creá tu cuenta en SENS' : 'Iniciar Sesión'}
        </h3>
        <p className="modal-desc">
          {mode === 'register'
            ? 'Antes de arrancar, te contamos cómo funciona esto: ALBIO es tu interlocutor de bioenergética.'
            : 'Accedé con tus credenciales para continuar tu espacio.'}
        </p>

        {error && (
          <div style={{
            padding: '0.75rem',
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-input"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="form-row-3 form-group">
                <div>
                  <label className="form-label">País</label>
                  <select
                    id="countryDropdown"
                    className="form-select"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="Argentina">Argentina</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Chile">Chile</option>
                    <option value="España">España</option>
                    <option value="México">México</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Año Nac.</label>
                  <input
                    id="birthYearInput"
                    type="number"
                    className="form-input"
                    placeholder="1990"
                    min="1920"
                    max="2020"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Ciudad</label>
                  <input
                    id="cityInput"
                    type="text"
                    className="form-input"
                    placeholder="Tu ciudad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <label className="checkbox-row">
                <input
                  id="chkConsent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>Leí y acepto las condiciones de uso de SENS</span>
              </label>

              <label className="checkbox-row">
                <input
                  id="chkMailing"
                  type="checkbox"
                  checked={mailing}
                  onChange={(e) => setMailing(e.target.checked)}
                />
                <span>Sí, quiero recibir novedades de SENS</span>
              </label>
            </>
          )}

          <button
            id="btnCrearCuenta"
            type="submit"
            className="btn-primary"
            disabled={loading || (mode === 'register' && !consent)}
          >
            {loading
              ? 'Procesando...'
              : mode === 'register'
              ? 'Crear Cuenta'
              : 'Iniciar Sesión'}
          </button>

          <button
            type="button"
            className="btn-secondary-text"
            onClick={() => {
              setMode(mode === 'register' ? 'login' : 'register');
              setError(null);
            }}
          >
            {mode === 'register'
              ? '¿Ya tenés cuenta? Iniciar sesión'
              : '¿No tenés cuenta? Creá tu cuenta gratis'}
          </button>
        </form>
      </div>
    </div>
  );
};
