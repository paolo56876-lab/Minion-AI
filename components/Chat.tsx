// FIX: Created Chat.tsx component which was missing.
import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToChat, resetChat } from '../services/geminiService';
import { Message } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { SendIcon, UserIcon, BotIcon, TrashIcon, PaperclipIcon, CloseIcon } from './IconComponents';

const LOCAL_STORAGE_KEY = 'minion-ai-chat-history';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages from localStorage on initial render
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        } else {
          setMessages([{ id: 'welcome', sender: 'model', text: 'Hello! I am Minion AI. How can I help you today?' }]);
        }
      } else {
        setMessages([{ id: 'welcome', sender: 'model', text: 'Hello! I am Minion AI. How can I help you today?' }]);
      }
    } catch (error) {
      console.error("Failed to load messages from localStorage", error);
      setMessages([{ id: 'welcome', sender: 'model', text: 'Hello! I am Minion AI. How can I help you today?' }]);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error("Failed to save messages to localStorage", error);
      }
    }
  }, [messages]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        // remove data:image/...;base64,
        setImageBase64(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !imageBase64) return;
    const userMessageText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessageText,
      image: imagePreview,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessageToChat(userMessageText, imageBase64 ?? undefined);
      const modelMessage: Message = {
        id: Date.now().toString() + '-model',
        sender: 'model',
        text: response.text,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
      const errorResponseMessage: Message = {
        id: Date.now().toString() + '-error',
        sender: 'model',
        text: `Sorry, something went wrong: ${errorMessage}`,
      };
      setMessages(prev => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    resetChat();
    setMessages([{
      id: 'welcome-reset',
      sender: 'model',
      text: 'Conversation reset. How can I assist you now?'
    }]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setError(null);
    setInput('');
    setImagePreview(null);
    setImageBase64(null);
  };
  
  return (
    <div className="w-full max-w-3xl h-full flex flex-col bg-gray-800/50 rounded-lg shadow-2xl backdrop-blur-md border border-yellow-400/20">
      <div className="flex justify-between items-center p-4 border-b border-yellow-400/20">
        <h2 className="text-xl font-orbitron font-bold text-yellow-400">Chat with Minion AI</h2>
        <button onClick={handleReset} title="Reset Conversation" className="text-gray-400 hover:text-white transition-colors">
            <TrashIcon />
        </button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center"><BotIcon /></div>}
              <div className={`p-3 rounded-lg max-w-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                {msg.image && <img src={msg.image} alt="User upload" className="rounded-md mb-2 max-h-48" />}
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
              {msg.sender === 'user' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center"><UserIcon /></div>}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center"><BotIcon /></div>
              <div className="p-3 rounded-lg bg-gray-700">
                <LoadingSpinner />
              </div>
            </div>
          )}
          {error && !messages.some(m => m.text.includes('Sorry, something went wrong')) && <p className="text-center text-red-400">{error}</p>}
        </div>
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-yellow-400/20">
        {imagePreview && (
          <div className="relative inline-block mb-2">
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
            <button
              onClick={() => { setImagePreview(null); setImageBase64(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white rounded-full p-0.5"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-yellow-400">
                <PaperclipIcon />
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            placeholder="Type your message..."
            rows={1}
            className="flex-grow bg-transparent focus:outline-none resize-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || (!input.trim() && !imageBase64)}
            className="bg-yellow-400 text-gray-900 rounded-md p-2 disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;