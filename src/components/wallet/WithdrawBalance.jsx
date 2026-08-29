import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./WithdrawBalance.css";
import { useAppContext } from "../../context/AppContext";

const MIN_WITHDRAW_AMOUNT = 10;

const formatAmount = (value) => {
    const num = Number(value) || 0;
    return num.toFixed(2);
};

const normalizeAmountInput = (value, maxBalance) => {
    if (value === "") return "";

    const normalizedValue = String(value).replace(",", ".");
    const numericValue = Number(normalizedValue);

    if (!Number.isFinite(numericValue)) {
        return "";
    }

    if (numericValue <= 0) {
        return normalizedValue;
    }

    return String(Math.min(numericValue, maxBalance));
};

export default function WithdrawBalance({ isOpen, onClose, username: propUsername, walletAddress }) {
    const {
        t,
        user,
        balance,
        withdrawRequestSubmitting,
        submitWithdrawRequest,
    } = useAppContext();

    const [amount, setAmount] = useState("");
    const [withdrawAddress, setWithdrawAddress] = useState(walletAddress || "");
    const [feedback, setFeedback] = useState(null);

    const username = propUsername || user?.username || localStorage.getItem("username") || "Player";
    const currentBalance = Number(balance) || 0;

    const text = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };

    useEffect(() => {
        if (!isOpen) return undefined;

        setAmount("");
        setWithdrawAddress(walletAddress || user?.walletAddress || "");
        setFeedback(null);

        return () => {
            setFeedback(null);
        };
    }, [isOpen, walletAddress, user?.walletAddress]);

    if (!isOpen) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();

        const numericAmount = Number(amount);
        const trimmedAddress = withdrawAddress.trim();

        if (!numericAmount || numericAmount <= 0) {
            setFeedback({
                type: "error",
                message: text("withdraw_amount_required", "Please enter a valid amount."),
            });
            return;
        }

        if (numericAmount < MIN_WITHDRAW_AMOUNT) {
            setFeedback({
                type: "error",
                message: text("withdraw_min_amount", `Minimum withdraw amount is ${MIN_WITHDRAW_AMOUNT} USDT.`),
            });
            return;
        }

        if (numericAmount > currentBalance) {
            setFeedback({
                type: "error",
                message: text("withdraw_insufficient_balance", "Your balance is not enough for this request."),
            });
            return;
        }

        if (!trimmedAddress) {
            setFeedback({
                type: "error",
                message: text("withdraw_wallet_required", "Please enter a wallet address or card number."),
            });
            return;
        }

        const result = await submitWithdrawRequest({
            amount: numericAmount,
            walletAddress: trimmedAddress,
        });

        if (!result.success) {
            setFeedback({
                type: "error",
                message: result.error || text("withdraw_submit_failed", "Withdraw request could not be submitted."),
            });
            return;
        }

        setAmount("");
        setWithdrawAddress("");
        setFeedback(null);
        onClose?.();
    };

    const modal = (
        <div className="ab-overlay">
            <div className="ab-modal">
                {/* <button className="ab-close" onClick={onClose} aria-label={t("close")}>×</button> */}

                <div className="ab-wallet-card">
                    <div className="ab-wallet-icon ab-wallet-icon--withdraw" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M12 5V15"
                                stroke="currentColor"
                                strokeWidth="1.9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M8.5 8.5L12 5L15.5 8.5"
                                stroke="currentColor"
                                strokeWidth="1.9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <div className="ab-wallet-info">
                        <div className="ab-wallet-label">{t("withdraw_balance")}</div>
                        <div className="wb-summary-row">
                            <div className="wb-username">{username}</div>
                            <div className="wb-balance-pill">
                                <span className="wb-balance-label">{t("balance")}</span>
                                <strong>{formatAmount(balance)}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="ab-note">{t("withdraw_note")}</p>

                <form className="ab-form" onSubmit={handleSubmit}>
                    <label className="ab-label" htmlFor="withdraw-amount">{t("amount")}</label>
                    <input
                        id="withdraw-amount"
                        className="ab-input"
                        type="number"
                        step="0.01"
                        min={MIN_WITHDRAW_AMOUNT}
                        max={currentBalance || undefined}
                        value={amount}
                        onChange={(event) => setAmount(normalizeAmountInput(event.target.value, currentBalance))}
                        placeholder={text("enter_amount", "Enter amount")}
                        required
                    />

                    <label className="ab-label" htmlFor="withdraw-address">{t("wallet_address")}</label>
                    <input
                        id="withdraw-address"
                        className="ab-input"
                        type="text"
                        value={withdrawAddress}
                        onChange={(event) => setWithdrawAddress(event.target.value)}
                        placeholder={text("withdraw_wallet_placeholder", "TRC20 wallet or card number")}
                        required
                    />

                    {feedback && (
                        <div className={`wb-feedback is-${feedback.type}`}>
                            {feedback.message}
                        </div>
                    )}

                    <div className="ab-actions">
                        <button
                            type="button"
                            className="ab-btn ab-cancel"
                            onClick={onClose}
                            disabled={withdrawRequestSubmitting}
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            className="ab-btn ab-send"
                            disabled={withdrawRequestSubmitting}
                            aria-label={t("withdraw_balance")}
                        >
                            {withdrawRequestSubmitting ? t("sending") : t("withdraw_balance")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
