// Supabase type helpers to work around supabase-js v2.105+ type inference issues
// The JS SDK resolves all table ops to `never` until the Database generic is fully satisfied.
// We use `as` casts at call sites to maintain our own typed interfaces.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function supa<T>(promise: Promise<{ data: any; error: any }>): Promise<{ data: T | null; error: Error | null }> {
  return promise as unknown as Promise<{ data: T | null; error: Error | null }>;
}
