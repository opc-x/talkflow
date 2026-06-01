import { QaScene } from "@/components/scenes/qa-scene";

/**
 * 无 auth 的 QaScene 预览 — Playwright / Cursor 视觉迭代
 * /zh/qa-scene-preview?q=What's%20this%3F&a=It's%20a%20pen
 */
export default async function QaScenePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; a?: string }>;
}) {
  const { q = "What's this?", a = "It's a pen" } = await searchParams;

  return (
    <div className="min-h-screen bg-[#111] p-6 text-white" data-testid="qa-scene-preview-page">
      <h1 className="mb-2 text-lg font-semibold">QaScene 预览</h1>
      <p className="mb-4 text-sm text-white/60">?q=问题&amp;a=答案 — npm run test:visual 截图</p>
      <div className="mx-auto max-w-lg">
        <QaScene question={q} answer={a} variant="hero" interactive />
        <p className="mt-4 text-center text-xl">{q}</p>
        <p className="mt-1 text-center text-sm text-white/50">{a}</p>
      </div>
    </div>
  );
}
