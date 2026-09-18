import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send, Bot, User, X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { sendChatMessageApi } from '../../interview/services/interview.api';
import { ResumeContext } from '../resume.context';
import '../style/resume-bot.scss';

export const ResumeBotModal = ({ isOpen, onClose }) => {
    const { resetResumeData } = useContext(ResumeContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Initiate the resume builder conversation
            startBuilder();
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const startBuilder = async () => {
        setLoading(true);
        try {
            const data = await sendChatMessageApi({ message: '/build' });
            if (data) {
                setConversationId(data.conversationId || data.conversation_id);
                setMessages([
                    {
                        role: 'assistant',
                        content: data.answer,
                        actions: data.actions || [],
                    },
                ]);
            }
        } catch (err) {
            setMessages([
                {
                    role: 'assistant',
                    content: "👋 *Welcome to the PrepNex AI Resume Builder!*\n\nReady to build your resume step-by-step?",
                    actions: [
                        { type: 'button', label: "Yes, let's begin!", value: "Yes, let's begin!" },
                        { type: 'button', label: "Not now", value: "Not now" },
                    ],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (textToSend) => {
        const text = textToSend || input;
        if (!text.trim() || loading) return;

        // Append user message
        const newMessages = [
            ...messages,
            { role: 'user', content: text },
        ];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const data = await sendChatMessageApi({
                message: text,
                conversationId,
            });

            if (data) {
                if (data.conversationId || data.conversation_id) {
                    setConversationId(data.conversationId || data.conversation_id);
                }

                setMessages([
                    ...newMessages,
                    {
                        role: 'assistant',
                        content: data.answer,
                        actions: data.actions || [],
                    },
                ]);
            }
        } catch (err) {
            setMessages([
                ...newMessages,
                {
                    role: 'assistant',
                    content: '⚠️ Oops, something went wrong. Please try again.',
                    actions: [{ type: 'button', label: 'Retry', value: text }],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyToEditor = () => {
        // Extract basic data from the conversation history if available
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="resume-bot-overlay" id="resume-bot-modal">
            <div className="resume-bot-card glass-card">
                {/* Header */}
                <div className="resume-bot-header">
                    <div className="bot-info">
                        <div className="bot-avatar-badge">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="bot-title">AI Resume Builder Bot</h3>
                            <p className="bot-subtitle">Q&A Resume Generator</p>
                        </div>
                    </div>
                    <button className="bot-close-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="resume-bot-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message-row ${msg.role}`}>
                            <div className="chat-avatar">
                                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                            </div>
                            <div className="chat-bubble">
                                <div className="bubble-content" style={{ whiteSpace: 'pre-line' }}>
                                    {msg.content}
                                </div>

                                {/* Interactive Quick Reply Chips */}
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className="quick-reply-chips">
                                        {msg.actions.map((act, actIdx) => (
                                            <button
                                                key={actIdx}
                                                className="quick-chip-btn"
                                                onClick={() => handleSend(act.value)}
                                                disabled={loading}
                                            >
                                                <Sparkles size={13} className="chip-icon" />
                                                {act.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="chat-message-row assistant">
                            <div className="chat-avatar">
                                <Bot size={16} />
                            </div>
                            <div className="chat-bubble typing-bubble">
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form
                    className="resume-bot-input-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                >
                    <input
                        type="text"
                        placeholder="Type your response, or pick a chip above..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        className="resume-bot-input"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="resume-bot-send-btn"
                        disabled={!input.trim() || loading}
                        aria-label="Send"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResumeBotModal;
