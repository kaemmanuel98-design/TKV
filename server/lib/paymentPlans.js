/** Tarifs CdC — ajustables via variables d'environnement. */
export const PLAN_IDS = ['premium'];

export function getPlanPricing(planType) {
  if (planType !== 'premium') {
    throw new Error('invalid_plan');
  }

  const premiumXof = Number(process.env.PREMIUM_AMOUNT_XOF) || 6500;
  const premiumEur = Number(process.env.PREMIUM_AMOUNT_EUR_CENTS) || 999;

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
