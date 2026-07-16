import type { Metadata } from "next";
import { Network, Plus } from "lucide-react";
import { captures, knowledgeGraph } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { GraphView } from "@/components/second-brain/graph-view";
import { CapturesBrowser } from "@/components/second-brain/captures-browser";

export const metadata: Metadata = { title: "Second Brain" };

/** Đồ thị tri thức phía trên, bên dưới là toàn bộ nội dung đã lưu. */
export default function SecondBrainPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Second Brain"
        description="Kết nối ý tưởng. Mở rộng tư duy."
        action={
          <Button>
            <Plus size={17} />
            Lưu nội dung
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-start gap-2.5">
            <IconTile icon={Network} tone="brand" size="sm" />
            <div>
              <CardTitle>Đồ thị tri thức</CardTitle>
              <CardDescription>
                Các chủ đề và mối liên kết giữa những gì bạn đã lưu.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="px-5 pb-5">
          <GraphView graph={knowledgeGraph} className="h-90" />
        </div>
      </Card>

      <div className="mt-6">
        <CapturesBrowser captures={captures} />
      </div>
    </div>
  );
}
