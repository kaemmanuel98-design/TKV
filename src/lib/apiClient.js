export const API_BASE = import.meta.env.VITE_API_URL || '';

/** Parse une réponse HTTP de l’API TKV (JSON attendu). */
export async function parseApiResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else if (!res.ok) {
    const err = new Error(
      res.status === 502 || res.status === 503 || res.status === 504
        ? 'api_unreachable'
        : 'request_failed',
    );
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const code =
      data?.error ||
      (res.status === 401 ? 'unauthorized' : res.status >= 500 ? 'server_error' : 'request_failed');
    const err = new Error(code);
    err.status = res.status;
    err.data = data || {};
    throw err;
  }

  return data;
}

const API_ERROR_I18N = {
  api_unreachable: 'api_error_unreachable',
  request_failed: 'api_error_unreachable',
  unauthorized: 'auth_login_required',
  checkout_failed: 'payment_checkout_failed',
  capture_failed: 'payment_error_title',
  confirm_failed: 'payment_error_title',
  not_found: 'payment_error_title',
  supabase_unavailable: 'payment_checkout_failed',
  paypal_not_configured: 'payment_checkout_failed',
  paypal_auth_failed: 'payment_checkout_failed',
  server_error: 'api_error_unreachable',
};

/** Message utilisateur pour une erreur API (i18n). */
export function formatApiError(err, t) {
  if (!err) return t('auth_error_generic');

  const code = err.message || err.data?.error;
  const i18nKey = API_ERROR_I18N[code];
  if (i18nKey) return t(i18nKey);

  const msg = (err.message || '').toLowerCase();
  if (
    msg.includes('failed to fetch') ||
    msg.includes('load failed') ||
    msg.includes('networkerror') ||
    err.name === 'TypeError'
  ) {
    return t('api_error_unreachable');
  }

  if (err.data?.message) return err.data.message;
  if (code && code !== 'request_failed') return code;
  return t('payment_error_title');
}
