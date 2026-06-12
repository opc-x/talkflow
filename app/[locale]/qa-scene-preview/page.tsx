import { QaScene } from "@/components/scenes/qa-scene";
import type { ArtPackId } from "@/lib/scene-art-pack";

/**
 * 无 auth 的 QaScene 预览 — Playwright / Cursor 视觉迭代
 * /zh/qa-scene-preview?q=What's%20this%3F&a=It's%20a%20pen&artPack=storyset_classroom
 */
export default async function QaScenePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; a?: string; artPack?: string; img?: string }>;
}) {
  const {
    q = "What's this?",
    a = "It's a pen",
    artPack: artPackRaw,
    img: imgRaw,
  } = await searchParams;
  const sceneImageUrl = imgRaw?.trim() || null;
  const artPack: ArtPackId =
    artPackRaw === "talkflow_flat_v2"
      ? "talkflow_flat_v2"
      : artPackRaw === "storyset_classroom"
        ? "storyset_classroom"
        : "talkflow_desk_focus";

  return (
    <div className="min-h-screen bg-[#111] p-6 text-white" data-testid="qa-scene-preview-page">
      <h1 className="mb-2 text-lg font-semibold">QaScene 预览</h1>
      <p className="mb-4 text-sm text-white/60">
        ?q=&amp;a=&amp;img=图片URL（一问一图）|&amp;artPack=… — 有 img 时优先静态图
      </p>
      <div className="mx-auto max-w-lg">
        <QaScene
          question={q}
          answer={a}
          variant="hero"
          interactive
          learnPhase="question"
          artPack={artPack}
          sceneImageUrl={sceneImageUrl}
        />
      </div>
    </div>
  );
}
