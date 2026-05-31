import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Check, Loader2, CreditCard } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { formatApiError } from '../lib/apiClient';
import { createPaymentCheckout } from '../lib/paymentApi';
import './PaywallModal.css';

const PREMIUM_FEATURES = [
  'paywall_feature_ia_unlimited',
  'paywall_feature_perspectives',
  'paywall_feature_sources',
  'paywall_feature_cells',
  'paywall_feature_visio',
];

const PaywallModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, session } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const startPayPalCheckout = async () => {
    if (!user || !session?.access_token) {
      setError(t('payment_login_required'));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await createPaymentCheckout({
        planType: 'premium',
        paymentMethod: 'paypal',
        accessToken: session.access_token,
      });

      const orderId = result.order?.id;
      if (orderId) {
        sessionStorage.setItem('tkv_pending_order_id', orderId);
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      setError(t('payment_error_title'));
    } catch (err) {
      setError(formatApiError(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className="paywall-modal card">
        <button type="button" className="paywall-close" onClick={handleClose} aria-label={t('payment_close_aria')}>
          <X size={22} />
        </button>

        <h2 id="paywall-title">{t('paywall_title')}</h2>
        <p className="paywall-subtitle text-muted">{t('paywall_payments_intro')}</p>

        {!user && (
          <p className="paywall-login-hint">
            <Link to="/auth" onClick={handleClose}>
              {t('payment_login_required')}
            </Link>
          </p>
        )}

        {error && <p className="paywall-error">{error}</p>}

        <div className="paywall-plans">
          <div className="paywall-plan paywall-plan-featured paywall-plan-selected">
            <h3>{t('paywall_premium')}</h3>
            <p className="paywall-price">{t('paywall_price_premium')}</p>
            <ul>
              {PREMIUM_FEATURES.map((key) => (
                <li key={key}>
                  <Check size={14} />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-lg paywall-next paywall-paypal-btn"
          disabled={!user || busy}
          onClick={startPayPalCheckout}
        >
          {busy ? <Loader2 size={20} className="spin" /> : <CreditCard size={20} />}
          {t('payment_pay_with_paypal')}
        </button>
      </div>
    </div>
  );
};

export default PaywallModal;
