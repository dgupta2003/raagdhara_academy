import { adminDb } from '@/lib/firebase/admin'

export async function canAccessPayment(uid: string, studentId: string): Promise<boolean> {
  const userDoc = await adminDb.collection('users').doc(uid).get()
  const user = userDoc.data()
  if (!user) return false

  if (user.role === 'admin') return true

  if (user.role === 'student') {
    // Invited students: users/{authUid}.studentId holds the Firestore doc ID (≠ authUid)
    const effectiveId: string = user.studentId ?? uid
    return effectiveId === studentId
  }

  if (user.role === 'parent') {
    const guardianDoc = await adminDb.collection('guardians').doc(uid).get()
    const guardian = guardianDoc.data()
    return Array.isArray(guardian?.studentIds) && guardian.studentIds.includes(studentId)
  }

  return false
}
