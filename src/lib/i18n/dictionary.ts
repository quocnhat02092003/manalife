/**
 * Bộ dịch Việt ↔ Anh của app.
 *
 * Tiếng Việt là bản gốc (`vi` định nghĩa shape, `en` bị ép theo đúng shape
 * đó) — thêm chuỗi mới vào `vi` mà quên dịch là TypeScript báo ngay chứ
 * không rơi rớt âm thầm ở runtime.
 *
 * Ngôn ngữ chọn qua cookie `manalife_locale`: server component đọc bằng
 * `getDict()` (src/lib/i18n/server.ts), client component đọc bằng
 * `useI18n()` (src/lib/i18n/client.tsx). Đổi ngôn ngữ = ghi cookie +
 * router.refresh() — cả cây server lẫn client render lại cùng một ngôn ngữ,
 * không có chuyện server nói tiếng Việt còn client nói tiếng Anh.
 *
 * Phạm vi hiện tại: khung app (điều hướng, header, chuông thông báo) và
 * tiêu đề các trang. Nội dung sâu trong từng module chuyển dần sau — cứ
 * thêm khoá vào đây rồi thay chuỗi cứng bằng `t.…`.
 */

export type Locale = "vi" | "en";

export const LOCALE_COOKIE = "manalife_locale";
export const DEFAULT_LOCALE: Locale = "vi";

export function isLocale(value: unknown): value is Locale {
  return value === "vi" || value === "en";
}

const vi = {
  nav: {
    sections: { daily: "Hằng ngày", longterm: "Dài hạn", archive: "Lưu trữ" },
    items: {
      "/dashboard": { label: "Tổng quan" },
      "/calendar": { label: "Lịch" },
      "/tasks": { label: "Công việc" },
      "/notes": { label: "Ghi chú" },
      "/habits": { label: "Thói quen" },
      "/goals": { label: "Mục tiêu" },
      "/expenses": { label: "Chi tiêu" },
      "/documents": { label: "Tài liệu" },
      "/second-brain": { label: "Second Brain" },
    } as Record<string, { label: string }>,
  },
  shell: {
    searchPlaceholder: "Tìm trong mọi thứ bạn đã lưu…",
    searchAria: "Tìm kiếm",
    openMenu: "Mở menu",
    closeMenu: "Đóng menu",
    accountAria: "Tài khoản và cài đặt",
    settings: "Cài đặt",
    logout: "Thoát",
    language: "Ngôn ngữ",
    switchToEnglish: "Switch to English",
    switchToVietnamese: "Chuyển sang tiếng Việt",
  },
  notifications: {
    title: "Thông báo",
    aria: "Thông báo",
    unreadAria: (count: number) => `Thông báo — ${count} mục chưa đọc`,
    clearAll: "Xoá tất cả",
    empty: "Chưa có thông báo nào.",
  },
  pages: {
    dashboard: {
      morning: "Chào buổi sáng",
      noon: "Chào buổi trưa",
      afternoon: "Chào buổi chiều",
      evening: "Chào buổi tối",
      subtitle: "Đây là toàn cảnh ngày hôm nay của bạn.",
    },
    calendar: {
      title: "Lịch",
      description: "Sự kiện, cuộc hẹn và kế hoạch theo tháng.",
    },
    tasks: {
      title: "Công việc",
      description: "Theo dõi mọi việc cần làm, nhóm theo hạn chót.",
    },
    notes: {
      title: "Ghi chú",
      description: "Mọi ý tưởng, trích dẫn và danh sách của bạn ở một nơi.",
    },
    habits: {
      title: "Thói quen",
      description: "Theo dõi chuỗi ngày và tiến độ tuần của từng thói quen.",
    },
    goals: {
      title: "Mục tiêu",
      description: "Mục tiêu quý, năm và các cột mốc trên đường đi.",
    },
    expenses: {
      title: "Chi tiêu",
      description: "Theo dõi dòng tiền và hạn mức của bạn trong tháng này.",
    },
    documents: {
      title: "Tài liệu",
      description:
        "Giấy tờ, hợp đồng, hình ảnh và video của bạn, luôn tìm lại được khi cần.",
    },
    secondBrain: {
      title: "Second Brain",
      description: "Kết nối ý tưởng. Mở rộng tư duy.",
    },
    settings: {
      title: "Cài đặt",
      description: "Quản lý tài khoản và tuỳ chọn hiển thị của bạn.",
    },
  },
};

/** Shape chuẩn — `en` phải khớp từng khoá với bản gốc tiếng Việt. */
export type Dict = typeof vi;

const en: Dict = {
  nav: {
    sections: { daily: "Daily", longterm: "Long term", archive: "Archive" },
    items: {
      "/dashboard": { label: "Overview" },
      "/calendar": { label: "Calendar" },
      "/tasks": { label: "Tasks" },
      "/notes": { label: "Notes" },
      "/habits": { label: "Habits" },
      "/goals": { label: "Goals" },
      "/expenses": { label: "Expenses" },
      "/documents": { label: "Documents" },
      "/second-brain": { label: "Second Brain" },
    },
  },
  shell: {
    searchPlaceholder: "Search everything you saved…",
    searchAria: "Search",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    accountAria: "Account and settings",
    settings: "Settings",
    logout: "Log out",
    language: "Language",
    switchToEnglish: "Switch to English",
    switchToVietnamese: "Chuyển sang tiếng Việt",
  },
  notifications: {
    title: "Notifications",
    aria: "Notifications",
    unreadAria: (count: number) => `Notifications — ${count} unread`,
    clearAll: "Clear all",
    empty: "No notifications yet.",
  },
  pages: {
    dashboard: {
      morning: "Good morning",
      noon: "Good afternoon",
      afternoon: "Good afternoon",
      evening: "Good evening",
      subtitle: "Here is your day at a glance.",
    },
    calendar: {
      title: "Calendar",
      description: "Events, appointments and plans by month.",
    },
    tasks: {
      title: "Tasks",
      description: "Track everything to do, grouped by deadline.",
    },
    notes: {
      title: "Notes",
      description: "All your ideas, quotes and lists in one place.",
    },
    habits: {
      title: "Habits",
      description: "Track streaks and weekly progress for every habit.",
    },
    goals: {
      title: "Goals",
      description: "Quarterly and yearly goals with milestones on the way.",
    },
    expenses: {
      title: "Expenses",
      description: "Track your cash flow and budgets this month.",
    },
    documents: {
      title: "Documents",
      description:
        "Your papers, contracts, photos and videos — always easy to find.",
    },
    secondBrain: {
      title: "Second Brain",
      description: "Connect ideas. Expand your thinking.",
    },
    settings: {
      title: "Settings",
      description: "Manage your account and display preferences.",
    },
  },
};

export const dictionaries: Record<Locale, Dict> = { vi, en };
