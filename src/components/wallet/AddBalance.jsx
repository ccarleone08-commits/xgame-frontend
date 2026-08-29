import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddBalance.css";
import { useAppContext } from '../../context/AppContext';
import { buildApiAbsoluteUrl } from '../../config/api';

const API_BASE = buildApiAbsoluteUrl('/api');
const PAYMENT_FAILURE_STATUSES = ['failed', 'expired', 'cancelled'];
const CRYPTO_ICON_BASE = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color';

const cryptoIcon = (symbol) => `${CRYPTO_ICON_BASE}/${symbol}.svg`;
const simpleIcon = (slug) => `https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/${slug}.svg`;

const CRYPTO_OPTIONS = [
    { value: '', labelKey: 'nowpayment_auto_crypto', network: 'Auto', image: cryptoIcon('generic'), colors: ['#3f6f5e', '#d0a746'] },
    { value: 'btc', label: 'BTC', network: 'Bitcoin', image: cryptoIcon('btc'), colors: ['#f7931a', '#7c3f00'] },
    { value: 'eth', label: 'ETH', network: 'Ethereum', image: cryptoIcon('eth'), colors: ['#627eea', '#182046'] },
    { value: 'usdttrc20', label: 'USDT TRC20', network: 'TRON', image: cryptoIcon('usdt'), colors: ['#26a17b', '#083f32'] },
    { value: 'usdterc20', label: 'USDT ERC20', network: 'Ethereum', image: cryptoIcon('usdt'), colors: ['#26a17b', '#233f89'] },
    { value: 'usdtbsc', label: 'USDT BSC', network: 'BNB Smart Chain', image: cryptoIcon('usdt'), colors: ['#26a17b', '#8a6514'] },
    { value: 'usdtmatic', label: 'USDT Polygon', network: 'Polygon', image: cryptoIcon('usdt'), colors: ['#26a17b', '#4a25a8'] },
    { value: 'trx', label: 'TRX', network: 'TRON', image: cryptoIcon('trx'), colors: ['#ef0027', '#6a0012'] },
    { value: 'ltc', label: 'LTC', network: 'Litecoin', image: cryptoIcon('ltc'), colors: ['#b8b8b8', '#345d9d'] },
    { value: 'doge', label: 'DOGE', network: 'Dogecoin', image: cryptoIcon('doge'), colors: ['#c2a633', '#6f5814'] },
    { value: 'bnbbsc', label: 'BNB BSC', network: 'BNB Smart Chain', image: cryptoIcon('bnb'), colors: ['#f3ba2f', '#6f4b00'] },
    { value: 'maticmainnet', label: 'MATIC Polygon', network: 'Polygon', image: cryptoIcon('matic'), colors: ['#8247e5', '#32106e'] },
    { value: 'sol', label: 'SOL', network: 'Solana', image: cryptoIcon('sol'), colors: ['#14f195', '#9945ff'] },
    { value: 'xrp', label: 'XRP', network: 'Ripple', image: cryptoIcon('xrp'), colors: ['#23292f', '#0f1115'] },
    { value: 'xlm', label: 'XLM', network: 'Stellar', image: cryptoIcon('xlm'), colors: ['#111827', '#4b5563'] },
    { value: 'ada', label: 'ADA', network: 'Cardano', image: cryptoIcon('ada'), colors: ['#0033ad', '#001b5c'] },
    { value: 'ton', label: 'TON', network: 'TON', image: simpleIcon('ton'), colors: ['#0098ea', '#075985'] },
    { value: 'bch', label: 'BCH', network: 'Bitcoin Cash', image: cryptoIcon('bch'), colors: ['#0ac18e', '#07503f'] },
    { value: 'dash', label: 'DASH', network: 'Dash', image: cryptoIcon('dash'), colors: ['#008de4', '#004276'] },
    { value: 'etc', label: 'ETC', network: 'Ethereum Classic', image: cryptoIcon('etc'), colors: ['#328332', '#123d1d'] },
    { value: 'shib', label: 'SHIB', network: 'Ethereum', image: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.svg', colors: ['#f00500', '#4f0b05'] },
    { value: 'link', label: 'LINK', network: 'Chainlink', image: cryptoIcon('link'), colors: ['#2a5ada', '#153073'] },
    { value: 'avaxc', label: 'AVAX C-Chain', network: 'Avalanche', image: cryptoIcon('avax'), colors: ['#e84142', '#751014'] },
];

const PAYMENT_METHODS = CRYPTO_OPTIONS;
const AUTO_METHOD_KEY = 'auto';

const getCookieToken = () => document.cookie
    .split('; ')
    .find((row) => row.startsWith('AuthToken='))
    ?.split('=')[1] || '';

const getAuthHeaders = (extra = {}) => {
    const token = localStorage.getItem('token') || getCookieToken();
    return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
};

const getApiErrorMessage = async (response, fallback) => {
    const contentType = response.headers.get('content-type') || '';
    const errorBody = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (typeof errorBody === 'string' && errorBody.trim()) return errorBody;
    return errorBody?.message || errorBody?.title || fallback;
};

export default function AddBalance({ isOpen, onClose, username: propUsername }) {
    const navigate = useNavigate();
    const {
        t,
        user,
        refreshBalance,
    } = useAppContext();

    const text = useCallback((key, replacements = {}) => {
        const template = t(key);
        return Object.entries(replacements).reduce(
            (message, [placeholder, value]) => message.replaceAll(`{${placeholder}}`, value),
            template
        );
    }, [t]);

    const [amount, setAmount] = useState("10");
    const [payCurrency, setPayCurrency] = useState(null);
    const [feedback, setFeedback] = useState(() => ({ type: '', message: t('nowpayment_initial_message'), scope: '' }));
    const [minimumCoinAmount, setMinimumCoinAmount] = useState(null);
    const [minimumLoading, setMinimumLoading] = useState(false);
    const [minimumUnavailable, setMinimumUnavailable] = useState(false);
    const [methodMinimums, setMethodMinimums] = useState(() => ({
        [AUTO_METHOD_KEY]: { status: 'auto' },
    }));
    const [isMethodPickerOpen, setIsMethodPickerOpen] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastPaymentStatus, setLastPaymentStatus] = useState(null);
    const minimumRequestIdRef = useRef(0);
    const pollingTimerRef = useRef(null);
    const isActive = isOpen ?? true;

    const username = propUsername || user?.username || localStorage.getItem("username") || t('anonymous');
    const hasSelectedMethod = payCurrency !== null;
    const selectedMethod = useMemo(
        () => PAYMENT_METHODS.find((option) => option.value === payCurrency) || null,
        [payCurrency]
    );
    const isMethodPickerCollapsed = hasSelectedMethod && !isMethodPickerOpen;
    const numericAmount = Number(amount);
    const safeAmount = Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 0;
    const isBelowMinimum = minimumCoinAmount !== null && safeAmount < minimumCoinAmount;
    const isInvalidAmount = !Number.isFinite(numericAmount) || numericAmount < 1;
    const disableBuy = isSubmitting || minimumLoading || minimumUnavailable || isBelowMinimum || isInvalidAmount;

    const api = useCallback(async (path, options = {}) => {
        const response = await fetch(`${API_BASE}${path}`, {
            credentials: 'include',
            ...options,
            headers: {
                'ngrok-skip-browser-warning': 'true',
                ...(options.headers || {}),
            },
        });

        if (!response.ok) {
            throw new Error(await getApiErrorMessage(response, text('nowpayment_request_failed', { status: response.status })));
        }

        return response.json();
    }, [text]);

    const setMessage = useCallback((message, type = '', scope = '') => {
        setFeedback({ message, type, scope });
    }, []);

    const getMethodLabel = useCallback((option) => (
        option?.labelKey ? text(option.labelKey) : option?.label
    ), [text]);

    const handleMethodSelect = useCallback((option) => {
        setPayCurrency(option.value);
        setIsMethodPickerOpen(false);
        setMessage(text('nowpayment_method_ready', {
            method: getMethodLabel(option),
        }), 'success');
    }, [getMethodLabel, setMessage, text]);

    const handleMethodPickerToggle = useCallback(() => {
        setIsMethodPickerOpen((current) => hasSelectedMethod ? !current : true);
    }, [hasSelectedMethod]);

    const getMethodMinimumText = useCallback((option) => {
        if (!option?.value) return text('nowpayment_auto_method_desc');

        const minimum = methodMinimums[option.value];
        if (!minimum || minimum.status === 'loading') return text('loading');
        if (minimum.status === 'error') return text('nowpayment_minimum_unavailable_short');

        return text('nowpayment_minimum_coin_value', {
            amount: Number(minimum.coinAmount || 0).toFixed(2),
            crypto: '',
        });
    }, [methodMinimums, text]);

    useEffect(() => {
        if (!isActive) return undefined;

        setFeedback({ type: '', message: text('nowpayment_initial_message'), scope: '' });

        return () => {
            setFeedback({ type: '', message: text('nowpayment_initial_message'), scope: '' });
            setIsSubmitting(false);
            if (pollingTimerRef.current) {
                clearInterval(pollingTimerRef.current);
                pollingTimerRef.current = null;
            }
        };
    }, [isActive, text]);

    useEffect(() => {
        if (!hasSelectedMethod) {
            setIsMethodPickerOpen(true);
        }
    }, [hasSelectedMethod]);

    useEffect(() => {
        if (!isActive) return undefined;

        let cancelled = false;
        const optionsWithMinimum = PAYMENT_METHODS.filter((option) => option.value);

        setMethodMinimums((prev) => {
            const next = {
                ...prev,
                [AUTO_METHOD_KEY]: { status: 'auto' },
            };

            optionsWithMinimum.forEach((option) => {
                if (!next[option.value] || next[option.value].status === 'error') {
                    next[option.value] = { status: 'loading' };
                }
            });

            return next;
        });

        optionsWithMinimum.forEach((option) => {
            api(`/payments/nowpayments/min-amount?payCurrency=${encodeURIComponent(option.value)}`, {
                headers: getAuthHeaders(),
            })
                .then((data) => {
                    if (cancelled) return;
                    setMethodMinimums((prev) => ({
                        ...prev,
                        [option.value]: {
                            status: 'ready',
                            coinAmount: Number(data.minimumCoinAmount || data.minimumPriceAmount || 0),
                            payAmount: Number(data.minimumPayAmount || 0),
                        },
                    }));
                })
                .catch(() => {
                    if (cancelled) return;
                    setMethodMinimums((prev) => ({
                        ...prev,
                        [option.value]: { status: 'error' },
                    }));
                });
        });

        return () => {
            cancelled = true;
        };
    }, [api, isActive]);

    useEffect(() => {
        const requestId = ++minimumRequestIdRef.current;
        setMinimumCoinAmount(null);
        setMinimumUnavailable(false);

        if (!isActive || !payCurrency) {
            setMinimumLoading(false);
            if (isActive) {
                setMessage(text('nowpayment_initial_message'));
            }
            return;
        }

        setMinimumLoading(true);

        api(`/payments/nowpayments/min-amount?payCurrency=${encodeURIComponent(payCurrency)}`, {
            headers: getAuthHeaders(),
        })
            .then((data) => {
                if (requestId !== minimumRequestIdRef.current) return;
                const nextMinimumCoin = Number(data.minimumCoinAmount || data.minimumPriceAmount || 0);
                setMinimumCoinAmount(nextMinimumCoin);
                setMessage(text('nowpayment_minimum_loaded', {
                    currency: payCurrency.toUpperCase(),
                    amount: nextMinimumCoin.toFixed(2),
                }), 'success');
            })
            .catch((error) => {
                if (requestId !== minimumRequestIdRef.current) return;
                setMinimumCoinAmount(null);
                setMinimumUnavailable(true);
                setMessage(text('nowpayment_minimum_load_failed', { error: error.message }), 'error', 'minimum');
            })
            .finally(() => {
                if (requestId !== minimumRequestIdRef.current) return;
                setMinimumLoading(false);
            });
    }, [api, isActive, payCurrency, setMessage, text]);

    useEffect(() => {
        if (!isActive || !lastPaymentStatus?.id) return undefined;

        const paymentId = lastPaymentStatus.id;

        const poll = async () => {
            try {
                const data = await api(`/payments/${encodeURIComponent(paymentId)}/status`, {
                    headers: getAuthHeaders(),
                });

                const normalizedStatus = String(data.status || '').toLowerCase();
                setLastPaymentStatus({
                    id: paymentId,
                    status: data.status || '...',
                    coinAmount: Number(data.coinAmount || 0),
                    coinsGranted: Boolean(data.coinsGranted),
                    priceAmount: Number(data.priceAmount || 0),
                    priceCurrency: String(data.priceCurrency || 'usd').toUpperCase(),
                });

                if (data.coinsGranted || PAYMENT_FAILURE_STATUSES.includes(normalizedStatus)) {
                    if (pollingTimerRef.current) {
                        clearInterval(pollingTimerRef.current);
                        pollingTimerRef.current = null;
                    }
                    refreshBalance?.();
                }
            } catch (error) {
                if (pollingTimerRef.current) {
                    clearInterval(pollingTimerRef.current);
                    pollingTimerRef.current = null;
                }
                setMessage(text('nowpayment_status_load_failed', { error: error.message }), 'error');
            }
        };

        poll();
        pollingTimerRef.current = setInterval(poll, 3000);

        return () => {
            if (pollingTimerRef.current) {
                clearInterval(pollingTimerRef.current);
                pollingTimerRef.current = null;
            }
        };
    }, [api, isActive, lastPaymentStatus?.id, refreshBalance, setMessage, text]);

    useEffect(() => {
        if (!isActive) return;

        const urlPaymentId = new URLSearchParams(window.location.search).get('paymentId');
        const storedPaymentId = localStorage.getItem('lastNowPaymentId');
        const paymentId = urlPaymentId || storedPaymentId;

        if (paymentId) {
            setLastPaymentStatus((prev) => prev?.id === paymentId ? prev : { id: paymentId });
        }
    }, [isActive]);

    useEffect(() => {
        if (isBelowMinimum) {
            setMessage(text('nowpayment_selected_minimum_error', {
                amount: minimumCoinAmount.toFixed(2),
            }), 'error', 'minimum');
            return;
        }

        if (minimumUnavailable && payCurrency) {
            setMessage(text('nowpayment_minimum_unavailable_message'), 'error', 'minimum');
            return;
        }

        setFeedback((prev) => {
            const isMinimumError = prev?.type === 'error' && prev?.scope === 'minimum';
            return isMinimumError ? { type: '', message: text('nowpayment_initial_message'), scope: '' } : prev;
        });
    }, [isBelowMinimum, minimumCoinAmount, minimumUnavailable, payCurrency, setMessage, text]);

    if (!isActive) return null;

    const handleClose = () => {
        if (onClose) {
            onClose();
            return;
        }

        navigate('/wallet');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isInvalidAmount) {
            setMessage(text('nowpayment_minimum_one_coin'), 'error');
            return;
        }

        if (payCurrency && minimumUnavailable) {
            setMessage(text('nowpayment_minimum_required'), 'error');
            return;
        }

        if (minimumCoinAmount !== null && numericAmount < minimumCoinAmount) {
            setMessage(text('nowpayment_selected_minimum_error', {
                amount: minimumCoinAmount.toFixed(2),
            }), 'error', 'minimum');
            return;
        }

        setIsSubmitting(true);
        setMessage(text('nowpayment_creating'), '');
        try {
            const data = await api('/payments/nowpayments/create', {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    coinAmount: numericAmount,
                    payCurrency: payCurrency || null,
                }),
            });

            localStorage.setItem('lastNowPaymentId', String(data.paymentId));
            window.location.href = data.paymentUrl;
        } catch (error) {
            setIsSubmitting(false);
            setMessage(text('nowpayment_create_failed', { error: error.message }), 'error');
        }
    };

    return (
        <section className="ab-page">
            <div className="ab-page-shell">
                <button className="ab-close" onClick={handleClose} aria-label={t('wallet')} type="button">
                    {/* {t('wallet')}
                     */}
                     x
                </button>

                <div className="ab-wallet-card">
                    {/* <div className="ab-wallet-icon">
                        <img src="/assets/siteImages/usdT.png" alt="USDT Icon" className="ab-wallet-svg" />
                    </div> */}
                    <div className="ab-wallet-info">
                        {/* <div className="ab-wallet-label">{text('nowpayment_method')}</div> */}
                        <div className="ab-wallet-title">{text('nowpayment_buy_coin')}</div>
                        <div className="ab-wallet-subtitle">
                            {text('nowpayment_network_note')}
                        </div>
                        {/* <div className="ab-balance-row">
                            <span>{t('balance')}</span>
                            <strong>{formatAmount(balance)} {t('coins')}</strong>
                        </div> */}
                    </div>
                    <div className="ab-username">{username}</div>
                </div>

                <p className="ab-note ab-note--card">{text('nowpayment_info_note')}</p>

                <section className={`ab-method-section${isMethodPickerCollapsed ? ' is-collapsed' : ''}`} aria-label={text('nowpayment_choose_method')}>
                    <div className="ab-section-heading ab-method-heading">
                        <div>
                            <span className="ab-step-badge">1</span>
                            <h2>
                                <button
                                    type="button"
                                    className="ab-method-title-button"
                                    onClick={handleMethodPickerToggle}
                                    aria-expanded={isMethodPickerOpen}
                                    aria-controls="ab-method-options"
                                >
                                    {text('nowpayment_choose_method')}
                                </button>
                            </h2>
                        </div>
                        <div className="ab-method-heading-side">
                            {selectedMethod && (
                                <strong>{text('nowpayment_selected_method')}: {getMethodLabel(selectedMethod)}</strong>
                            )}
                            {hasSelectedMethod && (
                                <button
                                    type="button"
                                    className="ab-method-toggle"
                                    onClick={handleMethodPickerToggle}
                                    aria-expanded={isMethodPickerOpen}
                                    aria-controls="ab-method-options"
                                    aria-label={text('nowpayment_choose_method')}
                                >
                                    <span className="ab-method-toggle-icon" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div
                        id="ab-method-options"
                        className="ab-method-panel"
                        aria-hidden={isMethodPickerCollapsed ? 'true' : undefined}
                    >
                        <div className="ab-method-grid">
                            {PAYMENT_METHODS.map((option) => {
                                const label = getMethodLabel(option);
                                const isSelected = selectedMethod?.value === option.value;

                                return (
                                    <button
                                        key={option.value || 'auto'}
                                        type="button"
                                        className={`ab-method-card${isSelected ? ' is-selected' : ''}`}
                                        style={{ '--method-a': option.colors[0], '--method-b': option.colors[1] }}
                                        onClick={() => handleMethodSelect(option)}
                                        aria-pressed={isSelected}
                                        aria-label={`${text('nowpayment_choose_method')}: ${label}`}
                                        tabIndex={isMethodPickerCollapsed ? -1 : 0}
                                    >
                                        <span className="ab-method-image-wrap">
                                            <img src={option.image} alt="" className="ab-method-image" aria-hidden="true" />
                                        </span>
                                        <span className="ab-method-body">
                                            <span className="ab-method-name">{label}</span>
                                            <span className="ab-method-minimum">
                                                {/* <span>{label}</span> */}
                                                <span className="ab-method-network">{option.value === '' ? text('nowpayment_auto_method_desc') : option.network}</span>
                                                <strong>{getMethodMinimumText(option)}</strong>
                                            </span>
                                        </span>
                                        <span className="ab-method-check" aria-hidden="true" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* {lastPaymentStatus?.id && (
                    <section className="ab-status-card" aria-label={text('nowpayment_last_status')}>
                        <div className="ab-section-title">{text('nowpayment_last_status')}</div>
                        <div className="ab-status-grid">
                            <div className="ab-preview-item">
                                <span>{text('nowpayment_status')}</span>
                                <strong>{lastPaymentStatus.status || '...'}</strong>
                            </div>
                            <div className="ab-preview-item">
                                <span>{t('coins')}</span>
                                <strong>{lastPaymentStatus.coinAmount === undefined ? '...' : formatAmount(lastPaymentStatus.coinAmount).replace('.00', '')}</strong>
                            </div>
                            <div className="ab-preview-item">
                                <span>{text('nowpayment_granted')}</span>
                                <strong>{lastPaymentStatus.coinsGranted ? text('yes') : text('no')}</strong>
                            </div>
                            <div className="ab-preview-item">
                                <span>{text('nowpayment_price')}</span>
                                <strong>
                                    {lastPaymentStatus.priceAmount === undefined
                                        ? '...'
                                        : `${formatAmount(lastPaymentStatus.priceAmount)} ${lastPaymentStatus.priceCurrency || 'USD'}`}
                                </strong>
                            </div>
                        </div>
                    </section>
                )} */}

                {hasSelectedMethod ? (
                    <form className="ab-form" onSubmit={handleSubmit}>
                        <div className="ab-section-heading ab-section-heading--compact">
                            <div>
                                <span className="ab-step-badge">2</span>
                                <h2>{text('nowpayment_coin_amount')}</h2>
                            </div>
                            {/* <strong>{getMethodLabel(selectedMethod)}</strong> */}
                        </div>

                        <div className="ab-field-row">
                            <div className="ab-field">
                                <label className="ab-label" htmlFor="deposit-amount">{text('nowpayment_coin_amount')}</label>
                                <div className="ab-amount-wrap">
                                    {/* <span className="ab-amount-prefix">#</span> */}
                                    <input
                                        id="deposit-amount"
                                        className="ab-input ab-input--amount"
                                        type="number"
                                        step="1"
                                        min="1"
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="ab-selected-method">
                                <img src={selectedMethod.image} alt="Coin Image" aria-hidden="true" />
                                <span>
                                    <strong>{getMethodLabel(selectedMethod)}</strong>
                                    <small>{selectedMethod.value === '' ? text('nowpayment_auto_method_desc') : selectedMethod.network}</small>
                                </span>
                            </div>
                        </div>

                        <div className="ab-preview-grid">
                            <div className="ab-preview-item">
                                <span>{text('nowpayment_preview_coin')}</span>
                                <strong>{safeAmount.toFixed(0)}</strong>
                            </div>
                            <div className="ab-preview-item">
                                <span>{text('nowpayment_preview_price')}</span>
                                <strong>{safeAmount.toFixed(2)} USD</strong>
                            </div>
                        </div>

                        <div className="ab-payment-hint">{text('nowpayment_hint')}</div>

                        {feedback && (
                            <div className={`ab-feedback${feedback.type ? ` is-${feedback.type}` : ''}`}>
                                {feedback.message}
                            </div>
                        )}

                        <div className="ab-actions">
                            <button type="button" className="ab-btn ab-cancel" onClick={() => setPayCurrency(null)} disabled={isSubmitting}>
                                {text('nowpayment_choose_method')}
                            </button>
                            <button
                                type="submit"
                                className="ab-btn ab-send"
                                disabled={disableBuy}
                                aria-label={text('nowpayment_create_payment')}
                            >
                                {isSubmitting ? text('nowpayment_creating_short') : text('nowpayment_create_payment')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="ab-method-empty">
                        {text('nowpayment_select_method_first')}
                    </div>
                )}
            </div>
        </section>
    );
}
