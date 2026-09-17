'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Message, Conversation, Agent } from '@/lib/types';
import { api } from '@/lib/api';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { AuthModal } from '../modals/AuthModal';
import { useSession } from '@/lib/auth-client';

interface ChatContainerProps {
  conversationId?: string | null;
  onConversationCreated?: (conv: Conversation) => void;
  onTitleUpdated?: (convId: string, newTitle: string) => void;
  onOpenAuth?: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  conversationId,
  onConversationCreated,
  onTitleUpdated,
  onOpenAuth,
}) => {
  const { data: session } = useSession();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Cargar info del agente al montar
  useEffect(() => {
    async function loadAgent() {
      try {
        const agentData = await api.getAgent('albio');
        setAgent(agentData);
      } catch (err) {
        console.error('Error cargando datos del agente:', err);
      }
    }
    loadAgent();
  }, []);

  // Cargar conversación cuando cambia conversationId o el estado de sesión
  useEffect(() => {
    if (!agent) return;

    if (!session?.user) {
      setCurrentConv(null);
      setMessages([
        {
          id: 'initial-greeting',
          role: 'ASSISTANT',
          content: agent.greeting,
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    if (!conversationId) {
      setCurrentConv(null);
      setMessages([
        {
          id: 'initial-greeting',
          role: 'ASSISTANT',
          content: agent.greeting,
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    let isMounted = true;
    async function fetchConversation() {
      setIsLoadingConv(true);
      try {
        const data = await api.getConversation(conversationId!);
        if (!isMounted) return;
        setCurrentConv(data.conversation);
        if (data.conversation.messages && data.conversation.messages.length > 0) {
          setMessages(data.conversation.messages);
        } else {
          setMessages([
            {
              id: 'initial-greeting',
              role: 'ASSISTANT',
              content: agent?.greeting || '¡Hola! ¿En qué puedo ayudarte hoy?',
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Error obteniendo conversación:', err);
      } finally {
        if (isMounted) setIsLoadingConv(false);
      }
    }

    fetchConversation();
    return () => {
      isMounted = false;
    };
  }, [conversationId, session?.user, agent]);

  const handleOpenAuth = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      setShowAuthModal(true);
    }
  };

  // Envío de mensaje
  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return;

    // Si no está autenticado, abrir modal de registro / login
    if (!session?.user) {
      handleOpenAuth();
      return;
    }

    let targetConvId = conversationId;

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      // Si aún no hay conversación activa, crear una
      if (!targetConvId) {
        const createRes = await api.createConversation();
        targetConvId = createRes.conversation.id;
        setCurrentConv(createRes.conversation);
        if (onConversationCreated) {
          onConversationCreated(createRes.conversation);
        }
      }

      const response = await api.sendMessage(targetConvId, text);

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        response.userMessage,
        response.assistantMessage,
      ]);

      if (response.title && onTitleUpdated) {
        onTitleUpdated(targetConvId, response.title);
      }
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

  const isLocked = !session?.user;

  return (
    <div className="chat-page">
      <div className="chat-title-badge">
        <Sparkles size={18} />
        <span>ALBIO - IA</span>
      </div>

      <div className="chat-card">
        <div className="messages-container" id="messagesRepeater">
          {isLoadingConv ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: '#64748b' }}>
              <Loader2 className="animate-spin" size={24} />
              <span>Cargando conversación...</span>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}

          {isSending && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSend={handleSend}
          disabled={isSending || isLoadingConv}
          isLocked={isLocked}
          onOpenRegister={handleOpenAuth}
        />
      </div>

      {/* Modal fallback */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
};
