'use client';

import React from 'react';
import { User as UserIcon, LogOut } from 'lucide-react';
import { useSession, signOut } from '@/lib/auth-client';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <header className="header">
      <a href="/albio" className="header-brand">
        <img
          src="/sens-logo.jpg"
          alt="SENS Desarrollo Humano"
          style={{ height: '44px', objectFit: 'contain' }}
        />
      </a>

      <nav className="header-nav">
        <a href="/albio" className="header-link active">ALBIO Beta</a>

        {session?.user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#009688' }}>
              Hola, {session.user.name || session.user.email}
            </span>
            <button
              onClick={handleLogout}
              className="btn-auth-header"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          </div>
        ) : (
          <button onClick={onOpenAuth} className="btn-auth-header" id="btnLogin">
            <UserIcon size={16} />
            <span>Registrarme / Iniciar sesión</span>
          </button>
        )}
      </nav>
    </header>
  );
};
