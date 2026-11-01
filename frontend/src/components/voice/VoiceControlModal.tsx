'use client';

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Keyboard, LoaderCircle, Mic, MicOff, Send, Sparkles, Volume2, X } from 'lucide-react';
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

interface SpeechRecognitionErrorLike {
  error?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type AssistantPhase = 'ready' | 'listening' | 'thinking' | 'speaking' | 'error';

const phaseLabels: Record<AssistantPhase, string> = {
  ready: 'Ready when you are',
  listening: 'I’m listening',
  thinking: 'Working on it',
  speaking: 'Here’s what I found',
  error: 'I need a moment',
};

export const VoiceControlModal: React.FC<VoiceControlModalProps> = ({
  isOpen,
  onClose,
  onRefreshDevices,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [phase, setPhase] = useState<AssistantPhase>('ready');
  const [lastHeard, setLastHeard] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [showTextEntry, setShowTextEntry] = useState(false);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const autoListenRef = useRef(false);
  const sessionStartedRef = useRef(false);
  const phaseRef = useRef<AssistantPhase>('ready');
  const startListeningRef = useRef<() => void>(() => {});
  const speakRef = useRef<(text: string) => void>(() => {});
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const updatePhase = (nextPhase: AssistantPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  };

  const addMessage = (message: ChatMessage) => {
    messagesRef.current = [...messagesRef.current, message];
    setMessages(messagesRef.current);
  };

  const startListening = () => {
    if (recognitionRef.current) return;

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Voice input is not available in this browser. You can type a command instead.');
      updatePhase('error');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript.trim();
      if (!transcript) return;
      setLastHeard(transcript);
      void sendCommand(transcript);
    };
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        updatePhase('ready');
        return;
      }

      setError(
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Microphone access is blocked. Allow microphone access in your browser, or type a command.'
          : 'I couldn’t access the microphone. Check its connection or type a command.'
      );
      updatePhase('error');
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (phaseRef.current === 'listening') updatePhase('ready');
    };

    recognitionRef.current = recognition;
    setError('');
    updatePhase('listening');
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setError('Could not start the microphone. Check browser permissions, then try again.');
      updatePhase('error');
    }
  };

  const scheduleListening = () => {
    if (!autoListenRef.current) return;
    window.setTimeout(() => {
      if (autoListenRef.current) startListeningRef.current();
    }, 350);
  };
  startListeningRef.current = startListening;

  const speak = (text: string) => {
    recognitionRef.current?.stop();
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      updatePhase('ready');
      scheduleListening();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {
      setSpeaking(true);
      updatePhase('speaking');
    };
    utterance.onend = () => {
      setSpeaking(false);
      updatePhase('ready');
      scheduleListening();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      updatePhase('ready');
      scheduleListening();
    };
    window.speechSynthesis.speak(utterance);
  };
  speakRef.current = speak;

  const sendCommand = async (command: string) => {
    const message = command.trim();
    if (!message || phaseRef.current === 'thinking') return;

    addMessage({ role: 'user', content: message });
    setError('');
    updatePhase('thinking');
    recognitionRef.current?.stop();

    try {
      const history = messagesRef.current.slice(-9, -1);
      const result = await fetchApi<{
        success: boolean;
        reply: string;
        deviceId?: string;
      }>('/ai/assistant', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      });
      const reply = result.reply || 'I received that, but could not form a response.';
      if (result.deviceId) onRefreshDevices();
      if (!isOpenRef.current) return;
      addMessage({ role: 'assistant', content: reply });
      speak(reply);
    } catch (requestError) {
      if (!isOpenRef.current) return;
      const message = requestError instanceof Error
        ? requestError.message
        : 'The assistant could not process that request.';
      setError(message);
      updatePhase('error');
      addMessage({ role: 'assistant', content: 'I couldn’t complete that request. Please try again.' });
    }
  };

  const toggleListening = () => {
    if (phaseRef.current === 'listening') {
      autoListenRef.current = false;
      recognitionRef.current?.stop();
      updatePhase('ready');
      return;
    }

    if (phaseRef.current === 'speaking') {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    }
    autoListenRef.current = true;
    startListeningRef.current();
  };

  const handleTextSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || phaseRef.current === 'thinking') return;
    const command = draft.trim();
    setDraft('');
    void sendCommand(command);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    setVoiceAvailable(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (sessionStartedRef.current) return;
      sessionStartedRef.current = true;

      const hour = new Date().getHours();
      const timeGreeting = hour < 12
        ? 'Good morning'
        : hour < 17
          ? 'Good afternoon'
          : hour < 21
            ? 'Good evening'
            : 'Hello';
      const welcome: ChatMessage = {
        role: 'assistant',
        content: `${timeGreeting}! I’m your SmartHome AI assistant. I can answer questions and share live insights about your home and energy use. What would you like to know?`,
      };

      messagesRef.current = [welcome];
      setMessages([welcome]);
      setDraft('');
      setLastHeard('');
      setError('');
      setShowTextEntry(false);
      setSpeaking(false);
      autoListenRef.current = voiceAvailable;
      window.speechSynthesis?.cancel();
      updatePhase('ready');
      speakRef.current(welcome.content);
      return;
    }

    sessionStartedRef.current = false;
    autoListenRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    updatePhase('ready');
  }, [isOpen, voiceAvailable]);

  useEffect(() => {
    if (!isOpen) return;
    return () => {
      autoListenRef.current = false;
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const latestReply = [...messages].reverse().find((message) => message.role === 'assistant')?.content;
  const previousMessages = messages.slice(1, -2);
  const phaseHint: Record<AssistantPhase, string> = {
    ready: voiceAvailable
      ? 'Ask about your home, or tell me to switch a device on or off.'
      : 'Voice input is not supported here. You can still type a command.',
    listening: 'Go ahead. I’ll take it from here.',
    thinking: 'Checking your home and carrying out your request.',
    speaking: 'You can interrupt me any time.',
    error: 'Try the microphone again or use text input.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        className="glass-panel-glow relative flex h-[min(700px,92vh)] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-gray-800 shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 id="assistant-title" className="text-sm font-bold text-white">SmartHome Assistant</h2>
              <p className="text-[11px] text-gray-400">Voice control · Home insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close assistant"
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-6 text-center">
          <div className={`assistant-orb assistant-orb-${phase} my-auto`}>
            <div className="assistant-orb-halo" />
            <button
              type="button"
              onClick={toggleListening}
              disabled={phase === 'thinking'}
              aria-label={phase === 'listening' ? 'Stop listening' : 'Start listening'}
              className="assistant-orb-core relative z-10 flex h-24 w-24 items-center justify-center rounded-full text-white transition-transform hover:scale-105 disabled:cursor-wait"
            >
              {phase === 'thinking'
                ? <LoaderCircle className="h-9 w-9 animate-spin" />
                : phase === 'listening'
                  ? <MicOff className="h-9 w-9" />
                  : <Mic className="h-9 w-9" />}
            </button>
          </div>

          <div className="mt-5 space-y-1">
            <p className="text-base font-semibold text-white" aria-live="polite">{phaseLabels[phase]}</p>
            <p className="max-w-xs text-xs leading-relaxed text-gray-400">{phaseHint[phase]}</p>
          </div>

          {previousMessages.length > 0 && (
            <div className="mt-6 max-h-36 w-full space-y-2 overflow-y-auto pr-1 text-left">
              {previousMessages.map((message, index) => (
                <div
                  key={`history-${index}`}
                  className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    message.role === 'user'
                      ? 'ml-8 bg-gray-800 text-gray-200'
                      : 'mr-8 border border-gray-800 bg-gray-900/50 text-gray-400'
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
          )}

          {lastHeard && (
            <div className="mt-6 w-full rounded-2xl border border-gray-800 bg-gray-900/60 p-3 text-left">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">I heard</p>
              <p className="text-sm text-gray-200">{lastHeard}</p>
            </div>
          )}

          {latestReply && (
            <div className="mt-3 w-full rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-3 text-left">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-300">
                <Sparkles className="h-3 w-3" />
                Assistant
              </p>
              <p className="text-sm leading-relaxed text-gray-200">{latestReply}</p>
            </div>
          )}

          {!lastHeard && (
            <p className="mt-6 text-[11px] text-gray-500">
              Try asking for your home status or switching a device on or off.
            </p>
          )}
        </div>

        {error && <p role="alert" className="px-5 pb-2 text-center text-xs text-rose-500">{error}</p>}

        <footer className="border-t border-gray-800 px-4 py-3">
          {showTextEntry ? (
            <form onSubmit={handleTextSubmit} className="flex items-end gap-2">
              <textarea
                autoFocus
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
                placeholder="Type a command..."
                aria-label="Type a command for the SmartHome assistant"
                className="min-w-0 flex-1 resize-none rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim() || phase === 'thinking'}
                aria-label="Send command"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowTextEntry(false)}
                aria-label="Close text input"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                <Mic className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  autoListenRef.current = false;
                  recognitionRef.current?.stop();
                  updatePhase('ready');
                  setShowTextEntry(true);
                }}
                className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
              >
                <Keyboard className="h-4 w-4" />
                Type instead
              </button>
              <div className="flex items-center gap-2">
                {speaking && (
                  <span className="assistant-wave flex h-8 items-center gap-0.5" aria-label="Assistant is speaking">
                    <span /><span /><span /><span /><span />
                  </span>
                )}
                {latestReply && 'speechSynthesis' in window && (
                  <button
                    type="button"
                    onClick={() => speaking
                      ? window.speechSynthesis.cancel()
                      : speak(latestReply)}
                    aria-label={speaking ? 'Stop speaking' : 'Repeat assistant reply'}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-cyan-500 transition-colors hover:bg-gray-700"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
                {!voiceAvailable && (
                  <button
                    type="button"
                    onClick={() => setShowTextEntry(true)}
                    className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Type a command
                  </button>
                )}
              </div>
            </div>
          )}
        </footer>
      </section>
    </div>
  );
};
