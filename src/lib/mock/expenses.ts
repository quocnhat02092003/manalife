import type { Expense, ExpenseCategory } from "@/types";
import { at } from "./dates";

/**
 * Năm danh mục khớp ảnh mẫu. Tỉ lệ mục tiêu: Ăn uống 35%, Di chuyển 20%,
 * Mua sắm 15%, Học tập 15%, Giải trí 15% — trên tổng 8.450.000 ₫.
 */
export const expenseCategories: ExpenseCategory[] = [
  { id: "cat_01", name: "Ăn uống", color: "clay", monthlyBudget: 3_500_000 },
  { id: "cat_02", name: "Di chuyển", color: "brand", monthlyBudget: 2_000_000 },
  { id: "cat_03", name: "Mua sắm", color: "sage", monthlyBudget: 1_500_000 },
  { id: "cat_04", name: "Học tập", color: "violet", monthlyBudget: 1_500_000 },
  { id: "cat_05", name: "Giải trí", color: "sand", monthlyBudget: 1_000_000 },
];

/**
 * Giao dịch trong tháng. Tổng chi đúng bằng 8.450.000 ₫ và tổng mỗi danh mục
 * khớp tỉ lệ trên — biểu đồ tròn ở dashboard tính trực tiếp từ mảng này chứ
 * không hard-code phần trăm.
 *
 *   Ăn uống    2.957.500  (35%)
 *   Di chuyển  1.690.000  (20%)
 *   Mua sắm    1.267.500  (15%)
 *   Học tập    1.267.500  (15%)
 *   Giải trí   1.267.500  (15%)
 *   ───────────────────────────
 *   Tổng       8.450.000  (100%)
 */
export const expenses: Expense[] = [
  // --- Ăn uống: 2.957.500 ---
  { id: "exp_01", amount: 1_250_000, kind: "expense", note: "Đi chợ đầu tháng", categoryId: "cat_01", spentAt: at(-18, 9, 0) },
  { id: "exp_02", amount: 850_000, kind: "expense", note: "Ăn ngoài cuối tuần", categoryId: "cat_01", spentAt: at(-11, 19, 30) },
  { id: "exp_03", amount: 517_500, kind: "expense", note: "Cà phê & ăn sáng", categoryId: "cat_01", spentAt: at(-4, 8, 15) },
  { id: "exp_04", amount: 340_000, kind: "expense", note: "Cơm trưa văn phòng", categoryId: "cat_01", spentAt: at(-1, 12, 0) },

  // --- Di chuyển: 1.690.000 ---
  { id: "exp_05", amount: 900_000, kind: "expense", note: "Đổ xăng", categoryId: "cat_02", spentAt: at(-16, 17, 45) },
  { id: "exp_06", amount: 520_000, kind: "expense", note: "Grab đi họp", categoryId: "cat_02", spentAt: at(-8, 14, 0) },
  { id: "exp_07", amount: 270_000, kind: "expense", note: "Gửi xe tháng", categoryId: "cat_02", spentAt: at(-2, 8, 0) },

  // --- Mua sắm: 1.267.500 ---
  { id: "exp_08", amount: 890_000, kind: "expense", note: "Áo khoác mùa thu", categoryId: "cat_03", spentAt: at(-13, 15, 20) },
  { id: "exp_09", amount: 377_500, kind: "expense", note: "Đồ dùng nhà bếp", categoryId: "cat_03", spentAt: at(-5, 11, 0) },

  // --- Học tập: 1.267.500 ---
  { id: "exp_10", amount: 799_000, kind: "expense", note: "Khoá học thiết kế", categoryId: "cat_04", spentAt: at(-20, 20, 0) },
  { id: "exp_11", amount: 468_500, kind: "expense", note: "Sách Atomic Habits + 2 cuốn khác", categoryId: "cat_04", spentAt: at(-9, 16, 30) },

  // --- Giải trí: 1.267.500 ---
  { id: "exp_12", amount: 620_000, kind: "expense", note: "Vé xem phim & ăn vặt", categoryId: "cat_05", spentAt: at(-14, 20, 30) },
  { id: "exp_13", amount: 400_000, kind: "expense", note: "Spotify + Netflix", categoryId: "cat_05", spentAt: at(-7, 10, 0) },
  { id: "exp_14", amount: 247_500, kind: "expense", note: "Cà phê với bạn", categoryId: "cat_05", spentAt: at(-2, 16, 30) },

  // --- Thu nhập (không tính vào tổng chi) ---
  { id: "exp_15", amount: 25_000_000, kind: "income", note: "Lương tháng", categoryId: "cat_01", spentAt: at(-22, 9, 0) },
  { id: "exp_16", amount: 4_500_000, kind: "income", note: "Dự án freelance", categoryId: "cat_01", spentAt: at(-6, 18, 0) },
];
