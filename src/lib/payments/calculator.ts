import type { Student, Settings, PaymentCurrency } from '@/lib/firebase/types'

export function resolveStudentFee(
  student: Student,
  settings: Settings
): { amount: number; currency: PaymentCurrency } {
  if (student.category === 'india') {
    const amount =
      student.customFeeOverride ??
      settings.indiaFees[student.batchType as keyof typeof settings.indiaFees] ??
      settings.indiaFees.normal
    return { amount, currency: 'INR' }
  }

  // NRI
  const pref = student.nriCurrencyPreference ?? 'usd'
  if (pref === 'usd') {
    const amount =
      student.customFeeOverride ??
      settings.nriFees.usd[student.batchType as keyof typeof settings.nriFees.usd] ??
      settings.nriFees.usd.normal
    return { amount, currency: 'USD' }
  }

  // inr-equivalent
  const amount =
    student.customFeeOverride ??
    settings.nriFees.inrEquivalent[
      student.batchType as keyof typeof settings.nriFees.inrEquivalent
    ] ??
    settings.nriFees.inrEquivalent.normal
  return { amount, currency: 'INR' }
}
