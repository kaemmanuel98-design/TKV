/** Tarifs CdC — ajustables via variables d'environnement. */
export const PLAN_IDS = ['premium', 'premium_plus'];

export function getPlanPricing(planType) {
  const premiumXof = Number(process.env.PREMIUM_AMOUNT_XOF) || 6500;
  const premiumPlusXof = Number(process.env.PREMIUM_PLUS_AMOUNT_XOF) || 9500;
  const premiumEur = Number(process.env.PREMIUM_AMOUNT_EUR_CENTS) || 999;
  const premiumPlusEur = Number(process.env.PREMIUM_PLUS_AMOUNT_EUR_CENTS) || 1499;

  if (planType === 'premium_plus') {
    return {
      planType: 'premium_plus',
      amountCents: premiumPlusXof,
      currency: 'XOF',
      paypalAmount: (premiumPlusEur / 100).toFixed(2),
      paypalCurrency: 'EUR',
      label: 'Premium+',
    };
  }

  return {
    planType: 'premium',
    amountCents: premiumXof,
    currency: 'XOF',
    paypalAmount: (premiumEur / 100).toFixed(2),
    paypalCurrency: 'EUR',
    label: 'Premium',
  };
}

export function subscriptionDurationDays() {
  return Number(process.env.PREMIUM_DURATION_DAYS) || 30;
}
