'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Message, Conversation, Agent } from '@/lib/types';
import { api } from '@/lib/api';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { AuthModal } from '../modals/AuthModal';
import { useSession } from '@/lib/auth-client';

export const ChatContainer: React.FC = () => {
  const { data: session } = useSession();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Cargar datos de agente y conversación
  useEffect(() => {
    async function loadData() {
      try {
        const agentData = await api.getAgent('albio');
        setAgent(agentData);

        if (session?.user) {
          // Usuario autenticado: cargar su conversación activa y todo su historial
          const convData = await api.getCurrentConversation();
          if (convData.conversation) {
            setConversation(convData.conversation);
            if (convData.conversation.messages && convData.conversation.messages.length > 0) {
              setMessages(convData.conversation.messages);
            } else {
              setMessages([
                {
                  id: 'initial-greeting',
                  role: 'ASSISTANT',
                  content: agentData.greeting,
                  createdAt: new Date().toISOString(),
                },
              ]);
            }
          }
        } else {
          // Usuario no autenticado: mostrar saludo de presentación de ALBIO
          setConversation(null);
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
        console.error('Error cargando datos:', err);
      }
    }

    loadData();
  }, [session?.user]);

  // Envío de mensaje
  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return;

    // Si no está autenticado, abrir modal de registro / login
    if (!session?.user) {
      setShowAuthModal(true);
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
    } catch (err: any) {
      console.error('Error enviando mensaje:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'ASSISTANT',
          content: 'Error al conectar con ALBIO. Por favor, probá de nuevo.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Handler tras registro o login exitoso
  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    // Recargar conversación del usuario
    try {
      const convData = await api.getCurrentConversation();
      if (convData.conversation) {
        setConversation(convData.conversation);
        if (convData.conversation.messages && convData.conversation.messages.length > 0) {
          setMessages(convData.conversation.messages);
        }
      }
    } catch (err) {
      console.error('Error cargando conversación post-auth:', err);
    }
  };

  const isLocked = !session?.user;

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

      {/* Modal de Registro / Login */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};
