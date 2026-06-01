"use client";

import { useState } from "react";
import { Lesson1Scene } from "@/components/scenes/lesson1-scene";

export default function Lesson1PreviewPage() {
  const [highlight, setHighlight] = useState<string>("pen");
  const [animation, setAnimation] = useState<"pulse" | "shake" | "bounce" | "none">("pulse");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">
          Lesson 1 Scene Preview
        </h1>

        {/* 控制面板 */}
        <div className="mb-6 flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Highlight:</span>
            {["pen", "pencil", "book", "none"].map((item) => (
              <button
                key={item}
                onClick={() => setHighlight(item === "none" ? "" : item)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  highlight === item || (item === "none" && !highlight)
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Animation:</span>
            {(["pulse", "shake", "bounce", "none"] as const).map((anim) => (
              <button
                key={anim}
                onClick={() => setAnimation(anim)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  animation === anim
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {anim}
              </button>
            ))}
          </div>
        </div>

        {/* 场景预览 */}
        <div className="overflow-hidden rounded-3xl bg-white p-4 shadow-2xl">
          <Lesson1Scene
            highlight={highlight || undefined}
            animation={animation}
            label={highlight ? highlight.toUpperCase() : undefined}
            showAnswerCard={!!highlight}
          />
        </div>

        {/* 示例问答 */}
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-700">Quick Examples:</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => { setHighlight("pen"); setAnimation("pulse"); }}
              className="rounded-xl bg-white p-4 text-left shadow-md hover:shadow-lg transition-shadow"
            >
              <p className="text-sm font-medium text-slate-500">What&apos;s this?</p>
              <p className="text-base font-semibold text-emerald-600">It&apos;s a pen.</p>
            </button>
            <button
              onClick={() => { setHighlight("book"); setAnimation("pulse"); }}
              className="rounded-xl bg-white p-4 text-left shadow-md hover:shadow-lg transition-shadow"
            >
              <p className="text-sm font-medium text-slate-500">What&apos;s this?</p>
              <p className="text-base font-semibold text-emerald-600">It&apos;s a book.</p>
            </button>
            <button
              onClick={() => { setHighlight("pencil"); setAnimation("shake"); }}
              className="rounded-xl bg-white p-4 text-left shadow-md hover:shadow-lg transition-shadow"
            >
              <p className="text-sm font-medium text-slate-500">Is this a pen?</p>
              <p className="text-base font-semibold text-red-600">No, it&apos;s a pencil.</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
