'use client';

import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-box" id="typingIndicator">
      <span>⏳ Se está elaborando una respuesta...</span>
      <div className="typing-dots">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
};
