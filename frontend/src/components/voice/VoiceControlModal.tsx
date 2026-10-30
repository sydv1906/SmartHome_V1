'use client';

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, Sparkles, Volume2, X } from 'lucide-react';
import { fetchApi } from '@/services/api';

interface VoiceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshDevices: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionAlternativeLike>>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const initialMessage: ChatMessage = {
  role: 'assistant',
  content: 'Hi! I can check your home status or control a device. What would you like me to do?',
};

export const VoiceControlModal: React.FC<VoiceControlModalProps> = ({
  isOpen,
  onClose,
  onRefreshDevices,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    setVoiceAvailable(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setListening(false);
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    }
  }, [isOpen]);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || loading) return;

    const nextMessages = [...messages, { role: 'user' as const, content: message }];
    setMessages(nextMessages);
    setDraft('');
    setError('');
    setLoading(true);

    try {
      const result = await fetchApi<{ success: boolean; reply: string }>('/ai/assistant', {
        method: 'POST',
        body: JSON.stringify({
          message,
          history: nextMessages.slice(-8, -1).map(({ role, content }) => ({ role, content })),
        }),
      });
      const reply = result.reply || 'I received the request but could not form a response.';
      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
      if (/relay command|app state for/i.test(reply)) onRefreshDevices();
      speak(reply);
    } catch (requestError: any) {
      setError(requestError.message || 'The assistant could not process that request.');
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition || listening) return;

    const recognition = new Recognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setDraft((current) => `${current}${current ? ' ' : ''}${transcript}`);
    };
    recognition.onerror = () => {
      setError('Microphone input failed. Check browser microphone permission or type your request.');
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setError('');
    setListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setError('Could not start microphone input. Check browser microphone permission or type your request.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        className="w-full max-w-lg h-[min(680px,92vh)] flex flex-col glass-panel-glow rounded-2xl border border-cyan-500/40 shadow-2xl overflow-hidden"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-neonCyan" />
            <div>
              <h2 id="assistant-title" className="text-sm font-bold text-white">SmartHome Assistant</h2>
              <p className="text-[11px] text-gray-400">Home status and device control</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close assistant" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-sm'
                  : 'bg-gray-900 border border-gray-800 text-gray-100 rounded-bl-sm'
              }`}>
                {message.content}
              </p>
            </div>
          ))}
          {loading && <p className="text-xs text-gray-400 animate-pulse">Thinking...</p>}
          <div ref={messagesEndRef} />
        </div>

        {error && <p role="alert" className="px-4 pb-2 text-xs text-rose-300">{error}</p>}

        <form onSubmit={handleSend} className="p-3 border-t border-gray-800">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={1000}
              rows={2}
              placeholder="Ask about your home or control a device..."
              aria-label="Message the SmartHome assistant"
              className="min-w-0 flex-1 resize-none rounded-xl bg-gray-900 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
            <div className="flex gap-1.5">
              {voiceAvailable && (
                <button
                  type="button"
                  onClick={listening ? () => recognitionRef.current?.stop() : startListening}
                  aria-label={listening ? 'Stop listening' : 'Dictate a message'}
                  title={listening ? 'Stop listening' : 'Dictate a message'}
                  className={`h-10 w-10 flex items-center justify-center rounded-xl border ${listening ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-gray-800 border-gray-700 text-cyan-300 hover:bg-gray-700'}`}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <button
                type="submit"
                disabled={!draft.trim() || loading}
                aria-label="Send message"
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => speaking ? window.speechSynthesis.cancel() : speak(messages[messages.length - 1].content)}
                disabled={!('speechSynthesis' in window)}
                aria-label={speaking ? 'Stop speaking' : 'Speak latest reply'}
                title={speaking ? 'Stop speaking' : 'Speak latest reply'}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-800 border border-gray-700 text-cyan-300 hover:bg-gray-700 disabled:opacity-40"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {!voiceAvailable && <p className="pt-2 text-[11px] text-gray-500">Voice input is not available in this browser. You can still type requests.</p>}
        </form>
      </section>
    </div>
  );
};