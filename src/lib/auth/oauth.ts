import { createHash, randomBytes } from "node:crypto";

/**
 * Đăng nhập OAuth qua Google và GitHub — authorization code flow.
 *
 * Luồng chuẩn (xem docs/api/auth.md, mục OAuth):
 *
 *   1. GET /api/auth/oauth/:provider   → sinh `state` chống CSRF (+ PKCE với
 *      Google), lưu vào cookie ngắn hạn rồi chuyển hướng sang provider.
 *   2. Provider gọi về /api/auth/oauth/:provider/callback?code=…&state=…
 *   3. Callback đối chiếu `state` với cookie, đổi `code` lấy access token,
 *      lấy hồ sơ người dùng rồi tạo phiên như đăng nhập thường.
 *
 * File này chỉ chứa phần "nói chuyện với provider" — không đụng database.
 * Phần tìm/tạo user nằm ở route callback.
 */

export const OAUTH_PROVIDERS = ["google", "github"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}

/** Cookie tạm giữ `state` (và code_verifier của PKCE) trong lúc chờ callback. */
export const OAUTH_STATE_COOKIE = "manalife_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "manalife_oauth_verifier";
/** 10 phút — đủ cho người dùng bấm qua màn consent, không dài hơn cần thiết. */
export const OAUTH_COOKIE_MAX_AGE = 600;

/** Hồ sơ đã chuẩn hoá về một shape chung cho mọi provider. */
export interface OAuthProfile {
  /** ID do provider cấp (`sub` của Google, `id` số của GitHub). */
  providerAccountId: string;
  /** Email đã chuẩn hoá chữ thường. Null nếu provider không cung cấp. */
  email: string | null;
  /**
   * Email đã được provider xác minh hay chưa. CHỈ liên kết vào tài khoản
   * có sẵn khi email đã xác minh — nếu không, kẻ tấn công có thể tạo tài
   * khoản GitHub với email của nạn nhân (không xác minh) để chiếm tài khoản.
   */
  emailVerified: boolean;
  name: string;
  avatarUrl: string | null;
}

interface ProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  clientId: () => string;
  clientSecret: () => string;
  /** Google hỗ trợ PKCE; GitHub (OAuth App) thì không. */
  pkce: boolean;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Thiếu biến môi trường ${name}. Xem hướng dẫn trong .env.example.`,
    );
  }
  return value;
}

const providers: Record<OAuthProvider, ProviderConfig> = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    clientId: () => requireEnv("GOOGLE_CLIENT_ID"),
    clientSecret: () => requireEnv("GOOGLE_CLIENT_SECRET"),
    pkce: true,
  },
  github: {
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    // `user:email` để đọc được email primary đã xác minh — endpoint /user
    // có thể trả email null nếu người dùng ẩn email công khai.
    scope: "read:user user:email",
    clientId: () => requireEnv("GITHUB_CLIENT_ID"),
    clientSecret: () => requireEnv("GITHUB_CLIENT_SECRET"),
    pkce: false,
  },
};

/** URL gốc của app — dùng để dựng redirect URI đăng ký với provider. */
export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function redirectUri(provider: OAuthProvider): string {
  return `${appUrl()}/api/auth/oauth/${provider}/callback`;
}

function base64url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

/**
 * Sinh state + code_verifier cho một lượt đăng nhập. `state` chống CSRF:
 * callback không có state khớp với cookie sẽ bị từ chối.
 */
export function createAuthorizationRequest(provider: OAuthProvider) {
  const config = providers[provider];
  const state = base64url(randomBytes(16));
  const codeVerifier = config.pkce ? base64url(randomBytes(32)) : null;

  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", config.clientId());
  url.searchParams.set("redirect_uri", redirectUri(provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  if (codeVerifier) {
    const challenge = base64url(
      createHash("sha256").update(codeVerifier).digest(),
    );
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
  }

  return { url: url.toString(), state, codeVerifier };
}

/** Đổi authorization code lấy access token. Ném lỗi khi provider từ chối. */
export async function exchangeCode(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string | null,
): Promise<string> {
  const config = providers[provider];
  const body = new URLSearchParams({
    client_id: config.clientId(),
    client_secret: config.clientSecret(),
    code,
    redirect_uri: redirectUri(provider),
    grant_type: "authorization_code",
  });
  if (config.pkce && codeVerifier) body.set("code_verifier", codeVerifier);

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // GitHub mặc định trả form-encoded; header này ép cả hai trả JSON.
      Accept: "application/json",
    },
    body,
  });

  const data = (await response.json().catch(() => null)) as {
    access_token?: string;
    error?: string;
  } | null;

  if (!response.ok || !data?.access_token) {
    throw new Error(
      `Đổi code thất bại với ${provider}: ${data?.error ?? response.status}`,
    );
  }
  return data.access_token;
}

/** Lấy hồ sơ người dùng từ provider và chuẩn hoá về `OAuthProfile`. */
export async function fetchProfile(
  provider: OAuthProvider,
  accessToken: string,
): Promise<OAuthProfile> {
  if (provider === "google") return fetchGoogleProfile(accessToken);
  return fetchGithubProfile(accessToken);
}

async function fetchGoogleProfile(accessToken: string): Promise<OAuthProfile> {
  const response = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    throw new Error(`Google userinfo trả về ${response.status}`);
  }
  const data = (await response.json()) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  return {
    providerAccountId: data.sub,
    email: data.email?.toLowerCase() ?? null,
    emailVerified: data.email_verified === true,
    name: data.name?.trim() || data.email?.split("@")[0] || "Người dùng Google",
    avatarUrl: data.picture ?? null,
  };
}

async function fetchGithubProfile(accessToken: string): Promise<OAuthProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
  };

  const userResponse = await fetch("https://api.github.com/user", { headers });
  if (!userResponse.ok) {
    throw new Error(`GitHub /user trả về ${userResponse.status}`);
  }
  const user = (await userResponse.json()) as {
    id: number;
    login: string;
    name?: string | null;
    avatar_url?: string;
  };

  // /user chỉ trả email công khai (thường là null) — email thật nằm ở
  // /user/emails, và ta chỉ nhận email PRIMARY đã VERIFIED.
  let email: string | null = null;
  let emailVerified = false;
  const emailsResponse = await fetch("https://api.github.com/user/emails", {
    headers,
  });
  if (emailsResponse.ok) {
    const emails = (await emailsResponse.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const primary =
      emails.find((e) => e.primary && e.verified) ??
      emails.find((e) => e.verified);
    if (primary) {
      email = primary.email.toLowerCase();
      emailVerified = true;
    }
  }

  return {
    providerAccountId: String(user.id),
    email,
    emailVerified,
    name: user.name?.trim() || user.login,
    avatarUrl: user.avatar_url ?? null,
  };
}
