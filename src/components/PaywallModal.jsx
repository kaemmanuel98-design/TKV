import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
import './PaywallModal.css';

const PaywallModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const plans = [
    {
      id: 'free',
      name: t('paywall_free'),
      features: [t('paywall_feature_ia_3')],
      highlight: false,
    },
    {
      id: 'premium',
      name: t('paywall_premium'),
      price: '9,99 £',
      features: [
        t('paywall_feature_ia_30'),
        t('paywall_feature_perspectives'),
        t('paywall_feature_sources'),
      ],
      highlight: true,
    },
    {
      id: 'premium_plus',
      name: t('paywall_premium_plus'),
      price: '14,99 £',
      features: [t('paywall_feature_ia_unlimited'), t('paywall_feature_perspectives')],
      highlight: false,
    },
  ];

  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <div className="paywall-modal card">
        <button type="button" className="paywall-close" onClick={onClose} aria-label={t('payment_close_aria')}>
          <X size={22} />
        </button>
        <h2 id="paywall-title">{t('paywall_title')}</h2>
        <p className="paywall-coming text-muted">{t('paywall_coming')}</p>
        <div className="paywall-plans">
          {plans.map((plan) => (
            <article key={plan.id} className={`paywall-plan ${plan.highlight ? 'paywall-plan-featured' : ''}`}>
              <h3>{plan.name}</h3>
              {plan.price && (
                <p className="paywall-price">
                  {plan.price}
                  <span>{t('paywall_per_month')}</span>
                </p>
              )}
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>
                    <Check size={14} />
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <button type="button" className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={onClose}>
          {t('payment_close_aria')}
        </button>
      </div>
    </div>
  );
};

export default PaywallModal;
