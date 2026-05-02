import type { Student, Settings, PaymentCurrency } from '@/lib/firebase/types'

export function resolveStudentFee(
  student: Student,
  settings: Settings,
  exchangeRateUsdToInr = 85
): { amount: number; currency: PaymentCurrency } {
  if (student.category === 'india') {
    const amount =
      student.customFeeOverride ??
      settings.indiaFees[student.batchType as keyof typeof settings.indiaFees] ??
      settings.indiaFees.normal
    return { amount, currency: 'INR' }
  }

  // NRI — new flow: nriUsdFee is the canonical USD amount; nriCurrencyPreference controls whether the
  // invoice is issued in USD (student pays in USD via Razorpay) or INR (converted at invoice time).
  const pref = student.nriCurrencyPreference ?? 'usd'

  if (student.nriUsdFee !== undefined) {
    if (pref === 'usd') {
      return { amount: student.nriUsdFee, currency: 'USD' }
    }
    // inr-equivalent: convert USD → INR paise at the live rate supplied by the caller
    return { amount: Math.round(student.nriUsdFee * exchangeRateUsdToInr * 100), currency: 'INR' }
  }

  // Backward-compat: nriUsdFee not yet set on this student — use old customFeeOverride path
  if (pref === 'usd') {
    const amount =
      student.customFeeOverride ??
      settings.nriFees.usd[student.batchType as keyof typeof settings.nriFees.usd] ??
      settings.nriFees.usd.normal
    return { amount, currency: 'USD' }
  }

  const amount =
    student.customFeeOverride ??
    settings.nriFees.inrEquivalent[student.batchType as keyof typeof settings.nriFees.inrEquivalent] ??
    settings.nriFees.inrEquivalent.normal
  return { amount, currency: 'INR' }
}
