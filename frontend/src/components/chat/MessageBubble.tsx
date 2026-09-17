'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import { Message } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAgent = message.role === 'ASSISTANT' || message.role === 'SYSTEM';

  return (
    <div className={`message-row ${isAgent ? 'agent' : 'user'}`}>
      <div className={`message-avatar ${isAgent ? 'agent' : 'user'}`}>
        {isAgent ? <Bot size={20} /> : <User size={20} />}
      </div>
      <div className={`bubble ${isAgent ? 'agent' : 'user'}`}>
        {isAgent ? (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        ) : (
          <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
        )}
      </div>
    </div>
  );
};
