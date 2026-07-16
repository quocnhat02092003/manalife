import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut, Palette, Shield, User } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Cài đặt" };

/**
 * Cài đặt tài khoản.
 *
 * TẦNG UI — các trường hiện chỉ hiển thị, chưa lưu. Khi nối API: form hồ sơ
 * gọi `PATCH /api/me`, form mật khẩu gọi `POST /api/auth/change-password`
 * (xem docs/api/auth.md).
 */
/** Tên hiển thị của từng provider OAuth. */
const providerLabels: Record<string, string> = {
  google: "Google",
  github: "GitHub",
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const currentUser = session.user;

  // Tài khoản chỉ đăng nhập qua OAuth (passwordHash = null) không có mật
  // khẩu để đổi — thẻ Bảo mật hiển thị lời giải thích thay vì form vô nghĩa.
  const account = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      passwordHash: true,
      oauthAccounts: { select: { provider: true } },
    },
  });
  const hasPassword = Boolean(account?.passwordHash);
  const linkedProviders = (account?.oauthAccounts ?? [])
    .map((a) => providerLabels[a.provider] ?? a.provider)
    .join(", ");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Cài đặt"
        description="Quản lý tài khoản và tuỳ chọn hiển thị của bạn."
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <IconTile icon={User} tone="brand" size="sm" />
              <CardTitle>Hồ sơ</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3.5">
              <Avatar name={currentUser.name} src={currentUser.avatarUrl} />
              <div>
                <p className="text-sm font-semibold text-ink">
                  {currentUser.name}
                </p>
                <p className="text-[13px] text-ink-soft">{currentUser.email}</p>
              </div>
              <Button variant="secondary" size="sm" className="ml-auto">
                Đổi ảnh
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên hiển thị" htmlFor="displayName">
                <Input id="displayName" defaultValue={currentUser.name} />
              </Field>
              <Field
                label="Email"
                htmlFor="accountEmail"
                hint="Đổi email cần xác nhận qua hộp thư."
              >
                <Input
                  id="accountEmail"
                  type="email"
                  defaultValue={currentUser.email}
                />
              </Field>
            </div>

            <div className="flex justify-end">
              <Button>Lưu thay đổi</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <IconTile icon={Shield} tone="clay" size="sm" />
              <CardTitle>Bảo mật</CardTitle>
            </div>
          </CardHeader>
          {hasPassword ? (
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mật khẩu hiện tại" htmlFor="currentPassword">
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </Field>
                <Field
                  label="Mật khẩu mới"
                  htmlFor="newPassword"
                  hint="Ít nhất 8 ký tự."
                >
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button variant="secondary">Đổi mật khẩu</Button>
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                Tài khoản của bạn đăng nhập qua{" "}
                <span className="font-medium text-ink">
                  {linkedProviders || "nhà cung cấp bên ngoài"}
                </span>{" "}
                nên không dùng mật khẩu — việc bảo mật do bên đó đảm nhiệm.
                Không có gì để đổi ở đây.
              </p>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <IconTile icon={Palette} tone="violet" size="sm" />
              <CardTitle>Giao diện</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-[13px] text-ink-soft">
              manalife hiện chỉ có giao diện sáng. Chế độ tối đang được xây
              dựng.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-semibold text-ink">Đăng xuất</p>
              <p className="text-[13px] text-ink-soft">
                Kết thúc phiên làm việc trên thiết bị này.
              </p>
            </div>
            <Link href="/logout">
              <Button variant="secondary">
                <LogOut size={15} />
                Đăng xuất
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
