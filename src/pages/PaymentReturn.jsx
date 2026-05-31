import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { formatApiError } from '../lib/apiClient';
import { capturePayPalPayment, fetchPaymentOrder } from '../lib/paymentApi';
import './PaymentReturn.css';

const PaymentReturn = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { session } = useAuthStore();
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const user = useAuthStore((s) => s.user);

  const status = params.get('status');
  const sandbox = params.get('sandbox');
  const paypalToken = params.get('token');
  const orderId = params.get('order_id') || sessionStorage.getItem('tkv_pending_order_id');
  const reference = params.get('reference');

  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = session?.access_token;
      if (!token || !user?.id) {
        setState('auth');
        return;
      }

      if (status === 'cancel') {
        setState('cancel');
        return;
      }

      try {
        if (sandbox === '1' && orderId) {
          setState('success');
          setMessage(t('payment_sandbox_success'));
          await fetchProfile(user.id);
          return;
        }

        if (paypalToken && orderId) {
          await capturePayPalPayment({
            orderId,
            paypalOrderId: paypalToken,
            accessToken: token,
          });
          if (!cancelled) {
            setState('success');
            await fetchProfile(user.id);
          }
          return;
        }

        if (orderId) {
          const { order } = await fetchPaymentOrder(orderId, token);
          if (order?.status === 'paid') {
            setState('success');
            await fetchProfile(user.id);
            return;
          }
          if (order?.status === 'awaiting_confirmation') {
            setState('pending');
            setMessage(reference || order.reference_code);
            return;
          }
        }

        setState('pending');
        setMessage(reference || '');
      } catch (err) {
        if (!cancelled) {
          setState('error');
          setMessage(formatApiError(err, t));
        }
      } finally {
        sessionStorage.removeItem('tkv_pending_order_id');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, sandbox, paypalToken, orderId, reference, session, user, fetchProfile, t]);

  return (
    <div className="container payment-return animate-fade-in">
      {state === 'loading' && (
        <p className="payment-return-status">
          <Loader2 size={24} className="spin" />
          {t('payment_processing')}
        </p>
      )}
      {state === 'success' && (
        <div className="payment-return-box card">
          <CheckCircle size={48} color="var(--gold-bright)" />
          <h1>{t('payment_success_title')}</h1>
          <p>{t('payment_success_desc')}</p>
          {message && <p className="text-muted">{message}</p>}
          <Link to="/profile" className="btn btn-primary">
            {t('tab_profile')}
          </Link>
        </div>
      )}
      {state === 'pending' && (
        <div className="payment-return-box card">
          <h1>{t('payment_pending_title')}</h1>
          <p>{t('payment_pending_desc')}</p>
          {message && <p className="payment-return-ref">{message}</p>}
          <Link to="/profile" className="btn btn-outline">
            {t('tab_profile')}
          </Link>
        </div>
      )}
      {state === 'cancel' && (
        <div className="payment-return-box card">
          <XCircle size={48} />
          <h1>{t('payment_cancel_title')}</h1>
          <Link to="/profile" className="btn btn-outline">
            {t('payment_close_aria')}
          </Link>
        </div>
      )}
      {state === 'auth' && (
        <div className="payment-return-box card">
          <p>{t('require_auth_desc')}</p>
          <Link to="/auth" className="btn btn-primary">
            {t('layout_login')}
          </Link>
        </div>
      )}
      {state === 'error' && (
        <div className="payment-return-box card">
          <XCircle size={48} />
          <h1>{t('payment_error_title')}</h1>
          <p className="text-muted">{message}</p>
          <Link to="/profile" className="btn btn-outline">
            {t('tab_profile')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default PaymentReturn;
