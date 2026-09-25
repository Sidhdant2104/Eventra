type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function noteFailure(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return current ? false : true;
  }
  current.count += 1;
  return current.count <= limit;
}

export function isLimited(key: string, limit: number) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= Date.now()) return false;
  return current.count >= limit;
}

export function clearLimit(key: string) {
  buckets.delete(key);
}
