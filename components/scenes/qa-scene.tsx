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

function RosterCard({ roster }: { roster: string[] }) {
  const n = roster.length;
  const spacing = n <= 2 ? 120 : n === 3 ? 104 : 86;
  const startX = 200 - ((n - 1) * spacing) / 2;
  return (
    <div className="relative h-full w-full overflow-hidden">
      <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="people">
        {/* classroom-ish backdrop */}
        <rect x="0" y="0" width="400" height="300" fill="#FBF6EE" />
        <rect x="0" y="214" width="400" height="86" fill="#EADFCB" />
        <rect x="0" y="214" width="400" height="5" fill="#D6C3A1" />
        {roster.map((p, i) => {
          const x = startX + i * spacing;
          const w = Math.max(46, p.length * 9 + 20);
          return (
            <g key={p}>
              <animate
                attributeName="opacity"
                values="0;1"
                dur="0.4s"
                begin={`${i * 0.18}s`}
                fill="freeze"
              />
              <g transform={`translate(${x}, 198) scale(1.18)`}>
                <PersonSprite sprite={p} />
              </g>
              <g transform={`translate(${x}, 250)`}>
                <rect x={-w / 2} y="-10" width={w} height="20" rx="10" fill="#10B981" />
                <text
                  x="0"
                  y="1"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="11"
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
            <stop offset="0%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="400" height="300" fill="url(#skyGrad)" />
        {/* sun + clouds */}
        <circle cx="60" cy="50" r="20" fill="#FDE68A" />
        <ellipse cx="300" cy="46" rx="34" ry="13" fill="#fff" opacity="0.85" />
        <ellipse cx="324" cy="52" rx="22" ry="11" fill="#fff" opacity="0.85" />
        {/* ground */}
        <rect x="0" y="222" width="400" height="78" fill="#86EFAC" />
        <rect x="0" y="222" width="400" height="6" fill="#4ADE80" />

        {wrong ? (
          <>
            {/* wrong — left, dimmed, ✗ */}
            <g transform="translate(112, 190) scale(1.5)">
              <PlaceShape place={wrong} dimmed />
            </g>
            <g transform="translate(112, 246)">
              <circle cx="0" cy="0" r="13" fill="#fff" stroke="#EF4444" strokeWidth="2.5" />
              <path d="M -5 -5 L 5 5 M 5 -5 L -5 5" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            {/* right — right side, highlighted, ✓ */}
            <g transform="translate(288, 188) scale(1.6)">
              <PlaceShape place={right} />
            </g>
            <circle cx="288" cy="180" r="62" fill="none" stroke="#10B981" strokeWidth="3" opacity="0.6">
              <animate attributeName="r" values="58;66;58" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.25;0.6" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <g transform="translate(288, 246)">
              <circle cx="0" cy="0" r="13" fill="#10B981" />
              <path d="M -5 0 L -1 5 L 6 -5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </>
        ) : (
          <>
            {/* single image, centered + highlight ring */}
            <g transform="translate(200, 196) scale(1.9)">
              <PlaceShape place={right} />
            </g>
            <circle cx="200" cy="180" r="78" fill="none" stroke="#10B981" strokeWidth="3" opacity="0.55">
              <animate attributeName="r" values="74;84;74" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-center">
        <div className="rounded-xl bg-primary/95 px-4 py-2 text-center shadow-lg">
          <p className="text-[10px] font-medium uppercase tracking-wider text-primary-foreground/80">
            answer with
          </p>
          <p className="text-lg font-bold text-primary-foreground">{right}</p>
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

function ConceptCard({
  question,
  variant,
}: {
  question: string;
  variant: "hero" | "compact";
}) {
  const titleSize = variant === "hero" ? "text-xl" : "text-lg";
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#f5f0e8] to-[#e8dfd3] px-6 py-8">
      <div className="w-full max-w-[92%] rounded-2xl border border-black/8 bg-white/95 px-5 py-5 shadow-sm">
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-[#78716c]">
          Practice
        </p>
        <p className={`text-center font-semibold leading-snug text-[#292524] ${titleSize}`}>
          {question}
        </p>
      </div>
    </div>
  );
}

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
        showRoomInteractive ? "border-primary shadow-lg shadow-primary/20" : "border-border"
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
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.85 }}
          transition={{ duration: 0.2 }}
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

      {showRoomInteractive && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center pt-3">
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-md">
            看这里 · {state.focus}
          </span>
        </div>
      )}

      {showRoomInteractive && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex justify-center">
          <motion.div
            className="rounded-xl bg-primary/95 px-4 py-2 text-center shadow-lg"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-primary-foreground/80">
              answer with
            </p>
            <p className="text-lg font-bold text-primary-foreground">{state.focus}</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
