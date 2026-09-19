import React from 'react';
import { SendIcon } from '@/components/icons';
import * as styles from './AdminMessages.styles';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: (e: React.FormEvent, ref: React.RefObject<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  scrollToBottom: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  handleSendMessage,
  textareaRef,
  scrollToBottom,
}) => {
  return (
    <div style={styles.chatInputAreaStyle}>
      <form onSubmit={(e) => handleSendMessage(e, textareaRef)} style={styles.chatInputFormStyle}>
        <textarea
          ref={textareaRef}
          style={{
            ...styles.textareaInputStyle,
            maxHeight: '120px',
            overflowY: 'auto',
          }}
          rows={1}
          placeholder="Type your response..."
          value={inputText}
          onFocus={() => setTimeout(scrollToBottom, 200)}
          onChange={(e) => {
            setInputText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          required
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            opacity: !inputText.trim() ? 0.3 : 1,
            backgroundColor: inputText.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.12)',
            color: inputText.trim() ? '#000000' : '#ffffff',
            cursor: !inputText.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};
