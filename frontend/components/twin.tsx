'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const TWIN_NAME = 'Hassan Murtaza';
const TWIN_ALIAS = 'Mr.X';
const TWIN_AVATAR = '/ProfilePic.png';

const SUGGESTED_PROMPTS = [
    "What's your background in AI/ML?",
    'Tell me about your RAG experience',
    'What are you working on right now?',
    'How do you deploy AI to production?',
];

function TwinAvatar({ size = 'md', pulse = false }: { size?: 'sm' | 'md' | 'lg'; pulse?: boolean }) {
    const [imgError, setImgError] = useState(false);
    const sizeClasses = {
        sm: 'w-9 h-9 text-sm',
        md: 'w-11 h-11 text-base',
        lg: 'w-24 h-24 text-3xl',
    };

    return (
        <div className={`relative flex-shrink-0 ${sizeClasses[size].split(' ').slice(0, 2).join(' ')}`}>
            {pulse && (
                <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
            )}
            <div
                className={`relative ${sizeClasses[size]} rounded-full overflow-hidden ring-2 ring-emerald-500/40 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-emerald-900/20`}
            >
                {!imgError ? (
                    <img
                        src={TWIN_AVATAR}
                        alt={TWIN_NAME}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center font-semibold text-white">
                        HM
                    </div>
                )}
            </div>
        </div>
    );
}

function formatMessageTime(date: Date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const markdownComponents: Components = {
    h1: ({ children }) => (
        <p className="font-semibold text-emerald-300 text-base mb-2 last:mb-0">{children}</p>
    ),
    h2: ({ children }) => (
        <p className="font-semibold text-white text-[15px] mb-2 mt-3 first:mt-0 last:mb-0">{children}</p>
    ),
    h3: ({ children }) => (
        <p className="font-medium text-slate-100 text-[15px] mb-1.5 mt-2.5 first:mt-0 last:mb-0">{children}</p>
    ),
    h4: ({ children }) => (
        <p className="font-medium text-slate-300 text-sm mb-1 mt-2 first:mt-0 last:mb-0">{children}</p>
    ),
    p: ({ children }) => (
        <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-100">{children}</p>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-white">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="italic text-slate-300">{children}</em>
    ),
    ul: ({ children }) => (
        <ul className="mb-2.5 last:mb-0 space-y-2">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-2.5 last:mb-0 space-y-2 list-decimal list-inside marker:text-emerald-500">{children}</ol>
    ),
    li: ({ children }) => (
        <li className="flex gap-2.5 text-slate-200 leading-relaxed">
            <span className="text-emerald-500 mt-2 flex-shrink-0 text-[8px]">●</span>
            <span className="flex-1 min-w-0 [&>p]:mb-0">{children}</span>
        </li>
    ),
    hr: () => <div className="my-3 border-t border-white/10" aria-hidden />,
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 underline underline-offset-2 decoration-emerald-500/40 hover:text-emerald-300 transition-colors"
        >
            {children}
        </a>
    ),
    code: ({ children }) => (
        <code className="px-1.5 py-0.5 rounded-md bg-slate-700/80 text-emerald-300 text-[13px] font-mono">
            {children}
        </code>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-emerald-500/50 pl-3 my-2 text-slate-300 italic">
            {children}
        </blockquote>
    ),
};

function MessageContent({ content, role }: { content: string; role: Message['role'] }) {
    if (role === 'user') {
        return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
    }

    return (
        <div className="twin-markdown text-[15px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {content}
            </ReactMarkdown>
        </div>
    );
}

export default function Twin() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }, [input]);

    const sendMessage = useCallback(async (text?: string) => {
        const content = (text ?? input).trim();
        if (!content || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    session_id: sessionId || undefined,
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();

            if (!sessionId) {
                setSessionId(data.session_id);
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "Sorry — something went wrong on my end. Mind trying that again?",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [input, isLoading, sessionId]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const showTwinLabel = (index: number) => {
        if (messages[index].role !== 'assistant') return false;
        return index === 0 || messages[index - 1].role !== 'assistant';
    };

    return (
        <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/40">
            {/* Presence header */}
            <div className="relative px-5 py-4 border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30">
                <div className="flex items-center gap-4">
                    <TwinAvatar size="md" pulse={isLoading} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-semibold text-white tracking-tight">
                                {TWIN_NAME}
                            </h2>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                {TWIN_ALIAS}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <p className="text-sm text-slate-400">
                                {isLoading ? 'typing…' : 'Online — here to chat'}
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500/70" />
                        <span>Digital Twin</span>
                    </div>
                </div>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-1 scroll-smooth">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center text-center px-2 pt-4 pb-2 animate-[message-in_0.5s_ease-out]">
                        <TwinAvatar size="lg" />
                        <p className="mt-5 text-xl font-medium text-white">
                            Hey, I&apos;m {TWIN_ALIAS}
                        </p>
                        <p className="mt-2 text-slate-400 max-w-sm leading-relaxed text-sm sm:text-base">
                            I&apos;m Hassan&apos;s digital twin — ask me about AI/ML engineering,
                            RAG systems, production deployments, or my career journey.
                        </p>
                        <div className="mt-6 w-full max-w-md">
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">
                                Start a conversation
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {SUGGESTED_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => sendMessage(prompt)}
                                        disabled={isLoading}
                                        className="text-left text-sm px-3.5 py-2 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-200 transition-all duration-200 disabled:opacity-50"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={message.id}
                        className={`flex gap-2.5 mb-3 animate-[message-in_0.35s_ease-out] ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        {message.role === 'assistant' && (
                            <div className="flex flex-col items-center gap-1 pt-1">
                                {showTwinLabel(index) ? (
                                    <TwinAvatar size="sm" />
                                ) : (
                                    <div className="w-9" />
                                )}
                            </div>
                        )}

                        <div
                            className={`flex flex-col ${
                                message.role === 'user'
                                    ? 'max-w-[82%] sm:max-w-[75%] items-end'
                                    : 'max-w-[92%] sm:max-w-[85%] items-start'
                            }`}
                        >
                            {message.role === 'assistant' && showTwinLabel(index) && (
                                <span className="text-xs text-slate-500 mb-1 ml-1">
                                    {TWIN_ALIAS}
                                </span>
                            )}
                            <div
                                className={`px-4 py-3 rounded-2xl leading-relaxed text-[15px] ${
                                    message.role === 'user'
                                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-br-md shadow-lg shadow-emerald-900/25'
                                        : 'bg-slate-800/90 text-slate-100 border border-white/5 rounded-bl-md'
                                }`}
                            >
                                <MessageContent content={message.content} role={message.role} />
                            </div>
                            <span className="text-[10px] text-slate-600 mt-1 mx-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {formatMessageTime(message.timestamp)}
                            </span>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-2.5 justify-start mb-3 animate-[message-in_0.25s_ease-out]">
                        <div className="pt-1">
                            <TwinAvatar size="sm" pulse />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-slate-500 mb-1 ml-1">{TWIN_ALIAS}</span>
                            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-800/90 border border-white/5">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="px-4 sm:px-5 py-4 border-t border-white/10 bg-slate-900/90">
                <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-slate-800/60 p-2 focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${TWIN_ALIAS}…`}
                        rows={1}
                        className="flex-1 resize-none bg-transparent px-3 py-2 text-[15px] text-white placeholder:text-slate-500 focus:outline-none max-h-[120px]"
                        disabled={isLoading}
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        aria-label="Send message"
                        className="flex-shrink-0 p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-center text-[11px] text-slate-600 mt-2.5">
                    You&apos;re chatting with {TWIN_NAME}&apos;s AI twin — responses reflect his professional background
                </p>
            </div>
        </div>
    );
}
