import Link from "next/link";
import { ArrowUpRight, Network } from "lucide-react";
import { knowledgeGraph } from "@/lib/mock";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { GraphView } from "@/components/second-brain/graph-view";

/** Xem trước đồ thị tri thức, bấm vào mở trang Second Brain đầy đủ. */
export function SecondBrainWidget() {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex items-start gap-2.5">
          <IconTile icon={Network} tone="brand" size="sm" />
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Second Brain</h2>
            <p className="text-[12px] text-ink-soft">
              Kết nối ý tưởng. Mở rộng tư duy.
            </p>
          </div>
        </div>
        <Link
          href="/second-brain"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-brand-700 transition-colors hover:bg-brand-50"
        >
          Mở rộng
          <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="px-5 pt-2 pb-5">
        <GraphView graph={knowledgeGraph} className="h-52 sm:h-56" />
      </div>
    </Card>
  );
}
