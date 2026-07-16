import { useSyncExternalStore } from "react";

/**
 * Trung tâm thông báo trong app — chuông ở Topbar đọc từ đây.
 *
 * Store thuần client (module singleton + localStorage): khác với toast là
 * phản hồi tức thời rồi biến mất, thông báo ở chuông được GIỮ LẠI để người
 * dùng xem lại những gì đã xảy ra. Mọi module chỉ cần gọi `notify()` —
 * không context, không provider, component nào cũng subscribe được qua
 * `useNotifications()`.
 *
 * Chưa lưu server: thông báo nằm ở máy/trình duyệt hiện tại. Khi nào cần
 * đồng bộ đa thiết bị thì thay ruột store bằng API — chữ ký giữ nguyên.
 */

export interface AppNotification {
  id: string;
  title: string;
  description?: string;
  /** Bấm vào thông báo thì đi đâu (ví dụ "/calendar"). */
  href?: string;
  read: boolean;
  createdAt: string;
}

const STORAGE_KEY = "manalife_notifications";
/** Giữ tối đa 50 mục — chuông là nhật ký gần đây, không phải kho lưu trữ. */
const MAX_ITEMS = 50;

let snapshot: AppNotification[] = [];
let loaded = false;
const listeners = new Set<() => void>();

/** Nạp từ localStorage đúng một lần, và chỉ ở trình duyệt. */
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    if (Array.isArray(parsed)) snapshot = parsed as AppNotification[];
  } catch {
    // Dữ liệu hỏng thì bắt đầu lại từ rỗng — thông báo không phải dữ liệu quý.
  }
}

function set(next: AppNotification[]) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage đầy/bị chặn — thông báo vẫn sống trong phiên hiện tại.
  }
  listeners.forEach((listener) => listener());
}

/** Đẩy một thông báo mới lên đầu danh sách (và lên chuông ở header). */
export function notify(input: {
  title: string;
  description?: string;
  href?: string;
}) {
  load();
  set(
    [
      {
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description,
        href: input.href,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...snapshot,
    ].slice(0, MAX_ITEMS),
  );
}

export function markAllRead() {
  load();
  if (!snapshot.some((n) => !n.read)) return; // Không đổi gì thì đừng re-render.
  set(snapshot.map((n) => (n.read ? n : { ...n, read: true })));
}

export function clearAll() {
  load();
  if (snapshot.length > 0) set([]);
}

const EMPTY: AppNotification[] = [];

/** Danh sách thông báo, mới nhất trước. Tự re-render khi có mục mới. */
export function useNotifications(): AppNotification[] {
  return useSyncExternalStore(
    (callback) => {
      load();
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => {
      load();
      return snapshot;
    },
    // Server render chưa có localStorage — trả rỗng, client tự cập nhật sau.
    () => EMPTY,
  );
}
