/**
 * Nút đăng nhập qua Google / GitHub.
 *
 * Là link thuần (<a>) chứ không phải button + fetch: luồng OAuth là một chuỗi
 * chuyển hướng cả trang, để trình duyệt tự điều hướng là đúng bản chất nhất —
 * không cần JS, không cần state. Vì thế component này là Server Component.
 *
 * Icon Google/GitHub vẽ SVG inline vì lucide-react đã bỏ icon thương hiệu.
 */

const providers = [
  {
    id: "google",
    label: "Google",
    icon: (
      // Chữ G bốn màu theo brand guideline của Google.
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden>
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A11.99 11.99 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a11.99 11.99 0 0 0 0 10.78l4.01-3.11Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
        />
      </svg>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
        <path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55l-.01-2.16c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18a11 11 0 0 1 5.76 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.67.41.35.78 1.05.78 2.12l-.01 3.14c0 .3.2.66.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
      </svg>
    ),
  },
] as const;

export function OAuthButtons() {
  return (
    <div>
      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        <span className="text-[12px] text-ink-faint">hoặc tiếp tục với</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {providers.map((provider) => (
          <a
            key={provider.id}
            href={`/api/auth/oauth/${provider.id}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface text-[15px] font-medium text-ink transition-colors hover:bg-surface-muted"
          >
            {provider.icon}
            {provider.label}
          </a>
        ))}
      </div>
    </div>
  );
}
