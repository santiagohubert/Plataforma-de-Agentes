'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Message, Conversation, Agent } from '@/lib/types';
import { api } from '@/lib/api';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { LimitGateModal } from '../modals/LimitGateModal';
import { AuthModal } from '../modals/AuthModal';
import { useSession } from '@/lib/auth-client';

export const ChatContainer: React.FC = () => {
  const { data: session } = useSession();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageCount, setMessageCount] = useState<number>(0);
  const [isSending, setIsSending] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Modales
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Carga inicial de agente y conversación
  useEffect(() => {
    async function loadData() {
      try {
        const agentData = await api.getAgent('albio');
        setAgent(agentData);

        const convData = await api.getCurrentConversation();
        setConversation(convData.conversation);
        setMessageCount(convData.messageCount);

        if (convData.isAnonymous && convData.messageCount >= 3) {
          setIsLocked(true);
        }

        if (convData.conversation.messages && convData.conversation.messages.length > 0) {
          setMessages(convData.conversation.messages);
        } else {
          // Saludo inicial prefijado de ALBIO
          setMessages([
            {
              id: 'initial-greeting',
              role: 'ASSISTANT',
              content: agentData.greeting,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      }
    }

    loadData();
  }, []);

  // Envío de mensaje
  const handleSend = async (text: string) => {
    if (!text.trim() || isSending || isLocked) return;

    // Si es anónimo y ya alcanzó el límite
    if (!session?.user && messageCount >= 3) {
      setShowLimitModal(true);
      return;
    }

    if (!conversation) return;

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const response = await api.sendMessage(conversation.id, text);

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        response.userMessage,
        response.assistantMessage,
      ]);

      setMessageCount(response.messageCount);

      // Si llegó al límite tras este envío
      if (!session?.user && response.messageCount >= 3) {
        setIsLocked(true);
      }
    } catch (err: any) {
      console.error('Error enviando mensaje:', err);

      if (err.code === 'LIMIT_REACHED' || err.statusCode === 403) {
        // Remover mensaje temporal fallido y mostrar modal
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        setIsLocked(true);
        setShowLimitModal(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'ASSISTANT',
            content: 'Error al conectar con ALBIO. Por favor, probá de nuevo.',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Handler "Ahora no" del modal
  const handleDismissLimit = () => {
    setShowLimitModal(false);
    setIsLocked(true);

    setMessages((prev) => [
      ...prev,
      {
        id: `now-not-${Date.now()}`,
        role: 'ASSISTANT',
        content: 'Cuando quierás retomar, este espacio sigue acá.',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  // Handler tras registro o login exitoso
  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    setShowLimitModal(false);
    setIsLocked(false);

    try {
      const result = await api.resumeConversation();
      if (result.conversation) {
        setConversation(result.conversation);
        setMessages(result.conversation.messages);
      }
    } catch (err) {
      console.error('Error reanudando conversación:', err);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-title-badge">
        <Sparkles size={18} />
        <span>ALBIO - IA</span>
      </div>

      <div className="chat-card">
        <div className="messages-container" id="messagesRepeater">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {isSending && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSend={handleSend}
          disabled={isSending}
          isLocked={isLocked}
          onOpenRegister={() => setShowAuthModal(true)}
        />
      </div>

      {/* Modal Paywall / Límite de 3 mensajes */}
      <LimitGateModal
        isOpen={showLimitModal}
        onRegister={() => {
          setShowLimitModal(false);
          setShowAuthModal(true);
        }}
        onDismiss={handleDismissLimit}
      />

      {/* Modal de Registro / Login con Consentimiento y Demografía */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
