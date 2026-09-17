'use client';

import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Folder,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  User as UserIcon,
  LogOut,
  FolderInput,
  Check,
  X,
} from 'lucide-react';
import { ConversationSummary, Project } from '@/lib/types';
import { useSession, signOut } from '@/lib/auth-client';

interface SidebarProps {
  conversations: ConversationSummary[];
  projects: Project[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: (projectId?: string) => void;
  onCreateProject: (name: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onMoveToProject: (conversationId: string, projectId: string | null) => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  projects,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onCreateProject,
  onDeleteConversation,
  onDeleteProject,
  onMoveToProject,
  isOpen,
  onToggle,
  onOpenAuth,
}) => {
  const { data: session } = useSession();

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [movingChatId, setMovingChatId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await onCreateProject(newProjectName.trim());
    setNewProjectName('');
    setShowNewProjectInput(false);
  };

  const handleMoveAction = async (chatId: string, targetProjectId: string | null) => {
    setIsUpdatingProject(true);
    try {
      await onMoveToProject(chatId, targetProjectId);
      if (targetProjectId) {
        setExpandedProjects((prev) => ({ ...prev, [targetProjectId]: true }));
      }
      setMovingChatId(null);
    } catch (err) {
      console.error('Error al mover chat:', err);
    } finally {
      setIsUpdatingProject(false);
    }
  };

  // Chats sueltos (sin proyecto asignado)
  const standaloneConversations = conversations.filter((c) => !c.projectId);

  // Drag and Drop handlers (funciona en desktop)
  const handleDragStart = (e: React.DragEvent, chatId: string) => {
    e.dataTransfer.setData('text/plain', chatId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnProject = async (e: React.DragEvent, projectId: string | null) => {
    e.preventDefault();
    setDragOverProjectId(null);
    const chatId = e.dataTransfer.getData('text/plain');
    if (chatId) {
      await handleMoveAction(chatId, projectId);
    }
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverProjectId !== targetId) {
      setDragOverProjectId(targetId);
    }
  };

  const activeChatToMove = conversations.find((c) => c.id === movingChatId);

  return (
    <>
      {/* Backdrop para mobile/tablet cuando el drawer está desplegado */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Botón flotante para desktop cuando la barra está cerrada */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="sidebar-expand-btn desktop-only"
          title="Abrir barra lateral"
          aria-label="Abrir barra lateral"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      {/* Contenedor principal de la Sidebar / Drawer */}
      <aside className={`sidebar-container ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Barra superior de la sidebar */}
        <div className="sidebar-header">
          <button
            onClick={() => onNewChat()}
            className="btn-new-chat"
            id="btnNewChat"
          >
            <Plus size={18} />
            <span>NUEVO CHAT</span>
          </button>

          <button
            onClick={onToggle}
            className="sidebar-close-btn"
            title="Cerrar barra lateral"
            aria-label="Cerrar barra lateral"
          >
            <PanelLeftClose size={20} className="close-icon-desktop" />
            <X size={22} className="close-icon-mobile" />
          </button>
        </div>

        <div className="sidebar-scrollable">
          {/* SECCIÓN PROYECTOS ALBIO */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">PROYECTOS ALBIO</span>
              <button
                onClick={() => setShowNewProjectInput((prev) => !prev)}
                className="sidebar-icon-btn"
                title="Crear nuevo proyecto"
                aria-label="Crear nuevo proyecto"
              >
                <FolderPlus size={16} />
              </button>
            </div>

            {/* Formulario rápido para nuevo proyecto */}
            {showNewProjectInput && (
              <form onSubmit={handleCreateProjectSubmit} className="new-project-form">
                <input
                  type="text"
                  className="new-project-input"
                  placeholder="Nombre del proyecto..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn-tiny-add">Crear</button>
              </form>
            )}

            {projects.length === 0 ? (
              <div className="sidebar-empty-hint">No hay proyectos creados</div>
            ) : (
              <div className="projects-list">
                {projects.map((project) => {
                  const isExpanded = !!expandedProjects[project.id];
                  const projectChats = conversations.filter((c) => c.projectId === project.id);
                  const isDropTarget = dragOverProjectId === project.id;

                  return (
                    <div
                      key={project.id}
                      className={`project-group ${isDropTarget ? 'drop-target' : ''}`}
                      onDragOver={(e) => handleDragOver(e, project.id)}
                      onDragLeave={() => setDragOverProjectId(null)}
                      onDrop={(e) => handleDropOnProject(e, project.id)}
                    >
                      <div
                        className="project-row"
                        onClick={() => toggleProject(project.id)}
                        title={`Proyecto: ${project.name}`}
                      >
                        <div className="project-info">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <Folder size={16} className="project-folder-icon" />
                          <span className="project-name" title={project.name}>
                            {project.name}
                          </span>
                          <span className="project-count">({projectChats.length})</span>
                        </div>

                        <div className="project-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onNewChat(project.id)}
                            className="sidebar-tiny-btn"
                            title="Crear nuevo chat en este proyecto"
                            aria-label="Crear chat en proyecto"
                          >
                            <Plus size={15} />
                          </button>
                          <button
                            onClick={() => onDeleteProject(project.id)}
                            className="sidebar-tiny-btn text-danger"
                            title="Eliminar proyecto"
                            aria-label="Eliminar proyecto"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Chats dentro del proyecto */}
                      {isExpanded && (
                        <div className="project-chats-list">
                          {projectChats.length === 0 ? (
                            <div className="sidebar-empty-subhint">Sin chats aún</div>
                          ) : (
                            projectChats.map((chat) => (
                              <div
                                key={chat.id}
                                className={`chat-item ${chat.id === activeConversationId ? 'active' : ''}`}
                                onClick={() => onSelectConversation(chat.id)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, chat.id)}
                                title={chat.title || 'Conversación'}
                              >
                                <MessageSquare size={15} className="chat-item-icon" />
                                <span className="chat-item-title" title={chat.title || 'Conversación'}>
                                  {chat.title || 'Conversación'}
                                </span>

                                <div className="chat-item-actions" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => setMovingChatId(chat.id)}
                                    className="chat-action-btn"
                                    title="Mover o cambiar de proyecto"
                                    aria-label="Mover de proyecto"
                                  >
                                    <FolderInput size={15} />
                                  </button>
                                  <button
                                    onClick={() => onDeleteConversation(chat.id)}
                                    className="chat-action-btn text-danger"
                                    title="Eliminar chat"
                                    aria-label="Eliminar chat"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECCIÓN CHATS ALBIO (Sueltos) */}
          <div
            className={`sidebar-section ${dragOverProjectId === 'standalone' ? 'drop-target' : ''}`}
            onDragOver={(e) => handleDragOver(e, 'standalone')}
            onDragLeave={() => setDragOverProjectId(null)}
            onDrop={(e) => handleDropOnProject(e, null)}
          >
            <div className="sidebar-section-header">
              <span className="sidebar-section-title">CHATS ALBIO</span>
            </div>

            {standaloneConversations.length === 0 ? (
              <div className="sidebar-empty-hint">No hay chats sueltos</div>
            ) : (
              <div className="standalone-chats-list">
                {standaloneConversations.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-item ${chat.id === activeConversationId ? 'active' : ''}`}
                    onClick={() => onSelectConversation(chat.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, chat.id)}
                    title={chat.title || 'Conversación'}
                  >
                    <MessageSquare size={15} className="chat-item-icon" />
                    <span className="chat-item-title" title={chat.title || 'Conversación'}>
                      {chat.title || 'Conversación'}
                    </span>

                    <div className="chat-item-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setMovingChatId(chat.id)}
                        className="chat-action-btn"
                        title="Asignar a un proyecto"
                        aria-label="Asignar a proyecto"
                      >
                        <FolderInput size={15} />
                      </button>
                      <button
                        onClick={() => onDeleteConversation(chat.id)}
                        className="chat-action-btn text-danger"
                        title="Eliminar chat"
                        aria-label="Eliminar chat"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal / Selector flotante para mover o asignar chat a un proyecto */}
        {movingChatId && (
          <div className="move-chat-popover-overlay" onClick={() => setMovingChatId(null)}>
            <div className="move-chat-popover" onClick={(e) => e.stopPropagation()}>
              <h4>Asignar proyecto</h4>
              <p className="move-chat-subtitle">
                Chat: <strong>{activeChatToMove?.title || 'Conversación'}</strong>
              </p>

              <div className="move-options">
                <button
                  className={`move-option-btn ${!activeChatToMove?.projectId ? 'selected' : ''}`}
                  disabled={isUpdatingProject}
                  onClick={() => handleMoveAction(movingChatId, null)}
                >
                  <span>📂 Chats Sueltos (Sin proyecto)</span>
                  {!activeChatToMove?.projectId && <Check size={16} className="text-primary" />}
                </button>

                {projects.map((p) => {
                  const isCurrent = activeChatToMove?.projectId === p.id;
                  return (
                    <button
                      key={p.id}
                      className={`move-option-btn ${isCurrent ? 'selected' : ''}`}
                      disabled={isUpdatingProject}
                      onClick={() => handleMoveAction(movingChatId, p.id)}
                    >
                      <span>📁 {p.name}</span>
                      {isCurrent && <Check size={16} className="text-primary" />}
                    </button>
                  );
                })}
              </div>

              <button
                className="btn-cancel-move"
                disabled={isUpdatingProject}
                onClick={() => setMovingChatId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* SECCIÓN MI CUENTA (Abajo) */}
        <div className="sidebar-account">
          {session?.user ? (
            <div className="account-card">
              <div className="account-avatar">
                <UserIcon size={18} />
              </div>
              <div className="account-details">
                <span className="account-name">{session.user.name || 'Mi Cuenta'}</span>
                <span className="account-email">{session.user.email}</span>
              </div>
              <button
                onClick={() => signOut().then(() => window.location.reload())}
                className="account-logout-btn"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn-sidebar-login">
              <UserIcon size={18} />
              <span>MI CUENTA (Iniciar Sesión)</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
