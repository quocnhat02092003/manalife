/**
 * Hình minh hoạ nét ở góc trái landing: chậu cây, chồng sách và cốc cà phê.
 *
 * Vẽ tay bằng SVG line art thay vì dùng ảnh — file nhẹ, nét luôn sắc ở mọi
 * độ phân giải, và màu ăn theo `currentColor` nên tự khớp với brand.
 */
export function StillLife({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 300"
      fill="none"
      className={className}
      role="img"
      aria-label="Hình minh hoạ: chậu cây, chồng sách và cốc cà phê"
    >
      <g
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Thân cây */}
        <path d="M126 92c0 40 4 76 6 96" />

        {/* Lá trái */}
        <path d="M126 108c-14-2-30-12-36-26-2-6 0-11 6-12 16-3 32 12 34 30 0 5-1 8-4 8Z" />
        <path d="M124 146c-16-1-34-11-41-26-3-6 0-12 7-13 18-3 36 13 38 32 0 5-1 8-4 7Z" />

        {/* Lá phải */}
        <path d="M130 96c12-6 24-20 25-36 0-6-4-10-10-8-15 5-24 24-20 41 1 4 3 5 5 3Z" />
        <path d="M132 134c15-4 32-17 36-34 1-6-3-11-9-9-18 4-31 22-30 40 0 5 2 6 3 3Z" />
        <path d="M134 172c14-3 30-14 35-29 2-5-2-10-8-8-17 4-29 20-29 35 0 4 1 4 2 2Z" />

        {/* Chậu */}
        <path d="M96 192h72l-8 62a10 10 0 0 1-10 9h-36a10 10 0 0 1-10-9l-8-62Z" />
        <path d="M90 192h84" />

        {/* Chồng sách */}
        <path d="M182 232h96v18h-96z" />
        <path d="M188 250h84v18h-84z" />
        <path d="M176 268h108v18H176z" />
        {/* Gáy sách */}
        <path d="M196 232v18M204 232v18" />

        {/* Cốc cà phê */}
        <path d="M226 196h44v26a16 16 0 0 1-16 16h-12a16 16 0 0 1-16-16v-26Z" />
        <path d="M270 202h8a9 9 0 0 1 0 18h-8" />

        {/* Mặt bàn */}
        <path d="M64 286h236" />
      </g>
    </svg>
  );
}
