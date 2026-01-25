
import React, { useState, useEffect, useRef } from 'react';
// Added missing MessageSquare import
import { Send, Bot, User, Loader2, Scale, MessageSquare } from 'lucide-react';
import { Chat, ChatMessage } from '../types';
import api from '../services/api';

interface ChatWindowProps {
  chat: Chat | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!chat) {
        setMessages([]);
        return;
      }
      try {
        const response = await api.get<ChatMessage[]>(`/api/chats/${chat.id}/history/`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching chat history', error);
      }
    };
    fetchHistory();
  }, [chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chat || isLoading) return;

    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post<{ answer: string }>('/api/chat/', {
        question: currentInput,
        chat_id: chat.id,
      });

      const newMessage: ChatMessage = {
        id: Date.now(),
        question: currentInput,
        answer: response.data.answer,
        timestamp: new Date().toISOString(),
        chat: chat.id,
      };
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Chat error', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <Scale size={32} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pravni Asistent</h2>
        <p className="text-gray-500 max-w-md">
          Izaberite folder, a zatim specifičan razgovor da biste započeli konsultaciju, ili kreirajte novi čet klikom na "+" pored foldera.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full relative">
      <header className="h-14 border-b flex items-center px-6 sticky top-0 bg-white/80 backdrop-blur-md z-10 justify-between">
        <div className="flex items-center gap-2">
          {/* Fix: MessageSquare is now imported and can be used here */}
          <MessageSquare size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-800">{chat.name}</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Bot size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm italic">Započnite razgovor slanjem poruke ispod.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-6">
            <div className="flex gap-4 max-w-3xl mx-auto px-4">
              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center shrink-0">
                <User size={18} className="text-gray-600" />
              </div>
              <div className="flex-1 text-gray-800 text-sm leading-relaxed">
                <p className="font-bold text-[10px] text-gray-400 uppercase mb-1">Vi</p>
                {msg.question}
              </div>
            </div>

            <div className="bg-gray-50 -mx-4 px-4 py-8 border-y border-gray-100/50">
              <div className="flex gap-4 max-w-3xl mx-auto px-4">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-200">
                  <Bot size={18} className="text-white" />
                </div>
                <div className="flex-1 text-gray-800 text-sm leading-relaxed">
                  <p className="font-bold text-[10px] text-blue-500 uppercase mb-1">Pravni Asistent</p>
                  <div className="whitespace-pre-wrap">{msg.answer}</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="bg-gray-50 -mx-4 px-4 py-8">
            <div className="flex gap-4 max-w-3xl mx-auto px-4">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shrink-0">
                <Bot size={18} className="text-white" />
              </div>
              <div className="flex items-center gap-2 text-gray-400 italic text-sm">
                <Loader2 size={16} className="animate-spin" />
                Analiziram zakone...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-6 bg-gradient-to-t from-white via-white to-transparent">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative group">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Vaše pravno pitanje..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-5 pr-14 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 shadow-sm transition-all resize-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-2.5 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all active:scale-95"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-4">
          Veštačka inteligencija može pružiti netačne informacije. Konsultujte advokata za zvanične savete.
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;
