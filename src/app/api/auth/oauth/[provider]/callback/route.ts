import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  exchangeCode,
  fetchProfile,
  isOAuthProvider,
  type OAuthProfile,
  type OAuthProvider,
  appUrl,
} from "@/lib/auth/oauth";
import {
  SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
} from "@/lib/auth/session";

/**
 * GET /api/auth/oauth/:provider/callback — provider gọi về sau khi người
 * dùng đồng ý (hoặc từ chối).
 *
 * Mọi nhánh lỗi đều chuyển hướng về /login?error=… thay vì trả JSON: người
 * đang đứng ở đây là trình duyệt của người dùng, không phải một API client.
 * Chi tiết lỗi thật chỉ ghi vào log server — đưa nguyên văn ra URL vừa lộ
 * thông tin nội bộ vừa vô nghĩa với người dùng.
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params;
  if (!isOAuthProvider(provider)) {
    return new Response("Không hỗ trợ provider này.", { status: 404 });
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(OAUTH_VERIFIER_COOKIE)?.value ?? null;

  // Người dùng bấm "Cancel" ở màn consent, hoặc state không khớp (CSRF /
  // cookie hết hạn sau 10 phút) — quay về login với thông báo chung.
  if (!code || !state || !storedState || state !== storedState) {
    return redirectToLogin("oauth_denied");
  }

  let profile: OAuthProfile;
  try {
    const accessToken = await exchangeCode(provider, code, codeVerifier);
    profile = await fetchProfile(provider, accessToken);
  } catch (error) {
    console.error(`[oauth] ${provider} callback thất bại:`, error);
    return redirectToLogin("oauth_failed");
  }

  // Không có email đã xác minh thì không định danh được người dùng một cách
  // an toàn — từ chối thay vì tạo tài khoản mồ côi.
  if (!profile.email || !profile.emailVerified) {
    return redirectToLogin("oauth_no_email");
  }

  const user = await findOrCreateUser(provider, profile);

  const { token, expiresAt } = await createSession(user.id, {
    userAgent: request.headers.get("user-agent"),
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  const response = NextResponse.redirect(new URL("/dashboard", appUrl()));
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  // Dọn cookie tạm của lượt OAuth — đã xong việc.
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);
  return response;
}

function redirectToLogin(error: string) {
  const url = new URL("/login", appUrl());
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);
  return response;
}

/**
 * Tìm user theo thứ tự ưu tiên:
 *
 * 1. Đã từng đăng nhập bằng provider này → dùng liên kết sẵn có.
 * 2. Có tài khoản trùng email (đã xác minh ở phía provider) → liên kết thêm
 *    provider vào tài khoản đó. Nhờ đó người đăng ký bằng mật khẩu vẫn đăng
 *    nhập được bằng Google/GitHub cùng email mà không sinh tài khoản đôi.
 * 3. Chưa có gì → tạo user mới (passwordHash = null, không có mật khẩu).
 */
async function findOrCreateUser(provider: OAuthProvider, profile: OAuthProfile) {
  const email = profile.email!;

  const linked = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });
  if (linked) return linked.user;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.oAuthAccount.create({
      data: {
        userId: existing.id,
        provider,
        providerAccountId: profile.providerAccountId,
      },
    });
    // Tài khoản cũ chưa có ảnh đại diện thì mượn của provider luôn.
    if (!existing.avatarUrl && profile.avatarUrl) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { avatarUrl: profile.avatarUrl },
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      name: profile.name,
      email,
      passwordHash: null,
      avatarUrl: profile.avatarUrl,
      oauthAccounts: {
        create: {
          provider,
          providerAccountId: profile.providerAccountId,
        },
      },
    },
  });
}
