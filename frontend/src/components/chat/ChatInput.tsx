'use client';

import React, { useState, KeyboardEvent, useRef } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim() || disabled || isLocked) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  return (
    <div className="chat-footer">
      {isLocked ? (
        <button
          onClick={onOpenRegister}
          className="btn-locked-banner"
          id="btnLoginLater"
        >
          <Lock size={16} />
          <span>Registrate para continuar con ALBIO ↓</span>
        </button>
      ) : null}

      <div className="chat-input-row">
        <textarea
          ref={textareaRef}
          id="userInput"
          rows={1}
          className="chat-input-field"
          placeholder={
            isLocked
              ? 'Registrate para continuar con ALBIO...'
              : 'Preguntá lo que necesitás...'
          }
          value={text}
          onChange={handleChange}
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
          aria-label="Enviar mensaje"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
};
