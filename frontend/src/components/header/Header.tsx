'use client';

import React from 'react';
import { User as UserIcon, LogOut, Menu } from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';

interface HeaderProps {
  onOpenAuth: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  const getShortName = () => {
    if (!session?.user) return '';
    const raw = session.user.name || session.user.email || 'Usuario';
    // Si tiene espacios (ej: Santiago Hubert), usar el primer nombre
    return raw.split(' ')[0] || raw.split('@')[0] || raw;
  };

  return (
    <header className="header">
      <div className="header-left">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="header-menu-btn"
            aria-label={isSidebarOpen ? 'Cerrar barra lateral' : 'Abrir barra lateral'}
            title="Menú"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="header-brand-group">
          <a href="/albio" className="header-brand" title="SENS Desarrollo Humano">
            <img
              src="/sens-logo.jpg"
              alt="SENS Desarrollo Humano"
              className="header-logo-img"
            />
          </a>

          {/* SENS / ALBIO en mobile */}
          <div className="header-mobile-brand">
            <span className="header-brand-sep">/</span>
            <span className="header-brand-albio">ALBIO</span>
          </div>
        </div>
      </div>

      <nav className="header-nav">
        {/* En desktop se muestra como tab, en mobile se oculta porque ALBIO ya está en el grupo de branding a la izquierda */}
        <a href="/albio" className="header-link active header-albio-tag">
          ALBIO Beta
        </a>

        {session?.user ? (
          <div className="header-user-section">
            <span className="header-user-greeting" title={session.user.name || session.user.email}>
              <span className="greeting-prefix">Hola, </span>
              <strong className="greeting-name">{getShortName()}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="btn-auth-header btn-logout-compact"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
              <span className="btn-auth-text-desktop">Salir</span>
            </button>
          </div>
        ) : (
          <button onClick={onOpenAuth} className="btn-auth-header" id="btnLogin">
            <UserIcon size={16} />
            <span className="btn-auth-text">Ingresar</span>
            <span className="btn-auth-text-desktop">Registrarme / Iniciar sesión</span>
          </button>
        )}
      </nav>
    </header>
  );
};
