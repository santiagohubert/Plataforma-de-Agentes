'use client';

import React, { useState, KeyboardEvent } from 'react';
import { ChevronRight, Lock } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isLocked?: boolean;
  onOpenRegister: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  isLocked = false,
  onOpenRegister,
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled || isLocked) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-footer">
      {isLocked ? (
        <button
          onClick={onOpenRegister}
          className="btn-locked-banner"
          id="btnLoginLater"
        >
          <Lock size={18} />
          <span>Registrate para continuar con ALBIO ↓</span>
        </button>
      ) : null}

      <div className="chat-input-row">
        <input
          id="userInput"
          type="text"
          className="chat-input-field"
          placeholder={
            isLocked
              ? 'Registrate para continuar con ALBIO ↓'
              : 'Preguntá lo que necesitás...'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLocked}
          autoComplete="off"
        />
        <button
          id="sendBtn"
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!text.trim() || disabled || isLocked}
          title="Enviar mensaje"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
};
