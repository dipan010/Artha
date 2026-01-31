'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Sparkles, TrendingUp, BarChart3, Loader2, Trash2, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatContext {
    currentStock?: {
        symbol: string;
        name: string;
        price?: number;
    };
    watchlist?: string[];
}

interface AIChatAssistantProps {
    context?: ChatContext;
}

const QUICK_ACTIONS = [
    { label: 'Market Summary', icon: TrendingUp, prompt: 'Give me a quick summary of the Indian stock market today' },
    { label: 'Analyze Stock', icon: BarChart3, prompt: 'Analyze the current stock I am viewing' },
    { label: 'Investment Tips', icon: Sparkles, prompt: 'What are some key factors to consider before investing in Indian stocks?' },
];

export default function AIChatAssistant({ context }: AIChatAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent, scrollToBottom]);

    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, isMinimized]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setStreamingContent('');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    context,
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                // Streaming complete
                                break;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.text) {
                                    fullContent += parsed.text;
                                    setStreamingContent(fullContent);
                                }
                            } catch {
                                // Ignore parse errors for partial chunks
                            }
                        }
                    }
                }
            }

            // Add final assistant message
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: fullContent || 'I apologize, but I could not generate a response. Please try again.',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
            setStreamingContent('');
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleQuickAction = (prompt: string) => {
        sendMessage(prompt);
    };

    const clearChat = () => {
        setMessages([]);
        setStreamingContent('');
    };

    const formatMessage = (content: string) => {
        // Simple markdown-like formatting
        return content
            .split('\n')
            .map((line, i) => {
                // Bold text
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Bullet points
                if (line.startsWith('- ') || line.startsWith('• ')) {
                    return `<li key="${i}">${line.slice(2)}</li>`;
                }
                return line;
            })
            .join('<br/>');
    };

    if (!isOpen) {
        return (
            <button
                className="chat-fab"
                onClick={() => setIsOpen(true)}
                aria-label="Open AI Chat"
            >
                <MessageCircle size={24} />
                <span className="chat-fab-pulse" />
            </button>
        );
    }

    return (
        <div className={`chat-widget ${isMinimized ? 'minimized' : ''}`}>
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-info">
                    <Sparkles size={18} className="chat-header-icon" />
                    <span>Artha AI Assistant</span>
                </div>
                <div className="chat-header-actions">
                    {messages.length > 0 && (
                        <button
                            className="chat-header-btn"
                            onClick={clearChat}
                            title="Clear chat"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button
                        className="chat-header-btn"
                        onClick={() => setIsMinimized(!isMinimized)}
                        title={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button
                        className="chat-header-btn"
                        onClick={() => setIsOpen(false)}
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="chat-messages">
                        {messages.length === 0 && !streamingContent && (
                            <div className="chat-welcome">
                                <Sparkles size={32} className="chat-welcome-icon" />
                                <h3>Welcome to Artha AI</h3>
                                <p>I can help you analyze stocks, understand market trends, and answer your investment questions.</p>

                                {context?.currentStock && (
                                    <div className="chat-context-badge">
                                        Viewing: {context.currentStock.name}
                                    </div>
                                )}

                                <div className="chat-quick-actions">
                                    {QUICK_ACTIONS.map((action, index) => (
                                        <button
                                            key={index}
                                            className="chat-quick-action"
                                            onClick={() => handleQuickAction(action.prompt)}
                                        >
                                            <action.icon size={14} />
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`chat-message ${message.role}`}
                            >
                                <div
                                    className="chat-message-content"
                                    dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                                />
                                <span className="chat-message-time">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}

                        {streamingContent && (
                            <div className="chat-message assistant streaming">
                                <div
                                    className="chat-message-content"
                                    dangerouslySetInnerHTML={{ __html: formatMessage(streamingContent) }}
                                />
                                <span className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </span>
                            </div>
                        )}

                        {isLoading && !streamingContent && (
                            <div className="chat-message assistant">
                                <div className="chat-loading">
                                    <Loader2 size={16} className="spin" />
                                    <span>Thinking...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form className="chat-input-form" onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            className="chat-input"
                            placeholder="Ask about stocks, markets, investing..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="chat-send-btn"
                            disabled={!input.trim() || isLoading}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
