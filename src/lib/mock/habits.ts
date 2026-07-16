import type { Habit, HabitEntry } from "@/types";
import { at, dayKey } from "./dates";

/** Bốn thói quen khớp ảnh mẫu: Thiền 6/7, Đọc sách 7/7, Tập luyện 4/7, Ngủ sớm 5/7. */
export const habits: Habit[] = [
  {
    id: "hab_01",
    name: "Thiền 10 phút",
    icon: "Flower2",
    color: "brand",
    targetPerWeek: 7,
    archivedAt: null,
    createdAt: at(-90),
  },
  {
    id: "hab_02",
    name: "Đọc sách",
    icon: "BookOpen",
    color: "brand",
    targetPerWeek: 7,
    archivedAt: null,
    createdAt: at(-120),
  },
  {
    id: "hab_03",
    name: "Tập luyện",
    icon: "Dumbbell",
    color: "brand",
    targetPerWeek: 7,
    archivedAt: null,
    createdAt: at(-60),
  },
  {
    id: "hab_04",
    name: "Ngủ trước 23:00",
    icon: "Moon",
    color: "brand",
    targetPerWeek: 7,
    archivedAt: null,
    createdAt: at(-45),
  },
];

/**
 * Mẫu hoàn thành 7 ngày gần nhất (index 0 = 6 ngày trước, index 6 = hôm nay).
 * Số lượng `true` khớp đúng với con số hiển thị trong ảnh mẫu.
 */
const weekPattern: Record<string, boolean[]> = {
  hab_01: [true, true, true, true, true, true, false], // 6/7
  hab_02: [true, true, true, true, true, true, true], // 7/7
  hab_03: [true, true, false, true, true, false, false], // 4/7
  hab_04: [true, true, true, false, true, true, false], // 5/7
};

export const habitEntries: HabitEntry[] = habits.flatMap((habit) =>
  weekPattern[habit.id].map((done, i) => ({
    id: `hen_${habit.id}_${i}`,
    habitId: habit.id,
    date: dayKey(i - 6),
    done,
  })),
);

/** Số ngày đã hoàn thành trong tuần này của một thói quen. */
export function weeklyCount(habitId: string): number {
  return weekPattern[habitId]?.filter(Boolean).length ?? 0;
}

/** Dải 7 ngày dùng để vẽ DotStreak. */
export function weekStreak(habitId: string): boolean[] {
  return weekPattern[habitId] ?? [];
}
