import { NextResponse } from "next/server";
import {
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  createAuthorizationRequest,
  isOAuthProvider,
} from "@/lib/auth/oauth";

/**
 * GET /api/auth/oauth/:provider — bắt đầu luồng đăng nhập OAuth.
 *
 * Sinh `state` chống CSRF (+ code_verifier PKCE với Google), giữ trong cookie
 * ngắn hạn rồi chuyển hướng người dùng sang màn hình consent của provider.
 *
 * Dùng GET là chấp nhận được ở đây: bước này không thay đổi trạng thái nào
 * ngoài một cookie tạm — khác với logout (bắt buộc POST).
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider } = await ctx.params;
  if (!isOAuthProvider(provider)) {
    return new Response("Không hỗ trợ provider này.", { status: 404 });
  }

  const { url, state, codeVerifier } = createAuthorizationRequest(provider);

  const response = NextResponse.redirect(url);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  };
  response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions);
  if (codeVerifier) {
    response.cookies.set(OAUTH_VERIFIER_COOKIE, codeVerifier, cookieOptions);
  }
  return response;
}
