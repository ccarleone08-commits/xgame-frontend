import React, { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import "./Chat.css";
import { useAppContext } from "../../context/AppContext";

const SUPPORT_CATEGORY_DEFAULT = "1";
const SUPPORT_PRIORITY_DEFAULT = 1;

const getLocale = (language) => {
    switch (language) {
        case "tr":
            return "tr-TR";
        case "hi":
            return "hi-IN";
        case "ar":
            return "ar";
        case "ru":
            return "ru-RU";
        case "uz":
            return "uz-UZ";
        case "en":
        default:
            return "en-US";
    }
};

const formatMessageTime = (language) =>
    new Date().toLocaleTimeString(getLocale(language), {
        hour: "2-digit",
        minute: "2-digit",
    });

const createLocalMessage = (sender, text, language) => ({
    id: `${Date.now()}-${Math.random()}`,
    text,
    sender,
    time: formatMessageTime(language),
});

const cleanAuthToken = (value) => {
    const nextValue = String(value || "").trim();
    return nextValue.endsWith(".") ? nextValue.slice(0, -1) : nextValue;
};

const getCookieValue = (name) => {
    if (typeof document === "undefined") return "";

    const rawValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`))
        ?.split("=")[1];

    return rawValue ? cleanAuthToken(decodeURIComponent(rawValue)) : "";
};

const getSupportAuthToken = (contextToken) =>
    cleanAuthToken(contextToken) ||
    cleanAuthToken(localStorage.getItem("token")) ||
    getCookieValue("AuthToken") ||
    getCookieValue("token");

const parseJwtPayload = (authToken) => {
    if (!authToken) return null;

    try {
        const payload = authToken.split(".")[1];
        if (!payload) return null;

        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
};

const getUserId = (user, authToken) => {
    const directId = user?.id ?? user?.userId ?? user?.nameIdentifier;
    if (directId) return Number(directId);

    const payload = parseJwtPayload(authToken);
    return Number(payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || 0);
};

const normalizeSupportMessage = (item = {}) => ({
    id: item.id ?? item.messageId ?? `${item.sentAt || item.createdAt || Date.now()}-${Math.random()}`,
    ticketId: item.ticketId ?? item.supportTicketId ?? null,
    senderId: item.senderId ?? item.userId ?? item.senderUserId ?? null,
    senderName: item.senderName || item.sender || item.userName || "Support",
    content: item.content || item.message || item.text || "",
    sentAt: item.sentAt || item.createdAt || item.createDate || item.timestamp || null,
});

const getUserName = (user) =>
    user?.username || user?.userName || user?.fullName || user?.name || "";

const getUserEmail = (user) => user?.email || "";

export default function Chat() {
    const {
        t,
        user,
        token,
        language,
        createSupportTicket,
        fetchMySupportTickets,
        fetchSupportTicket,
        supportHubUrl,
    } = useAppContext();

    const faqItems = [
        {
            id: "deposit",
            question: t("support_faq_q_deposit"),
            response: t("support_faq_a_deposit"),
        },
        {
            id: "withdraw",
            question: t("support_faq_q_withdraw"),
            response: t("support_faq_a_withdraw"),
        },
        {
            id: "game_issue",
            question: t("support_faq_q_game_problem"),
            response: t("support_faq_a_game_problem"),
        },
        {
            id: "bonus_issue",
            question: t("support_faq_q_bonus_missing"),
            response: t("support_faq_a_bonus_missing"),
        },
        {
            id: "transaction_pending",
            question: t("support_faq_q_transaction_pending"),
            response: t("support_faq_a_transaction_pending"),
        },
    ];

    const supportCategories = [
        { id: 1, label: t("support_category_payments") },
        { id: 2, label: t("support_category_gameplay") },
        { id: 3, label: t("support_category_profile") },
        { id: 4, label: t("support_category_authentication") },
        { id: 5, label: t("support_category_chat") },
        { id: 6, label: t("support_category_connection") },
        { id: 7, label: t("support_category_wallet") },
        { id: 8, label: t("support_category_ranking") },
        { id: 9, label: t("support_category_notifications") },
        { id: 10, label: t("support_category_mobile") },
        { id: 11, label: t("support_category_bonuses") },
        { id: 12, label: t("support_category_settings") },
        { id: 13, label: t("support_category_audio") },
        { id: 14, label: t("support_category_other") },
    ];

    const messagesEndRef = useRef(null);
    const faqReplyTimeoutRef = useRef(null);
    const selectedSupportTicketIdRef = useRef(null);
    const supportConnectionRef = useRef(null);

    const [chatMode, setChatMode] = useState("faq");
    const [faqMessages, setFaqMessages] = useState(() => [
        createLocalMessage("admin", t("support_faq_welcome"), language),
    ]);
    const [faqResponseCount, setFaqResponseCount] = useState(0);
    const [isFaqTyping, setIsFaqTyping] = useState(false);

    const [supportForm, setSupportForm] = useState({
        fullName: getUserName(user),
        email: getUserEmail(user),
        category: SUPPORT_CATEGORY_DEFAULT,
        subject: "",
        message: "",
    });
    const [supportTickets, setSupportTickets] = useState([]);
    const [isSupportTicketsLoading, setIsSupportTicketsLoading] = useState(false);
    const [supportTicketsError, setSupportTicketsError] = useState("");
    const [supportSubmitError, setSupportSubmitError] = useState("");
    const [supportSubmitSuccess, setSupportSubmitSuccess] = useState("");
    const [isSupportSubmitting, setIsSupportSubmitting] = useState(false);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [selectedSupportTicket, setSelectedSupportTicket] = useState(null);
    const [selectedSupportTicketId, setSelectedSupportTicketId] = useState(null);
    const [isSelectedTicketLoading, setIsSelectedTicketLoading] = useState(false);
    const [supportReplyMessage, setSupportReplyMessage] = useState("");
    const [supportConnection, setSupportConnection] = useState(null);
    const [supportConnectionState, setSupportConnectionState] = useState("idle");
    const [supportThreadNotice, setSupportThreadNotice] = useState("");

    const userDisplayName = getUserName(user);
    const userEmail = getUserEmail(user);
    const supportAuthToken = getSupportAuthToken(token);
    const currentUserId = getUserId(user, supportAuthToken);
    const isSupportMode = chatMode === "support";
    const isViewingSelectedTicket = Boolean(selectedSupportTicketId) || isSelectedTicketLoading;

    const getActiveSupportConnection = () => {
        const connection = supportConnectionRef.current || supportConnection;
        return connection?.state === signalR.HubConnectionState.Connected ? connection : null;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ block: "end" });
    };

    const formatSupportDate = (value) => {
        if (!value) return "—";

        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) return "—";

        return new Intl.DateTimeFormat(getLocale(language), {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(parsedDate);
    };

    const formatSupportTime = (value) => {
        if (!value) return "";

        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) return "";

        return new Intl.DateTimeFormat(getLocale(language), {
            hour: "2-digit",
            minute: "2-digit",
        }).format(parsedDate);
    };

    const getSupportCategoryLabel = (categoryId) =>
        supportCategories.find((item) => item.id === Number(categoryId))?.label || t("support_category_other");

    const getSupportStatusLabel = (status) => {
        switch (Number(status)) {
            case 1:
                return t("support_status_open");
            case 2:
                return t("support_status_claimed");
            case 3:
                return t("support_status_in_progress");
            case 4:
                return t("support_status_solved");
            case 5:
                return t("support_status_closed");
            default:
                return t("support_status_open");
        }
    };

    const getSupportStatusClass = (status) => {
        switch (Number(status)) {
            case 2:
                return "is-claimed";
            case 3:
                return "is-progress";
            case 4:
                return "is-solved";
            case 5:
                return "is-closed";
            case 1:
            default:
                return "is-open";
        }
    };

    const getConnectionLabel = () => {
        switch (supportConnectionState) {
            case "connected":
                return t("support_hub_connected");
            case "reconnecting":
                return t("support_hub_reconnecting");
            case "error":
                return t("support_hub_disconnected");
            case "idle":
            default:
                return t("support_hub_idle");
        }
    };

    const openSupportTicket = async (ticketId) => {
        if (!ticketId) return;

        const activeConnection = getActiveSupportConnection();

        if (
            activeConnection &&
            selectedSupportTicketId &&
            Number(selectedSupportTicketId) !== Number(ticketId)
        ) {
            try {
                await activeConnection.invoke("LeaveTicket", Number(selectedSupportTicketId));
            } catch (error) {
                console.error("Support LeaveTicket error:", error);
            }
        }

        setIsSelectedTicketLoading(true);
        setSelectedSupportTicketId(ticketId);
        setSelectedSupportTicket(null);
        setSupportThreadNotice("");

        const result = await fetchSupportTicket(ticketId);

        if (result.success) {
            const nextTicket = {
                ...result.data,
                messages: Array.isArray(result.data?.messages)
                    ? result.data.messages.map((message) => normalizeSupportMessage(message))
                    : [],
            };

            setSelectedSupportTicket(nextTicket);
            setSelectedSupportTicketId(nextTicket.id);
            setIsHistoryPanelOpen(false);

            const nextActiveConnection = getActiveSupportConnection();
            if (nextActiveConnection) {
                try {
                    await nextActiveConnection.invoke("JoinTicket", Number(nextTicket.id));
                } catch (error) {
                    console.error("Support JoinTicket error:", error);
                }
            }
        } else {
            setSupportThreadNotice(result.error || t("support_ticket_load_failed"));
        }

        setIsSelectedTicketLoading(false);
    };

    const handleCloseSelectedTicket = async () => {
        const activeConnection = getActiveSupportConnection();

        if (activeConnection && selectedSupportTicketId) {
            try {
                await activeConnection.invoke("LeaveTicket", Number(selectedSupportTicketId));
            } catch (error) {
                console.error("Support close ticket error:", error);
            }
        }

        setSelectedSupportTicket(null);
        setSelectedSupportTicketId(null);
        setIsSelectedTicketLoading(false);
        setSupportReplyMessage("");
        setSupportThreadNotice("");
    };

    useEffect(() => {
        setSupportForm((prev) => ({
            ...prev,
            fullName: userDisplayName || prev.fullName,
            email: userEmail || prev.email,
        }));
    }, [userDisplayName, userEmail]);

    useEffect(() => {
        selectedSupportTicketIdRef.current = selectedSupportTicketId;
    }, [selectedSupportTicketId]);

    useEffect(() => {
        if (faqResponseCount > 0) return;

        setFaqMessages([createLocalMessage("admin", t("support_faq_welcome"), language)]);
    }, [faqResponseCount, language, t]);

    useEffect(() => {
        scrollToBottom();
    }, [faqMessages, isFaqTyping, selectedSupportTicket, isSupportMode]);

    useEffect(() => () => {
        if (faqReplyTimeoutRef.current) {
            clearTimeout(faqReplyTimeoutRef.current);
        }
    }, []);

    useEffect(() => {
        if (!supportAuthToken) {
            setSupportTickets([]);
            setSupportTicketsError("");
            setIsSupportTicketsLoading(false);
            return undefined;
        }

        setIsSupportTicketsLoading(true);
        setSupportTicketsError("");

        fetchMySupportTickets().then((result) => {
            if (result.success) {
                setSupportTickets(result.data || []);
            } else {
                setSupportTickets(result.data || []);
                setSupportTicketsError(result.error || t("support_history_load_failed"));
            }

            setIsSupportTicketsLoading(false);
        });

        return undefined;
    }, [fetchMySupportTickets, supportAuthToken, t]);

    useEffect(() => {
        if (!isHistoryPanelOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsHistoryPanelOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isHistoryPanelOpen]);

    useEffect(() => {
        if (!isSupportMode || !supportAuthToken || !supportHubUrl) {
            supportConnectionRef.current = null;
            setSupportConnection(null);
            setSupportConnectionState("idle");
            return undefined;
        }

        let cancelled = false;
        let currentConnection = null;

        const connectSupportHub = async () => {
            setSupportConnectionState("reconnecting");

            try {
                const connection = new signalR.HubConnectionBuilder()
                    .withUrl(supportHubUrl, {
                        accessTokenFactory: () => getSupportAuthToken(token),
                        skipNegotiation: false,
                        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
                        withCredentials: false,
                    })
                    .withAutomaticReconnect([0, 2000, 5000, 10000])
                    .configureLogging(signalR.LogLevel.Warning)
                    .build();

                currentConnection = connection;
                supportConnectionRef.current = connection;

                connection.on("ReceiveMessage", (event) => {
                    const nextMessage = normalizeSupportMessage(event);

                    setSelectedSupportTicket((prev) => {
                        if (!prev || Number(prev.id) !== Number(event.ticketId)) return prev;
                        const alreadyExists = prev.messages?.some((item) => String(item.id) === String(nextMessage.id));
                        if (alreadyExists) return prev;

                        return {
                            ...prev,
                            messages: [...(prev.messages || []), nextMessage],
                        };
                    });
                });

                connection.on("TicketSolved", (event) => {
                    setSupportTickets((prev) =>
                        prev.map((ticket) =>
                            Number(ticket.id) === Number(event.ticketId)
                                ? {
                                      ...ticket,
                                      status: 4,
                                      solvedAt: event.solvedAt || ticket.solvedAt,
                                  }
                                : ticket
                        )
                    );

                    setSelectedSupportTicket((prev) =>
                        prev && Number(prev.id) === Number(event.ticketId)
                            ? {
                                  ...prev,
                                  status: 4,
                                  solvedAt: event.solvedAt || prev.solvedAt,
                              }
                            : prev
                    );
                });

                connection.on("TicketClaimed", () => {
                    fetchMySupportTickets().then((result) => {
                        if (result.success) {
                            setSupportTickets(result.data || []);
                        }
                    });
                });

                connection.on("Error", (message) => {
                    setSupportThreadNotice(message || t("support_thread_error"));
                });

                connection.onreconnecting(() => {
                    if (cancelled) return;
                    setSupportConnectionState("reconnecting");
                });

                connection.onreconnected(async () => {
                    if (cancelled) return;
                    setSupportConnectionState("connected");

                    if (selectedSupportTicketIdRef.current) {
                        try {
                            await connection.invoke("JoinTicket", Number(selectedSupportTicketIdRef.current));
                        } catch (error) {
                            console.error("Support rejoin error:", error);
                        }
                    }
                });

                connection.onclose(() => {
                    if (supportConnectionRef.current === connection) {
                        supportConnectionRef.current = null;
                    }
                    if (cancelled) return;
                    setSupportConnectionState("error");
                });

                await connection.start();

                if (cancelled) {
                    await connection.stop();
                    return;
                }

                setSupportConnection(connection);
                supportConnectionRef.current = connection;
                setSupportConnectionState("connected");
            } catch (error) {
                console.error("Support hub connection error:", error);
                if (!cancelled) {
                    supportConnectionRef.current = null;
                    setSupportConnectionState("error");
                }
            }
        };

        connectSupportHub();

        return () => {
            cancelled = true;
            if (supportConnectionRef.current === currentConnection) {
                supportConnectionRef.current = null;
            }
            setSupportConnection(null);

            if (currentConnection) {
                currentConnection.stop().catch((error) => {
                    console.error("Support hub stop error:", error);
                });
            }
        };
    }, [fetchMySupportTickets, isSupportMode, supportAuthToken, supportHubUrl, t, token]);

    useEffect(() => {
        if (
            !isSupportMode ||
            !selectedSupportTicketId ||
            !supportConnection ||
            supportConnection.state !== signalR.HubConnectionState.Connected
        ) {
            return undefined;
        }

        supportConnection.invoke("JoinTicket", Number(selectedSupportTicketId)).catch((error) => {
            console.error("Support JoinTicket sync error:", error);
        });

        return undefined;
    }, [isSupportMode, selectedSupportTicketId, supportConnection]);

    const handleFaqSelect = (faqItem) => {
        if (!faqItem || isFaqTyping) return;

        setFaqMessages((prev) => [...prev, createLocalMessage("user", faqItem.question, language)]);
        setIsFaqTyping(true);

        if (faqReplyTimeoutRef.current) {
            clearTimeout(faqReplyTimeoutRef.current);
        }

        faqReplyTimeoutRef.current = setTimeout(() => {
            setFaqMessages((prev) => [...prev, createLocalMessage("admin", faqItem.response, language)]);
            setIsFaqTyping(false);
            setFaqResponseCount((prev) => prev + 1);
            faqReplyTimeoutRef.current = null;
        }, 1700);
    };

    const handleConnectSupport = () => {
        if (faqReplyTimeoutRef.current) {
            clearTimeout(faqReplyTimeoutRef.current);
            faqReplyTimeoutRef.current = null;
        }

        setChatMode("support");
        setIsFaqTyping(false);
    };

    const handleSupportFormChange = (field, value) => {
        setSupportForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSupportSubmit = async (event) => {
        event.preventDefault();

        const trimmedFullName = (userDisplayName || supportForm.fullName).trim();
        const trimmedEmail = (userEmail || supportForm.email).trim();
        const trimmedSubject = supportForm.subject.trim();
        const trimmedMessage = supportForm.message.trim();

        if (!trimmedFullName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
            setSupportSubmitError(t("support_required_fields"));
            setSupportSubmitSuccess("");
            return;
        }

        setIsSupportSubmitting(true);
        setSupportSubmitError("");
        setSupportSubmitSuccess("");

        const result = await createSupportTicket({
            fullName: trimmedFullName,
            email: trimmedEmail,
            category: Number(supportForm.category),
            priority: SUPPORT_PRIORITY_DEFAULT,
            subject: trimmedSubject,
            message: trimmedMessage,
        });

        if (result.success) {
            setSupportSubmitSuccess(t("support_ticket_created"));
            setSupportForm((prev) => ({
                ...prev,
                category: SUPPORT_CATEGORY_DEFAULT,
                subject: "",
                message: "",
                fullName: userDisplayName || prev.fullName,
                email: userEmail || prev.email,
            }));

            const ticketsResult = await fetchMySupportTickets();
            if (ticketsResult.success) {
                setSupportTickets(ticketsResult.data || []);
            }

            const nextTicketId = ticketsResult.data?.[0]?.id;
            if (nextTicketId) {
                await openSupportTicket(nextTicketId);
            }
        } else {
            setSupportSubmitError(result.error || t("support_ticket_create_failed"));
        }

        setIsSupportSubmitting(false);
    };

    const handleSupportReply = async (event) => {
        event.preventDefault();

        const activeConnection = getActiveSupportConnection();

        if (
            !activeConnection ||
            !selectedSupportTicketId ||
            !supportReplyMessage.trim()
        ) {
            if (!supportReplyMessage.trim()) return;
            setSupportThreadNotice(t("support_reply_not_ready"));
            return;
        }

        try {
            await activeConnection.invoke("SendMessage", Number(selectedSupportTicketId), supportReplyMessage.trim(), false);
            setSupportReplyMessage("");
            setSupportThreadNotice("");
        } catch (error) {
            console.error("Support reply send error:", error);
            setSupportThreadNotice(t("support_reply_failed"));
        }
    };

    const handleHistoryTicketSelect = async (ticketId) => {
        if (!ticketId) return;

        if (!isSupportMode) {
            setChatMode("support");
        }

        await openSupportTicket(ticketId);
    };

    const renderFaqMessage = (msg) => (
        <div
            key={msg.id}
            className={`message ${msg.sender === "admin" ? "admin-message" : "user-message"}`}
        >
            <div className="message-bubble">{msg.text}</div>
            <span className="message-time">{msg.time}</span>
        </div>
    );

    const renderSupportThreadMessage = (message) => {
        const isMine = message.senderId
            ? Number(message.senderId) === Number(currentUserId)
            : message.senderName === userDisplayName;

        return (
            <div
                key={message.id}
                className={`support-thread-message ${isMine ? "is-mine" : "is-theirs"}`}
            >
                <div className="support-thread-meta">
                    <span className="support-thread-sender">{message.senderName}</span>
                    <span className="support-thread-time">{formatSupportTime(message.sentAt)}</span>
                </div>
                <div className="support-thread-bubble">{message.content}</div>
            </div>
        );
    };

    const renderSupportHistoryList = () => {
        if (isSupportTicketsLoading) {
            return <div className="support-empty-state">{t("support_history_loading")}</div>;
        }

        if (!supportTickets.length) {
            return (
                <div className="support-empty-state">
                    {supportTicketsError || t("support_history_empty")}
                </div>
            );
        }

        return (
            <div className="support-history-list">
                {supportTickets.map((ticket) => (
                    <button
                        key={ticket.id}
                        type="button"
                        className={`support-history-item ${
                            Number(selectedSupportTicketId) === Number(ticket.id) ? "is-active" : ""
                        }`}
                        onClick={() => handleHistoryTicketSelect(ticket.id)}
                    >
                        <div className="support-history-top">
                            <span className="support-ticket-number">{ticket.ticketNumber}</span>
                            <span className={`support-ticket-status ${getSupportStatusClass(ticket.status)}`}>
                                {getSupportStatusLabel(ticket.status)}
                            </span>
                        </div>
                        <div className="support-history-subject">{ticket.subject}</div>
                        <div className="support-history-meta">
                            <span>{getSupportCategoryLabel(ticket.category)}</span>
                            <span>{formatSupportDate(ticket.createDate)}</span>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className={`chat-container ${isHistoryPanelOpen ? "is-history-panel-open" : ""}`}>
            <header className="chat-header">
                <div className="admin-info">
                    <div className="admin-avatar">
                        <img
                            className="admin-profile"
                            src="../assets/siteImages/adminProfile.png"
                            alt="Admin Profile Image"
                        />
                    </div>
                    <div className="admin-details">
                        <h2>{isSupportMode ? t("support_portal_title") : t("admin")}</h2>
                        <span className="admin-status">
                            {isSupportMode ? getConnectionLabel() : t("online")}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    className="chat-history-menu-button"
                    onClick={() => setIsHistoryPanelOpen(true)}
                    aria-label={t("support_history_title")}
                    aria-expanded={isHistoryPanelOpen}
                >
                    <span className="chat-history-menu-lines" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                    <span className="chat-history-menu-count">{supportTickets.length}</span>
                </button>
            </header>

            {isHistoryPanelOpen && (
                <div className="support-history-drawer-layer">
                    <button
                        type="button"
                        className="support-history-backdrop"
                        onClick={() => setIsHistoryPanelOpen(false)}
                        aria-label={t("close")}
                    ></button>

                    <aside
                        className="support-history-drawer"
                        aria-label={t("support_history_title")}
                    >
                        <div className="support-history-drawer-header">
                            <div>
                                <p className="support-history-eyebrow">{t("support_history_title")}</p>
                                <span className="support-history-count">
                                    {supportTickets.length} {t("support_history_count")}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="support-history-drawer-close"
                                onClick={() => setIsHistoryPanelOpen(false)}
                                aria-label={t("close")}
                            >
                                ×
                            </button>
                        </div>

                        <div className="support-history-drawer-body">
                            {renderSupportHistoryList()}
                        </div>
                    </aside>
                </div>
            )}

            {!isSupportMode ? (
                <div className="messages-container faq-stage">
                    <div className="chat-date-divider">{t("today")}</div>

                    {faqMessages.map((msg) => renderFaqMessage(msg))}

                    <section className="faq-shell" aria-label="Support quick questions">
                        <h3 className="faq-title">{t("support_faq_title")}</h3>
                        <p className="faq-subtitle">{t("support_faq_subtitle")}</p>

                        <div className="faq-capsule-grid">
                            {faqItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="faq-capsule"
                                    onClick={() => handleFaqSelect(item)}
                                    disabled={isFaqTyping}
                                >
                                    {item.question}
                                </button>
                            ))}
                        </div>

                        {isFaqTyping && (
                            <div className="message admin-message typing-indicator">
                                <div className="message-bubble">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            className="faq-connect-button"
                            onClick={handleConnectSupport}
                        >
                            {t(faqResponseCount === 0
                                ? "support_faq_direct_chat"
                                : "support_faq_connect_chat")}
                        </button>
                    </section>

                    <div ref={messagesEndRef}></div>
                </div>
            ) : (
                <div className="messages-container support-stage">
                    <div className="chat-date-divider">{t("today")}</div>

                    <section className="support-shell">
                        {!isViewingSelectedTicket && (
                            <>
                                <div className="support-hero">
                                    <div>
                                        <p className="support-eyebrow">{t("support_portal_eyebrow")}</p>
                                        <h3 className="support-title">{t("support_portal_heading")}</h3>
                                        <p className="support-subtitle">{t("support_portal_subtitle")}</p>
                                    </div>

                                    <div className={`support-status-pill is-${supportConnectionState}`}>
                                        <span className="support-status-dot"></span>
                                        {getConnectionLabel()}
                                    </div>
                                </div>

                                <form className="support-form-card" onSubmit={handleSupportSubmit}>
                                    <input type="hidden" value={supportForm.fullName} readOnly />
                                    <input type="hidden" value={supportForm.email} readOnly />
                                    <input type="hidden" value={supportForm.category} readOnly />

                                    <div className="support-form-grid">
                                        {/* <div className="support-form-group support-form-group-full">
                                            <span className="support-form-label">
                                                {t("support_form_category")}
                                            </span>
                                            <div
                                                ref={categoryDropdownRef}
                                                className={`support-category-dropdown ${isCategoryMenuOpen ? "is-open" : ""}`}
                                            >
                                                <button
                                                    id="support-category"
                                                    type="button"
                                                    className="support-category-trigger"
                                                    onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                                                    aria-haspopup="listbox"
                                                    aria-expanded={isCategoryMenuOpen}
                                                >
                                                    <span className={`support-category-trigger-text ${supportForm.category ? "is-selected" : ""}`}>
                                                        {selectedCategoryLabel}
                                                    </span>
                                                    <span className="support-category-trigger-icon" aria-hidden="true"></span>
                                                </button>

                                                {isCategoryMenuOpen && (
                                                    <div className="support-category-menu" role="listbox" aria-labelledby="support-category">
                                                        {supportCategories.map((category) => (
                                                            <button
                                                                key={category.id}
                                                                type="button"
                                                                role="option"
                                                                aria-selected={Number(supportForm.category) === Number(category.id)}
                                                                className={`support-category-option ${
                                                                    Number(supportForm.category) === Number(category.id) ? "is-selected" : ""
                                                                }`}
                                                                onClick={() => handleCategorySelect(category.id)}
                                                            >
                                                                <span>{category.label}</span>
                                                                {Number(supportForm.category) === Number(category.id) && (
                                                                    <span className="support-category-check" aria-hidden="true">
                                                                        ✓
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div> */}

                                        <div className="support-form-group support-form-group-full">
                                            <label className="support-form-label" htmlFor="support-subject">
                                                {t("support_form_subject")}
                                            </label>
                                            <input
                                                id="support-subject"
                                                className="support-form-input"
                                                value={supportForm.subject}
                                                onChange={(event) => handleSupportFormChange("subject", event.target.value)}
                                                placeholder={t("support_form_subject_placeholder")}
                                            />
                                        </div>

                                        <div className="support-form-group support-form-group-full">
                                            <label className="support-form-label" htmlFor="support-message">
                                                {t("support_form_message")}
                                            </label>
                                            <textarea
                                                id="support-message"
                                                className="support-form-textarea"
                                                value={supportForm.message}
                                                onChange={(event) => handleSupportFormChange("message", event.target.value)}
                                                placeholder={t("support_form_message_placeholder")}
                                            />
                                        </div>
                                    </div>

                                    {supportSubmitError && (
                                        <div className="support-feedback is-error">{supportSubmitError}</div>
                                    )}

                                    {supportSubmitSuccess && (
                                        <div className="support-feedback is-success">{supportSubmitSuccess}</div>
                                    )}

                                    <div className="support-form-footer">
                                        <button
                                            type="submit"
                                            className="support-submit-button"
                                            disabled={isSupportSubmitting}
                                        >
                                            {isSupportSubmitting ? t("sending") : t("support_send_ticket")}
                                        </button>
                                    </div>
                                </form>

                            </>
                        )}

                        {(isSelectedTicketLoading || selectedSupportTicket || supportThreadNotice) && (
                            <section className="support-thread-card">
                                <div className="support-thread-topbar">
                                    {isViewingSelectedTicket && (
                                        <button
                                            type="button"
                                            className="support-thread-close"
                                            onClick={handleCloseSelectedTicket}
                                        >
                                            {t("close")}
                                        </button>
                                    )}

                                    <div className="support-thread-header">
                                        <div className="support-thread-heading">
                                            <p className="support-history-eyebrow">{t("support_thread_title")}</p>
                                            <h4 className="support-thread-title">
                                                {selectedSupportTicket?.subject || t("support_thread_placeholder")}
                                            </h4>
                                        </div>

                                        {selectedSupportTicket && (
                                            <div className="support-thread-meta-group">
                                                <div className="support-thread-meta-row">
                                                    <span
                                                        className={`support-ticket-status ${getSupportStatusClass(
                                                            selectedSupportTicket.status
                                                        )}`}
                                                    >
                                                        {getSupportStatusLabel(selectedSupportTicket.status)}
                                                    </span>
                                                    <span className="support-thread-meta-pill">
                                                        {formatSupportDate(selectedSupportTicket.createDate)}
                                                    </span>
                                                </div>
                                                <div className="support-thread-meta-row">
                                                    <span className="support-thread-badge">
                                                        {getSupportCategoryLabel(selectedSupportTicket.category)}
                                                    </span>
                                                    <span className="support-thread-meta-pill">
                                                        {selectedSupportTicket.assignedWorkerName ||
                                                            t("support_thread_waiting_worker")}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isSelectedTicketLoading ? (
                                    <div className="support-empty-state">{t("support_thread_loading")}</div>
                                ) : selectedSupportTicket ? (
                                    <>
                                        <div className="support-original-message">
                                            <span className="support-original-label">
                                                {t("support_thread_original_message")}
                                            </span>
                                            <p>{selectedSupportTicket.message}</p>
                                        </div>

                                        <div className="support-thread-area">
                                            {selectedSupportTicket.messages?.length ? (
                                                selectedSupportTicket.messages.map((message) =>
                                                    renderSupportThreadMessage(message)
                                                )
                                            ) : (
                                                <div className="support-empty-state">
                                                    {t("support_thread_empty")}
                                                </div>
                                            )}
                                            <div ref={messagesEndRef}></div>
                                        </div>

                                        {supportThreadNotice && (
                                            <div className="support-feedback is-error">{supportThreadNotice}</div>
                                        )}

                                        {Number(selectedSupportTicket.status) === 4 ||
                                        Number(selectedSupportTicket.status) === 5 ? (
                                            <div className="support-thread-closed">
                                                {t("support_thread_closed")}
                                            </div>
                                        ) : (
                                            <form className="support-reply-form" onSubmit={handleSupportReply}>
                                                <textarea
                                                    className="support-reply-input"
                                                    value={supportReplyMessage}
                                                    onChange={(event) => setSupportReplyMessage(event.target.value)}
                                                    placeholder={t("support_reply_placeholder")}
                                                />
                                                <button
                                                    type="submit"
                                                    className="support-reply-button"
                                                    disabled={!supportReplyMessage.trim()}
                                                    aria-label={t("send_message")}
                                                >
                                                    {t("send")}
                                                </button>
                                            </form>
                                        )}
                                    </>
                                ) : (
                                    <div className="support-empty-state">
                                        {supportThreadNotice || t("support_thread_placeholder")}
                                    </div>
                                )}
                            </section>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
