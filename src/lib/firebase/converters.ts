import type {
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore'
import type { User, Student, Attendance, Payment, Consultation, Settings } from './types'

function createConverter<T>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T): DocumentData {
      return { ...data } as DocumentData
    },
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): T {
      return snapshot.data(options) as T
    },
  }
}

export const userConverter = createConverter<User>()
export const studentConverter = createConverter<Student>()
export const attendanceConverter = createConverter<Attendance>()
export const paymentConverter = createConverter<Payment>()
export const consultationConverter = createConverter<Consultation>()
export const settingsConverter = createConverter<Settings>()
