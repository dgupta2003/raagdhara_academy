// Converts Firestore Timestamp objects (and Date objects) to ISO strings
// so data is safe to pass from Server Components to Client Components.
// Next.js requires all Server → Client props to be plain serializable objects.
export function serializeDoc<T extends Record<string, unknown>>(data: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
      result[key] = (value as { toDate: () => Date }).toDate().toISOString();
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
