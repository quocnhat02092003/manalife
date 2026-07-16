import { NextResponse, type NextRequest } from "next/server";

/**
 * Giới hạn tần suất trong bộ nhớ — đủ cho một tiến trình server duy nhất.
 * Khi scale ngang (nhiều instance), thay ruột hàm bằng Redis; chữ ký giữ
 * nguyên. docs/api/auth.md: 5 lần / 15 phút / IP cho register và login.
 */

interface Bucket {
  /** Mốc thời gian (ms) của các lần gọi còn nằm trong cửa sổ. */
  hits: number[];
}

const buckets = new Map<string, Bucket>();

/** Dọn bucket rỗng định kỳ để Map không phình mãi theo số IP đã từng ghé. */
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
let lastSweep = Date.now();

function sweep(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  );
}

/**
 * Trả về response 429 nếu `key` đã vượt `limit` lần trong `windowMs`, ngược
 * lại ghi nhận lần gọi này và trả null. Dùng ở dòng đầu route handler:
 *
 *   const limited = rateLimit(`login:${clientIp(request)}`, 5, 15 * 60_000);
 *   if (limited) return limited;
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  sweep(windowMs);

  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const retryAfter = Math.ceil(
      (bucket.hits[0] + windowMs - now) / 1000,
    );
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Bạn thao tác quá nhanh. Thử lại sau ít phút.",
        },
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return null;
}
