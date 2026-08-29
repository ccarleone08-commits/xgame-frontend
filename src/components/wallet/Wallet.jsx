import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Wallet.css';
import { useAppContext } from '../../context/AppContext';
import WithdrawBalance from './WithdrawBalance';
import { buildApiAbsoluteUrl } from '../../config/api';

const SUCCESS_STATUSES = new Set(['finished', 'completed', 'confirmed', 'paid', 'success', 'approved', 'bank_approved', 'worker_approved']);
const FAILED_STATUSES = new Set(['expired', 'failed', 'provider_failed', 'cancelled', 'canceled', 'rejected', 'bank_rejected', 'worker_rejected']);
const PENDING_STATUSES = new Set(['pending', 'waiting', 'created', 'confirming', 'processing']);

const formatAmount = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const normalizeRequestDateValue = (value) => {
    if (typeof value !== 'string') return value;

    const trimmed = value.trim();
    const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
    if (hasTimezone) return trimmed;

    const utcDateTime = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}(?::\d{2})?)(\.\d+)?$/);
    if (!utcDateTime) return trimmed;

    const [, datePart, timePart, fraction = ''] = utcDateTime;
    const milliseconds = fraction ? fraction.slice(0, 4).padEnd(4, '0') : '';
    return `${datePart}T${timePart}${milliseconds}Z`;
};

const parseRequestDate = (value) => {
    if (!value) return null;

    const date = new Date(normalizeRequestDateValue(value));
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatRequestDate = (value) => {
    if (!value) return '—';
    const date = parseRequestDate(value);
    if (!date) return '—';

    return new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const stripUsdtLabel = (value) => String(value || '')
    .replace(/\bUSDT\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const getCookieToken = () => document.cookie
    .split('; ')
    .find((row) => row.startsWith('AuthToken='))
    ?.split('=')[1] || '';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || getCookieToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const getResponseList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.result)) return data.result;
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

const getApiErrorMessage = async (response, fallback) => {
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (typeof body === 'string' && body.trim()) return body;
    return body?.message || body?.title || fallback;
};

const formatStatusLabel = (status) => {
    const normalized = String(status || 'pending')
        .replace(/[_-]+/g, ' ')
        .trim();

    return normalized
        ? normalized.replace(/\b\w/g, (letter) => letter.toUpperCase())
        : 'Pending';
};

const normalizeStatusKey = (status) => String(status || '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .trim();

const normalizeCoinRequest = (item = {}) => ({
    ...item,
    id: item.id ?? item.coinRequestId ?? item.requestId ?? item.orderId ?? `${item.createdAt || Date.now()}`,
    historyId: `coin-request-${item.id ?? item.coinRequestId ?? item.requestId ?? item.orderId ?? `${item.createdAt || Date.now()}`}`,
    coinAmount: Number(item.coinAmount) || 0,
    priceAmount: Number(item.priceAmount) || 0,
    priceCurrency: String(item.priceCurrency || 'usd').toUpperCase(),
    payCurrency: item.payCurrency ? String(item.payCurrency).toUpperCase() : '',
    createDate: item.createdAt || item.createDate || item.requestDate || item.date || null,
    statusText: item.status || item.statusText || 'pending',
    coinsGranted: item.coinsGranted === true || String(item.coinsGranted).toLowerCase() === 'true',
    requestType: 'deposit',
});

const normalizeWithdrawRequest = (item = {}) => {
    const rawId = item.id ?? item.withdrawRequestId ?? item.requestId ?? `${item.createDate || item.createdAt || Date.now()}`;

    return {
        ...item,
        id: rawId,
        historyId: `withdraw-${rawId}`,
        amount: Number(item.amount) || 0,
        createDate: item.createDate || item.createdAt || item.requestDate || item.date || null,
        statusText: item.statusText || item.status || 'Pending',
        walletAddress: item.walletAddress || item.address || item.wallet || '',
        requestType: 'withdraw',
    };
};

const Wallet = () => {
    const {
        balance,
        user,
        t,
        withdrawRequests = [],
        withdrawRequestsLoading,
    } = useAppContext();
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [coinRequests, setCoinRequests] = useState([]);
    const [walletWithdrawRequests, setWalletWithdrawRequests] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionsError, setTransactionsError] = useState('');
    const navigate = useNavigate();

    const text = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };

    useEffect(() => {
        const token = localStorage.getItem('token') || getCookieToken();

        if (!token) {
            setCoinRequests([]);
            setWalletWithdrawRequests([]);
            setTransactionsLoading(false);
            return undefined;
        }

        const controller = new AbortController();

        const loadCoinRequests = async () => {
            setTransactionsLoading(true);
            setTransactionsError('');

            try {
                const [coinResult, withdrawResult] = await Promise.allSettled([
                    fetch(buildApiAbsoluteUrl('/api/coin-request'), {
                        credentials: 'include',
                        signal: controller.signal,
                        headers: {
                            'ngrok-skip-browser-warning': 'true',
                            ...getAuthHeaders(),
                        },
                    }).then(async (response) => {
                        if (!response.ok) {
                            throw new Error(await getApiErrorMessage(response, `Request failed: ${response.status}`));
                        }

                        return response.json();
                    }),
                    fetch(buildApiAbsoluteUrl('/api/withdraw/my-requests'), {
                        credentials: 'include',
                        signal: controller.signal,
                        headers: {
                            'ngrok-skip-browser-warning': 'true',
                            ...getAuthHeaders(),
                        },
                    }).then(async (response) => {
                        if (!response.ok) {
                            throw new Error(await getApiErrorMessage(response, `Request failed: ${response.status}`));
                        }

                        return response.json();
                    }),
                ]);

                if (controller.signal.aborted) return;

                if (coinResult.status === 'fulfilled') {
                    setCoinRequests(getResponseList(coinResult.value).map((item) => normalizeCoinRequest(item)));
                } else {
                    console.error('Coin requests fetch error:', coinResult.reason);
                    setCoinRequests([]);
                }

                if (withdrawResult.status === 'fulfilled') {
                    setWalletWithdrawRequests(getResponseList(withdrawResult.value).map((item) => normalizeWithdrawRequest(item)));
                } else {
                    console.error('Withdraw requests fetch error:', withdrawResult.reason);
                    setWalletWithdrawRequests([]);
                }

                if (coinResult.status === 'rejected' && withdrawResult.status === 'rejected') {
                    throw coinResult.reason || withdrawResult.reason || new Error('Could not load transactions.');
                }
            } catch (error) {
                if (error.name === 'AbortError') return;
                setCoinRequests([]);
                setWalletWithdrawRequests([]);
                setTransactionsError(error.message || 'Could not load transactions.');
            } finally {
                if (!controller.signal.aborted) {
                    setTransactionsLoading(false);
                }
            }
        };

        loadCoinRequests();

        return () => {
            controller.abort();
        };
    }, [user?.id]);

    const sortedTransactions = useMemo(() => {
        const transactionMap = new Map();
        [...coinRequests, ...walletWithdrawRequests, ...withdrawRequests].forEach((tx) => {
            transactionMap.set(tx.historyId || `${tx.requestType || 'transaction'}-${tx.id}`, tx);
        });

        return [...transactionMap.values()]
            .sort((a, b) => {
                const aTime = parseRequestDate(a?.createDate)?.getTime() || 0;
                const bTime = parseRequestDate(b?.createDate)?.getTime() || 0;
                return bTime - aTime;
            });
    }, [coinRequests, walletWithdrawRequests, withdrawRequests]);

    const recentTransactions = sortedTransactions.slice(0, 3);

    const getStatusLabel = (status) => {
        const normalizedStatus = normalizeStatusKey(status) || 'pending';
        return text(`transaction_status_${normalizedStatus}`, formatStatusLabel(status || normalizedStatus));
    };

    const getStatusMeta = (tx) => {
        const statusText = tx?.statusText;
        const normalizedStatus = normalizeStatusKey(statusText);

        if (tx?.coinsGranted || SUCCESS_STATUSES.has(normalizedStatus)) {
            return {
                icon: '✅',
                badgeClass: 'approved',
                label: getStatusLabel(statusText),
            };
        }

        if (FAILED_STATUSES.has(normalizedStatus)) {
            return {
                icon: '❌',
                badgeClass: 'rejected',
                label: getStatusLabel(statusText),
            };
        }

        if (PENDING_STATUSES.has(normalizedStatus)) {
            return {
                icon: '⏳',
                badgeClass: 'pending',
                label: getStatusLabel(statusText),
            };
        }

        return {
            icon: '⏳',
            badgeClass: 'pending',
            label: getStatusLabel(statusText),
        };
    };

    const getTransactionTitle = (tx) => {
        if (tx?.requestType === 'withdraw') {
            return text('withdraw_balance', 'Withdraw');
        }

        return stripUsdtLabel(tx.coinPackageName || text('add_balance', 'Deposit'));
    };

    const getTransactionKindClass = (tx) => (tx?.requestType === 'withdraw' ? 'withdraw' : 'deposit');

    const getTransactionAmount = (tx) => (
        tx?.requestType === 'withdraw'
            ? `${formatAmount(tx.amount)} USDT`
            : `${formatAmount(tx.coinAmount ?? tx.amount)} ${text('coins', 'Coin')}`
    );

    const getTransactionSubtitle = (tx) => {
        const details = [];

        if (tx?.requestType === 'withdraw' && tx.walletAddress) {
            details.push(`${t('wallet_address')}: ${tx.walletAddress}`);
        } else if (tx.payCurrency) {
            details.push(`${text('nowpayment_currency', 'Currency')}: ${tx.payCurrency}`);
        }

        return details.join(' | ');
    };

    const renderTransactionItem = (tx) => {
        const statusMeta = getStatusMeta(tx);
        const subtitle = getTransactionSubtitle(tx);
        const kindClass = getTransactionKindClass(tx);

        return (
            <div key={tx.historyId || tx.id} className={`transaction-item ${kindClass}`}>
                <div className="transaction-icon">{statusMeta.icon}</div>
                <div className="transaction-details">
                    <div className="transaction-title-row">
                        <span className="transaction-title">{getTransactionTitle(tx)}</span>
                    </div>
                    {subtitle && (
                        <span className="transaction-subtitle">{subtitle}</span>
                    )}
                    <span className="transaction-time">{formatRequestDate(tx.createDate)}</span>
                </div>
                <div className="transaction-amount">
                    <span className={`amount ${kindClass}`}>{getTransactionAmount(tx)}</span>
                    <span className={`transaction-status ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="wallet-container">
            <div className="balance-card">
                <div className="balance-glow"></div>
                <div className="balance-content">
                    <div className="balance-header">
                        <span className="balance-label">{t('balance')}</span>
                    </div>
                    <h1 className="balance-amount-wallet">
                        {formatAmount(balance)}
                    </h1>
                    <div className="wallet-actions">
                        <button className="add-balance-btn deposit-btn" onClick={() => navigate('/deposit')} aria-label={t('add_balance')}>
                            {t('add_balance')}
                        </button>
                        <button className="add-balance-btn" onClick={() => setIsWithdrawOpen(true)} aria-label={t('withdraw_balance')}>
                            {t('withdraw_balance')}
                        </button>
                    </div>
                </div>
            </div>

            <section className="wallet-section history-section">
                <h2>{t('recent_transactions')}</h2>
                <div className="transactions-list">
                    {transactionsLoading || withdrawRequestsLoading ? (
                        <div className="wallet-empty-state">{text('transactions_loading', 'Loading your transactions...')}</div>
                    ) : transactionsError ? (
                        <div className="wallet-empty-state">{transactionsError}</div>
                    ) : recentTransactions.length ? (
                        recentTransactions.map((tx) => renderTransactionItem(tx))
                    ) : (
                        <div className="wallet-empty-state">{text('transactions_empty', 'No transactions yet.')}</div>
                    )}
                </div>
            </section>

            <div className="profile-actions wallet-history-actions">
                <button className="profile-action-btn history-btn" onClick={() => setShowHistory(true)}>
                    {t('full_history')}
                </button>
            </div>

            {showHistory && (
                <div className="modal-overlay wallet-history-overlay" onClick={() => setShowHistory(false)}>
                    <div className="history-modal wallet-history-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowHistory(false)}>×</button>
                        <h2 className="history-title">{t('full_history')}</h2>
                        <div className="transactions-list history-list wallet-history-list">
                            {transactionsLoading || withdrawRequestsLoading ? (
                                <div className="wallet-empty-state">{text('transactions_loading', 'Loading your transactions...')}</div>
                            ) : transactionsError ? (
                                <div className="wallet-empty-state">{transactionsError}</div>
                            ) : sortedTransactions.length ? (
                                sortedTransactions.map((tx) => renderTransactionItem(tx))
                            ) : (
                                <div className="wallet-empty-state">{text('transactions_empty', 'No transactions yet.')}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isWithdrawOpen && (
                <WithdrawBalance
                    isOpen={isWithdrawOpen}
                    onClose={() => setIsWithdrawOpen(false)}
                    username={user?.username}
                    walletAddress={user?.walletAddress}
                />
            )}
        </div>
    );
};

export default Wallet;
