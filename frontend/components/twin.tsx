'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const SUGGESTED_PROMPTS = [
    'What do you do?',
    'Tell me about your RAG work',
    'What are you building right now?',
    'How do you ship AI to production?',
];

function TwinAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const [imgError, setImgError] = useState(false);
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-xl',
    };

    return (
        <div className={`flex-shrink-0 ${sizeClasses[size]} rounded-full overflow-hidden bg-slate-800`}>
            {!imgError ? (
                <img
                    src={TWIN_AVATAR}
                    alt={TWIN_NAME}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center font-medium text-slate-300">
                    HM
                </div>
            )}
        </div>
    );
}

function formatMessageTime(date: Date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const markdownComponents: Components = {
    h1: ({ children }) => (
        <p className="font-medium text-white text-base mb-2 last:mb-0">{children}</p>
    ),
    h2: ({ children }) => (
        <p className="font-medium text-white text-[15px] mb-2 mt-3 first:mt-0 last:mb-0">{children}</p>
    ),
    h3: ({ children }) => (
        <p className="font-medium text-slate-200 text-[15px] mb-1.5 mt-2.5 first:mt-0 last:mb-0">{children}</p>
    ),
    h4: ({ children }) => (
        <p className="font-medium text-slate-300 text-sm mb-1 mt-2 first:mt-0 last:mb-0">{children}</p>
    ),
    p: ({ children }) => (
        <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-200">{children}</p>
    ),
    strong: ({ children }) => (
        <strong className="font-medium text-white">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="italic text-slate-400">{children}</em>
    ),
    ul: ({ children }) => (
        <ul className="mb-2.5 last:mb-0 space-y-1.5">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-2.5 last:mb-0 space-y-1.5 list-decimal list-inside marker:text-slate-500">{children}</ol>
    ),
    li: ({ children }) => (
        <li className="text-slate-300 leading-relaxed [&>p]:mb-0">{children}</li>
    ),
    hr: () => <div className="my-3 border-t border-slate-800" aria-hidden />,
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-200 underline underline-offset-2 hover:text-white transition-colors"
        >
            {children}
        </a>
    ),
    code: ({ children }) => (
        <code className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 text-[13px] font-mono">
            {children}
        </code>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l border-slate-700 pl-3 my-2 text-slate-400">
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
            const response = await fetch(`${API_BASE}/chat`, {
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
            const isNetworkError = error instanceof TypeError;
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: isNetworkError
                        ? "Can't reach the server — make sure the backend is running (uv run server.py) and try again."
                        : "Sorry — something went wrong on my end. Mind trying that again?",
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
        <div className="flex flex-col h-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <TwinAvatar size="md" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-base font-medium text-white">
                                {TWIN_NAME}
                            </h2>
                            <span className="text-sm text-slate-500">{TWIN_ALIAS}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {isLoading ? 'typing…' : 'Virtual Clone'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Conversation */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center text-center px-2 pt-6 pb-2">
                        <TwinAvatar size="lg" />
                        <p className="mt-4 text-base text-white">
                            Hey, I&apos;m {TWIN_ALIAS}
                        </p>
                        <p className="mt-1.5 text-slate-500 max-w-sm text-sm leading-relaxed">
                            Hassan&apos;s virtual clone. Ask about AI/ML, RAG, or production deployments.
                        </p>
                        <div className="mt-5 w-full max-w-md flex flex-wrap justify-center gap-2">
                            {SUGGESTED_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt}
                                    type="button"
                                    onClick={() => sendMessage(prompt)}
                                    disabled={isLoading}
                                    className="text-sm px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors disabled:opacity-50"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={message.id}
                        className={`flex gap-2 mb-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        {message.role === 'assistant' && (
                            <div className="flex flex-col items-center gap-1 pt-1">
                                {showTwinLabel(index) ? (
                                    <TwinAvatar size="sm" />
                                ) : (
                                    <div className="w-8" />
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
                                className={`px-3.5 py-2.5 rounded-xl leading-relaxed text-[15px] ${
                                    message.role === 'user'
                                        ? 'bg-slate-700 text-white'
                                        : 'bg-slate-900 text-slate-200 border border-slate-800'
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
                    <div className="flex gap-2.5 justify-start mb-3">
                        <div className="pt-1">
                            <TwinAvatar size="sm" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-slate-500 mb-1 ml-1">{TWIN_ALIAS}</span>
                            <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="px-4 py-3 border-t border-slate-800 shrink-0">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                    className="flex items-end gap-2 rounded-lg border border-slate-800 bg-slate-900 p-1.5 focus-within:border-slate-700 transition-colors"
                >
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${TWIN_ALIAS}…`}
                        rows={1}
                        className="flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] text-white placeholder:text-slate-600 focus:outline-none max-h-[120px]"
                        disabled={isLoading}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        aria-label="Send message"
                        className="flex-shrink-0 p-2 rounded-md bg-slate-200 text-slate-950 hover:bg-white focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
                <p className="text-center text-[11px] text-slate-600 mt-2">
                    Virtual clone · responses reflect {TWIN_NAME}&apos;s background
                </p>
            </div>
        </div>
    );
}
