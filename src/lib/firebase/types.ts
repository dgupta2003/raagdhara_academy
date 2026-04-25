export type UserRole = 'admin' | 'student' | 'parent'
export type StudentCategory = 'india' | 'nri'
export type NriCurrencyPreference = 'usd' | 'inr-equivalent'
export type StudentStatus = 'pending' | 'active' | 'inactive'
export type AttendanceStatus = 'present' | 'absent' | 'excused'
export type PaymentCurrency = 'INR' | 'USD'
export type PaymentStatus = 'pending' | 'sent' | 'paid' | 'overdue'

export type FirestoreTimestamp = string | Date | { seconds: number; nanoseconds: number }

export interface User {
  email: string
  role: UserRole
  studentId?: string
  guardianId?: string
  createdAt: FirestoreTimestamp
}

export interface Student {
  uid: string
  email: string
  displayName: string
  phone: string
  countryCode: string
  category: StudentCategory
  nriCurrencyPreference: NriCurrencyPreference
  courseId: string
  batchType: string
  batchLabel?: string
  status: StudentStatus
  enrollmentDate: FirestoreTimestamp
  customFeeOverride?: number
  paymentDueDayOverride?: number
  isMinor?: boolean
  guardianUid?: string
  inviteSentAt?: FirestoreTimestamp
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

export interface Guardian {
  uid: string
  email: string
  displayName: string
  phone: string
  countryCode: string
  relationship: string
  studentIds: string[]
  studentNames?: Record<string, string>
  inviteSentAt?: FirestoreTimestamp
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

export interface Attendance {
  studentId: string
  sessionDate: FirestoreTimestamp
  courseId: string
  batchType: string
  status: AttendanceStatus
  markedBy: string
  markedAt: FirestoreTimestamp
}

export interface Payment {
  studentId: string
  studentName: string
  studentEmail: string
  amount: number
  currency: PaymentCurrency
  convertedAmountInr?: number
  razorpayOrderId?: string
  razorpayPaymentId?: string
  status: PaymentStatus
  dueDate: FirestoreTimestamp
  paidAt?: FirestoreTimestamp
  reminderSentAt?: FirestoreTimestamp
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

export interface Consultation {
  id?: string
  name: string
  email: string
  phone: string
  countryCode: string
  preferredDate: string
  preferredTime: string
  message?: string
  createdAt: FirestoreTimestamp
}

export interface Settings {
  defaultPaymentDay: number
  indiaFees: {
    normal: number
    special: number
    personal: number
  }
  nriFees: {
    usd: {
      normal: number
      special: number
      personal: number
    }
    inrEquivalent: {
      normal: number
      special: number
      personal: number
    }
  }
  reminderDaysAfterDue: number
  updatedAt: FirestoreTimestamp
}
