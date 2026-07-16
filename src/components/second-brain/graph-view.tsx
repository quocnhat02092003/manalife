import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventColor, KnowledgeGraph } from "@/types";

/**
 * Đồ thị tri thức — tái hiện phần "Second Brain" trong ảnh mẫu.
 *
 * Cách dựng: cạnh vẽ bằng SVG nằm dưới (đường nối), node vẽ bằng div HTML
 * nằm trên và định vị tuyệt đối theo phần trăm. Làm vậy để chữ trong node
 * dùng đúng font Inter và tự xuống dòng như text thường — nếu vẽ node bằng
 * <text> trong SVG thì phải tự tính chiều rộng chữ.
 *
 * Toạ độ node là hệ 0–100 (xem `GraphNode` trong src/types).
 */

const nodeTones: Record<EventColor, string> = {
  brand: "bg-brand-600 text-white",
  clay: "bg-clay-soft text-clay",
  violet: "bg-violet-soft text-brand-800",
  sage: "bg-sage-soft text-brand-800",
  sand: "bg-sand-soft text-brand-800",
};

interface GraphViewProps {
  graph: KnowledgeGraph;
  className?: string;
}

export function GraphView({ graph, className }: GraphViewProps) {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  return (
    <div className={cn("relative w-full", className)}>
      {/* Lớp cạnh. preserveAspectRatio="none" để toạ độ % khớp đúng với lớp
          node HTML bên trên dù khung có tỉ lệ bất kỳ. */}
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {graph.edges.map((edge, i) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={
                edge.strength === "strong"
                  ? "var(--color-brand-500)"
                  : "var(--color-line-strong)"
              }
              // vectorEffect giữ nét không bị viewBox kéo giãn, nên đơn vị ở
              // đây là pixel màn hình chứ không phải đơn vị viewBox.
              strokeWidth={1.5}
              strokeDasharray={edge.strength === "weak" ? "4 4" : undefined}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* Lớp node. */}
      {graph.nodes.map((node) => {
        const style = {
          left: `${node.x}%`,
          top: `${node.y}%`,
        } as const;

        if (node.variant === "dot") {
          return (
            <span
              key={node.id}
              style={style}
              aria-hidden
              className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500"
            />
          );
        }

        return (
          <span
            key={node.id}
            style={style}
            className={cn(
              "absolute inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-xl px-3 py-2 text-center text-[12px] leading-tight font-medium whitespace-nowrap",
              node.variant === "primary" && "px-3.5 py-2.5 text-[13px] font-semibold",
              nodeTones[node.color],
            )}
          >
            {node.label}
            {node.starred ? (
              <Star size={12} fill="currentColor" className="shrink-0" />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
