'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/header/Header';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { AuthModal } from '@/components/modals/AuthModal';
import { useSession } from '@/lib/auth-client';
import { api } from '@/lib/api';
import { ConversationSummary, Project, Conversation } from '@/lib/types';

export default function AlbioPage() {
  const { data: session } = useSession();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Inicializar estado del sidebar según tamaño de pantalla
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  // Cargar lista de proyectos y conversaciones cuando el usuario está autenticado
  const refreshSidebarData = useCallback(async () => {
    if (!session?.user) {
      setConversations([]);
      setProjects([]);
      setActiveConversationId(null);
      return;
    }

    try {
      const [convsRes, projsRes] = await Promise.all([
        api.listConversations(),
        api.listProjects(),
      ]);

      setConversations(convsRes.conversations || []);
      setProjects(projsRes.projects || []);

      if (convsRes.conversations && convsRes.conversations.length > 0) {
        setActiveConversationId((prev) => {
          if (prev && convsRes.conversations.some((c) => c.id === prev)) {
            return prev;
          }
          return convsRes.conversations[0].id;
        });
      } else {
        // Si no tiene conversaciones aún, obtener o crear la actual
        const currentData = await api.getCurrentConversation();
        if (currentData.conversation) {
          setConversations([currentData.conversation]);
          setActiveConversationId(currentData.conversation.id);
        }
      }
    } catch (err) {
      console.error('Error cargando proyectos o conversaciones:', err);
    }
  }, [session?.user]);

  useEffect(() => {
    refreshSidebarData();
  }, [refreshSidebarData]);

  // Manejador para crear un nuevo chat
  const handleNewChat = async (projectId?: string) => {
    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await api.createConversation({ projectId });
      const newConv = res.conversation;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);

      // Auto-cerrar sidebar en mobile al crear nuevo chat
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    } catch (err) {
      console.error('Error creando nueva conversación:', err);
    }
  };

  // Manejador para seleccionar conversación
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    // Auto-cerrar sidebar en mobile al elegir chat
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Manejador para crear nuevo proyecto
  const handleCreateProject = async (name: string) => {
    try {
      const res = await api.createProject(name);
      setProjects((prev) => [...prev, res.project]);
    } catch (err) {
      console.error('Error creando proyecto:', err);
    }
  };

  // Manejador para eliminar proyecto
  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este proyecto? Los chats dentro pasarán a chats sueltos.')) {
      return;
    }

    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setConversations((prev) =>
        prev.map((c) => (c.projectId === id ? { ...c, projectId: null, project: null } : c))
      );
    } catch (err) {
      console.error('Error eliminando proyecto:', err);
    }
  };

  // Manejador para eliminar conversación
  const handleDeleteConversation = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta conversación?')) {
      return;
    }

    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeConversationId === id) {
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Error eliminando conversación:', err);
    }
  };

  // Manejador para mover conversación a proyecto o sacarla a chats sueltos
  const handleMoveToProject = async (conversationId: string, projectId: string | null) => {
    try {
      const res = await api.updateConversation(conversationId, { projectId });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, projectId, project: res.conversation.project || null }
            : c
        )
      );
    } catch (err) {
      console.error('Error moviendo conversación:', err);
      alert('Error al asignar el proyecto. Por favor probá de nuevo.');
    }
  };

  // Cuando el asistente actualiza el título del chat en el primer mensaje
  const handleTitleUpdated = (convId: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
    );
  };

  // Cuando se crea una conversación automáticamente en ChatContainer
  const handleConversationCreated = (conv: Conversation) => {
    setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
    setActiveConversationId(conv.id);
  };

  return (
    <>
      <Header
        onOpenAuth={() => setShowAuthModal(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="app-wrapper">
        <Sidebar
          conversations={conversations}
          projects={projects}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onCreateProject={handleCreateProject}
          onDeleteConversation={handleDeleteConversation}
          onDeleteProject={handleDeleteProject}
          onMoveToProject={handleMoveToProject}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          onOpenAuth={() => setShowAuthModal(true)}
        />

        <main className="main-content">
          <ChatContainer
            conversationId={activeConversationId}
            onConversationCreated={handleConversationCreated}
            onTitleUpdated={handleTitleUpdated}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        </main>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          refreshSidebarData();
        }}
      />
    </>
  );
}
