import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, DollarSign, X } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, isPremium = false }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handlePayment = (method) => {
    alert(t('payment_redirect', { method }));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-panel card card-glass" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label={t('payment_close_aria')}>
          <X size={18} />
        </button>

        <h2 className="text-center page-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          {isPremium ? t('payment_premium_title') : t('payment_support_title')}
        </h2>
        <p className="text-center text-muted mb-6" style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
          {isPremium ? t('payment_premium_desc') : t('payment_support_desc')}
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="btn btn-outline w-full"
            onClick={() => handlePayment('CinetPay')}
            style={{ padding: '1rem 1.25rem', justifyContent: 'space-between', borderColor: 'rgba(0, 200, 83, 0.4)', color: '#4ade80' }}
          >
            <span className="flex items-center gap-2">
              <CreditCard size={20} /> CinetPay (Mobile Money)
            </span>
            <span className="text-muted" style={{ fontSize: '0.8125rem' }}>{t('payment_cinetpay_region')}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline w-full"
            onClick={() => handlePayment('PayPal')}
            style={{ padding: '1rem 1.25rem', justifyContent: 'space-between', borderColor: 'rgba(0, 121, 193, 0.4)', color: '#60a5fa' }}
          >
            <span className="flex items-center gap-2">
              <DollarSign size={20} /> PayPal
            </span>
            <span className="text-muted" style={{ fontSize: '0.8125rem' }}>{t('payment_paypal_region')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
