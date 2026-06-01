"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VisualState } from "@/lib/visual-state";
import { inferVisualState } from "@/lib/parse-qa-visual";
import { RoomTemplate } from "@/components/scenes/room-template";
import { SceneShakeMarkers, SceneSpotlight } from "@/components/scenes/scene-spotlight";
import { ScenePointer, SceneSprites, PropSpriteDefs } from "@/components/scenes/scene-sprites";
import { CitySprite, TownSprite, VillageSprite, PersonSprite } from "@/components/scenes/prop-sprites";
import "./scene-effects.css";

/**
 * 人物名单卡片 - 用于 "It's a man. It's a woman." 类型的问答
 */
function RosterCard({ roster }: { roster: string[] }) {
  const n = roster.length;
  const spacing = n <= 2 ? 120 : n === 3 ? 104 : 86;
  const startX = 200 - ((n - 1) * spacing) / 2;
  return (
    <div className="relative h-full w-full overflow-hidden">
      <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="people">
        {/* 教室背景 */}
        <defs>
          <linearGradient id="rosterWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF9F0" />
            <stop offset="100%" stopColor="#F5EBE0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="400" height="220" fill="url(#rosterWallGrad)" />
        <rect x="0" y="220" width="400" height="80" fill="#E8D4BC" />
        <rect x="0" y="220" width="400" height="6" fill="#D6C3A8" />
        
        {roster.map((p, i) => {
          const x = startX + i * spacing;
          const w = Math.max(52, p.length * 10 + 24);
          return (
            <g key={p}>
              {/* 入场动画 */}
              <animate
                attributeName="opacity"
                values="0;1"
                dur="0.5s"
                begin={`${i * 0.2}s`}
                fill="freeze"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,20;0,0`}
                dur="0.5s"
                begin={`${i * 0.2}s`}
                fill="freeze"
              />
              {/* 人物 */}
              <g transform={`translate(${x}, 200) scale(1.2)`}>
                <PersonSprite sprite={p} />
              </g>
              {/* 名字标签 */}
              <g transform={`translate(${x}, 256)`}>
                <rect x={-w / 2} y="-12" width={w} height="24" rx="12" fill="#10B981" />
                <rect x={-w / 2} y="-12" width={w} height="8" rx="4" fill="#34D399" opacity="0.3" />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {p}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * 地点形状组件
 */
function PlaceShape({ place, dimmed }: { place: string; dimmed?: boolean }) {
  switch (place) {
    case "city":
      return <CitySprite dimmed={dimmed} />;
    case "town":
      return <TownSprite dimmed={dimmed} />;
    case "village":
      return <VillageSprite dimmed={dimmed} />;
    default:
      return null;
  }
}

/**
 * 对比卡片 - 用于 city/town/village 类型的问答
 */
function ContrastCard({
  wrong,
  right,
}: {
  wrong: string | null;
  right: string;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label={`${right} scene`}>
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="60%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>
          <radialGradient id="sunGlow" cx="15%" cy="20%" r="30%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* 天空 */}
        <rect x="0" y="0" width="400" height="300" fill="url(#skyGrad)" />
        
        {/* 太阳 */}
        <circle cx="60" cy="50" r="24" fill="#FDE68A" />
        <circle cx="60" cy="50" r="32" fill="url(#sunGlow)" />
        
        {/* 云朵 */}
        <g opacity="0.9">
          <ellipse cx="300" cy="42" rx="38" ry="14" fill="#fff" />
          <ellipse cx="328" cy="48" rx="26" ry="12" fill="#fff" />
          <ellipse cx="280" cy="50" rx="20" ry="10" fill="#fff" />
        </g>
        <g opacity="0.7">
          <ellipse cx="140" cy="70" rx="28" ry="10" fill="#fff" />
          <ellipse cx="160" cy="76" rx="18" ry="8" fill="#fff" />
        </g>
        
        {/* 地面 */}
        <rect x="0" y="226" width="400" height="74" fill="#86EFAC" />
        <rect x="0" y="226" width="400" height="8" fill="#4ADE80" />
        {/* 草地纹理 */}
        <g opacity="0.3">
          <ellipse cx="50" cy="260" rx="20" ry="4" fill="#22C55E" />
          <ellipse cx="150" cy="280" rx="25" ry="5" fill="#22C55E" />
          <ellipse cx="320" cy="270" rx="22" ry="4" fill="#22C55E" />
        </g>

        {wrong ? (
          <>
            {/* 错误选项 - 左侧，灰暗 + ✗ */}
            <g transform="translate(112, 192) scale(1.6)" opacity="0.5">
              <PlaceShape place={wrong} dimmed />
            </g>
            <g transform="translate(112, 252)">
              <circle cx="0" cy="0" r="16" fill="#fff" stroke="#EF4444" strokeWidth="3" />
              <path d="M -6 -6 L 6 6 M 6 -6 L -6 6" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
            </g>
            
            {/* 正确选项 - 右侧，高亮 + ✓ */}
            <g transform="translate(288, 190) scale(1.7)">
              <PlaceShape place={right} />
            </g>
            {/* 高亮光环 */}
            <circle cx="288" cy="180" r="70" fill="none" stroke="#10B981" strokeWidth="3" opacity="0.5">
              <animate attributeName="r" values="66;76;66" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <g transform="translate(288, 252)">
              <circle cx="0" cy="0" r="16" fill="#10B981" />
              <path d="M -6 0 L -2 5 L 7 -5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </>
        ) : (
          <>
            {/* 单一图像，居中 + 高亮环 */}
            <g transform="translate(200, 198) scale(2)">
              <PlaceShape place={right} />
            </g>
            <circle cx="200" cy="180" r="85" fill="none" stroke="#10B981" strokeWidth="3" opacity="0.5">
              <animate attributeName="r" values="80;92;80" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.25;0.5" dur="1.6s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>
      
      {/* 底部答案提示卡 */}
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex justify-center">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/90 px-5 py-3 text-center shadow-xl shadow-primary/25">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">
            answer with
          </p>
          <p className="text-xl font-bold text-primary-foreground">{right}</p>
        </div>
      </div>
    </div>
  );
}

interface Props {
  question: string;
  answer: string;
  /** @deprecated 展示一律走 inferVisualState；DB 字段仅作离线审计 */
  visualState?: VisualState | null;
  sceneTitle?: string | null;
  className?: string;
  /** learn 页用大图；preview 页可 compact */
  variant?: "hero" | "compact";
  /** Q&A 阶段：显示 HTML 高亮层，与静态课图明显区分 */
  interactive?: boolean;
}

/**
 * 概念卡片 - 用于抽象概念类问答（无具体道具）
 */
function ConceptCard({
  question,
  variant,
}: {
  question: string;
  variant: "hero" | "compact";
}) {
  const titleSize = variant === "hero" ? "text-xl" : "text-lg";
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#f8f4ed] to-[#ebe5db] px-6 py-8">
      <div className="w-full max-w-[92%] rounded-2xl border border-black/5 bg-white/98 px-6 py-6 shadow-lg shadow-black/5">
        <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
          Practice
        </p>
        <p className={`text-center font-semibold leading-snug text-[#292524] ${titleSize}`}>
          {question}
        </p>
      </div>
    </div>
  );
}

/**
 * QaScene - 问答场景主组件
 * 根据问答内容自动推断视觉状态并渲染相应的场景
 */
export function QaScene({
  question,
  answer,
  sceneTitle,
  className = "",
  variant = "hero",
  interactive = false,
}: Props) {
  const state = useMemo(
    () => inferVisualState(question, answer),
    [question, answer]
  );

  const isContrast = state.template === "contrast_card" && Boolean(state.contrast);
  const isRoster =
    state.template === "roster_card" && Boolean(state.roster?.length);

  const isConcept =
    !isContrast &&
    !isRoster &&
    (state.template === "concept_card" || state.animation === "none");

  const showRoomInteractive =
    interactive &&
    !isConcept &&
    state.template === "room_basic" &&
    Boolean(state.focus);

  const showPointer =
    !isConcept && state.animation === "point_arrow" && Boolean(state.pointer);

  const sizeClass =
    variant === "hero"
      ? "aspect-[4/3] w-full min-h-[min(72vw,340px)] max-h-[min(55vh,420px)]"
      : "aspect-[4/3] max-h-[40vh] w-full";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl border-2 ${
        showRoomInteractive 
          ? "border-primary shadow-xl shadow-primary/20" 
          : "border-border shadow-lg shadow-black/5"
      } bg-[#FFF9F3] ${sizeClass} ${className}`}
      data-testid="qa-scene"
      data-qa-template={state.template}
      data-qa-focus={showRoomInteractive ? state.focus : undefined}
      data-qa-interactive={showRoomInteractive ? "true" : undefined}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${question}|${answer}|${state.template}`}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {isContrast && state.contrast ? (
            <ContrastCard wrong={state.contrast.wrong} right={state.contrast.right} />
          ) : isRoster && state.roster ? (
            <RosterCard roster={state.roster} />
          ) : isConcept ? (
            <ConceptCard question={question} variant={variant} />
          ) : (
            <>
              <svg
                viewBox="0 0 400 300"
                className="h-full w-full"
                role="img"
                aria-label={`Scene: ${state.focus || sceneTitle || "lesson room"}`}
              >
                <PropSpriteDefs />
                <RoomTemplate />
                <SceneSprites
                  objects={state.objects}
                  colourSwatch={state.colourSwatch}
                />
                {showPointer && state.pointer && (
                  <ScenePointer targetId={state.pointer.target} objects={state.objects} />
                )}
              </svg>
              <SceneSpotlight
                objects={state.objects}
                animation={state.animation}
                focusLabel={state.focus}
              />
              <SceneShakeMarkers objects={state.objects} animation={state.animation} />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 交互模式顶部标签 */}
      {showRoomInteractive && (
        <motion.div 
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center pt-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <span className="rounded-full bg-gradient-to-r from-primary to-primary/90 px-4 py-1.5 text-[11px] font-bold text-primary-foreground shadow-lg shadow-primary/30">
            看这里 · {state.focus}
          </span>
        </motion.div>
      )}

      {/* 交互模式底部答案提示卡 */}
      {showRoomInteractive && (
        <motion.div 
          className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <motion.div
            className="rounded-2xl bg-gradient-to-br from-primary to-primary/90 px-5 py-2.5 text-center shadow-xl shadow-primary/30"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">
              answer with
            </p>
            <p className="text-lg font-bold text-primary-foreground">{state.focus}</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
