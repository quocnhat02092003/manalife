import type { User } from "@/types";
import { at } from "./dates";

export const currentUser: User = {
  id: "usr_01",
  name: "Ngô Minh Thuận",
  email: "thuan@luma.vn",
  avatarUrl: null,
  createdAt: at(-240),
};
