import type { LucideIcon } from "lucide-react";
import {
  Brain,
  CalendarDays,
  CircleCheck,
  FileText,
  LayoutDashboard,
  NotebookPen,
  Sprout,
  Target,
  Wallet,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Mô tả ngắn dùng cho tooltip và trang tổng quan. */
  description: string;
}

export interface NavSection {
  title: string | null;
  items: NavItem[];
}

/**
 * Nguồn sự thật duy nhất cho điều hướng. Sidebar, command palette và trang
 * landing đều đọc từ đây — thêm module mới chỉ cần thêm một entry.
 */
export const navSections: NavSection[] = [
  {
    title: null,
    items: [
      {
        label: "Tổng quan",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Toàn cảnh một ngày của bạn trong một màn hình.",
      },
    ],
  },
  {
    title: "Hằng ngày",
    items: [
      {
        label: "Lịch",
        href: "/calendar",
        icon: CalendarDays,
        description: "Sự kiện, cuộc hẹn và kế hoạch theo tháng.",
      },
      {
        label: "Công việc",
        href: "/tasks",
        icon: CircleCheck,
        description: "Việc cần làm, ưu tiên và hạn chót.",
      },
      {
        label: "Ghi chú",
        href: "/notes",
        icon: NotebookPen,
        description: "Ghi nhanh ý tưởng trước khi chúng bay mất.",
      },
      {
        label: "Thói quen",
        href: "/habits",
        icon: Sprout,
        description: "Theo dõi chuỗi ngày và nhịp độ đều đặn.",
      },
    ],
  },
  {
    title: "Dài hạn",
    items: [
      {
        label: "Mục tiêu",
        href: "/goals",
        icon: Target,
        description: "Mục tiêu quý, năm và các cột mốc.",
      },
      {
        label: "Chi tiêu",
        href: "/expenses",
        icon: Wallet,
        description: "Dòng tiền, hạn mức và phân bổ theo danh mục.",
      },
    ],
  },
  {
    title: "Lưu trữ",
    items: [
      {
        label: "Tài liệu",
        href: "/documents",
        icon: FileText,
        description: "Giấy tờ cá nhân, hợp đồng và ngày hết hạn.",
      },
      {
        label: "Second Brain",
        href: "/second-brain",
        icon: Brain,
        description: "Kết nối ý tưởng. Mở rộng tư duy.",
      },
    ],
  },
];

/** Danh sách phẳng — tiện cho việc tìm item theo pathname. */
export const navItems: NavItem[] = navSections.flatMap((s) => s.items);
