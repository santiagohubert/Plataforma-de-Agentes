'use client';

import React, { useState } from 'react';
import { Header } from '@/components/header/Header';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { AuthModal } from '@/components/modals/AuthModal';

export default function AlbioPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <Header onOpenAuth={() => setShowAuthModal(true)} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ChatContainer />
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          window.location.reload();
        }}
      />
    </>
  );
}
