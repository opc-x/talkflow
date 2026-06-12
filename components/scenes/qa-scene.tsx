"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VisualState } from "@/lib/visual-state";
import { inferVisualState } from "@/lib/parse-qa-visual";
import { DeskFocusRoomTemplate } from "@/components/scenes/desk-focus-room";
import { RoomTemplate } from "@/components/scenes/room-template";
import {
  SceneFocusCallout,
  SceneShakeMarkers,
  SceneSpotlight,
} from "@/components/scenes/scene-spotlight";
import { ScenePointer, SceneSprites, PropSpriteDefs } from "@/components/scenes/scene-sprites";
import {
  StorysetAttribution,
  StorysetRoomBackground,
  StorysetSceneSprites,
} from "@/components/scenes/storyset-layer";
import { CitySprite, TownSprite, VillageSprite, PersonSprite } from "@/components/scenes/prop-sprites";
import { StaticQaScene } from "@/components/scenes/static-qa-scene";
import type { ArtPackId } from "@/lib/scene-art-pack";
import "./scene-effects.css";

export type QaSceneLearnPhase = "vocab" | "question" | "answer" | "feedback";

function RosterCard({ roster }: { roster: string[] }) {
  const n = roster.length;
  const spacing = n <= 2 ? 120 : n === 3 ? 104 : 86;
  const startX = 200 - ((n - 1) * spacing) / 2;
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#F8F4EC] to-[#EDE4D6]">
      <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="people">
        <rect x="0" y="214" width="400" height="86" fill="#E8DCC8" />
        <rect x="0" y="214" width="400" height="4" fill="#D4C4A8" />
        {roster.map((p, i) => {
          const x = startX + i * spacing;
          const w = Math.max(46, p.length * 9 + 20);
          return (
            <g key={p}>
              <animate
                attributeName="opacity"
                values="0;1"
                dur="0.45s"
                begin={`${i * 0.16}s`}
                fill="freeze"
              />
              <g transform={`translate(${x}, 198) scale(1.15)`}>
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
        <circle cx="60" cy="50" r="20" fill="#FDE68A" />
        <ellipse cx="300" cy="46" rx="34" ry="13" fill="#fff" opacity="0.85" />
        <rect x="0" y="222" width="400" height="78" fill="#86EFAC" />
        <rect x="0" y="222" width="400" height="6" fill="#4ADE80" />

        {wrong ? (
          <>
            <g transform="translate(112, 190) scale(1.5)">
              <PlaceShape place={wrong} dimmed />
            </g>
            <g transform="translate(112, 246)">
              <circle cx="0" cy="0" r="13" fill="#fff" stroke="#EF4444" strokeWidth="2.5" />
              <path d="M -5 -5 L 5 5 M 5 -5 L -5 5" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <g transform="translate(288, 188) scale(1.6)">
              <PlaceShape place={right} />
            </g>
            <circle cx="288" cy="180" r="62" fill="none" stroke="#10B981" strokeWidth="3" opacity="0.55">
              <animate attributeName="r" values="58;66;58" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <g transform="translate(288, 246)">
              <circle cx="0" cy="0" r="13" fill="#10B981" />
              <path d="M -5 0 L -1 5 L 6 -5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </>
        ) : (
          <>
            <g transform="translate(200, 196) scale(1.9)">
              <PlaceShape place={right} />
            </g>
            <circle cx="200" cy="180" r="78" fill="none" stroke="#10B981" strokeWidth="3" opacity="0.5">
              <animate attributeName="r" values="74;84;74" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-center">
        <div className="rounded-xl bg-primary/95 px-4 py-2 text-center shadow-lg">
          <p className="text-lg font-bold text-primary-foreground">{right}</p>
        </div>
      </div>
    </div>
  );
}

interface Props {
  question: string;
  answer: string;
  visualState?: VisualState | null;
  sceneTitle?: string | null;
  sceneSubcaption?: string | null;
  className?: string;
  variant?: "hero" | "compact";
  interactive?: boolean;
  learnPhase?: QaSceneLearnPhase;
  /** Per-pair illustration — when set, renders static image instead of SVG scene */
  sceneImageUrl?: string | null;
  /** Overrides inferred artPack (e.g. lesson 1 desk focus pilot) */
  artPack?: ArtPackId;
  /** Hide in-scene question overlays when LearnQuestionBanner is shown above */
  suppressInSceneQuestion?: boolean;
}

function ConceptCard({
  question,
  answer,
  variant,
}: {
  question: string;
  answer: string;
  variant: "hero" | "compact";
}) {
  const titleSize = variant === "hero" ? "text-lg" : "text-base";
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#F5F0E8] via-[#EDE6DA] to-[#E5D9CA] px-6 py-8">
      <div className="w-full max-w-[92%] rounded-2xl border border-stone-200/80 bg-white/95 px-5 py-5 shadow-md">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-stone-500">
          听清问题
        </p>
        <p className={`text-center font-semibold leading-snug text-stone-800 ${titleSize}`}>
          {question}
        </p>
        {answer ? (
          <p className="mt-3 text-center text-sm text-primary font-medium">{answer}</p>
        ) : null}
      </div>
    </div>
  );
}

export function QaScene({
  question,
  answer,
  sceneTitle,
  sceneSubcaption,
  className = "",
  variant = "hero",
  interactive = false,
  learnPhase,
  sceneImageUrl,
  artPack: artPackProp,
  suppressInSceneQuestion = false,
}: Props) {
  const state = useMemo(
    () => inferVisualState(question, answer),
    [question, answer],
  );

  if (sceneImageUrl) {
    return (
      <StaticQaScene
        imageUrl={sceneImageUrl}
        question={question}
        answer={answer}
        learnPhase={learnPhase}
        showQuestionOverlay={!suppressInSceneQuestion}
        className={className}
        variant={variant}
      />
    );
  }

  const artPack: ArtPackId = artPackProp ?? state.artPack ?? "talkflow_flat_v2";
  const useStoryset = artPack === "storyset_classroom";
  const useDeskFocus = artPack === "talkflow_desk_focus";

  const isContrast = state.template === "contrast_card" && Boolean(state.contrast);
  const isRoster = state.template === "roster_card" && Boolean(state.roster?.length);
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

  const showAnchoredCallout = showRoomInteractive && Boolean(state.focus);
  const showQuestionInScene =
    !suppressInSceneQuestion && (learnPhase === "question" || learnPhase === "vocab");
  const showAnswerInScene = learnPhase === "answer" || learnPhase === "feedback";

  const sizeClass =
    variant === "hero"
      ? "aspect-[4/3] w-full min-h-[min(72vw,340px)] max-h-[min(55vh,420px)]"
      : "aspect-[4/3] w-full min-h-[7.5rem] max-h-[min(30vh,220px)]";

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl border-2 ${
        showRoomInteractive
          ? "border-primary/80 shadow-xl shadow-primary/15"
          : "border-stone-200/60"
      } bg-gradient-to-b from-[#FAF6F0] to-[#F0E8DC] ${sizeClass} ${className}`}
      data-testid="qa-scene"
      data-qa-template={state.template}
      data-qa-art-pack={artPack}
      data-qa-focus={showRoomInteractive ? state.focus : undefined}
      data-qa-interactive={showRoomInteractive ? "true" : undefined}
      data-qa-phase={learnPhase}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${question}|${answer}|${state.template}|${learnPhase}`}
          className="absolute inset-0"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.92 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {isContrast && state.contrast ? (
            <ContrastCard wrong={state.contrast.wrong} right={state.contrast.right} />
          ) : isRoster && state.roster ? (
            <RosterCard roster={state.roster} />
          ) : isConcept ? (
            <ConceptCard question={question} answer={answer} variant={variant} />
          ) : (
            <>
              <div className="tf-scene-dim-vignette" />
              <svg
                viewBox="0 0 400 300"
                className="relative z-[1] h-full w-full"
                role="img"
                aria-label={`Scene: ${state.focus || sceneTitle || "lesson room"}`}
              >
                {!useStoryset && <PropSpriteDefs />}
                {useStoryset ? (
                  <StorysetRoomBackground />
                ) : useDeskFocus ? (
                  <DeskFocusRoomTemplate />
                ) : (
                  <RoomTemplate />
                )}
                {useStoryset ? (
                  <StorysetSceneSprites
                    objects={state.objects}
                    colourSwatch={state.colourSwatch}
                    sizeVariant={state.sizeVariant}
                  />
                ) : (
                  <SceneSprites
                    objects={state.objects}
                    colourSwatch={state.colourSwatch}
                    sizeVariant={state.sizeVariant}
                    artPack={artPack}
                  />
                )}
                {showPointer && state.pointer && (
                  <ScenePointer
                    targetId={state.pointer.target}
                    objects={state.objects}
                    artPack={artPack}
                  />
                )}
              </svg>
              <SceneSpotlight
                objects={state.objects}
                animation={state.animation}
                focusLabel={state.focus}
                sizeVariant={state.sizeVariant}
                anchoredCallout={showAnchoredCallout}
                artPack={artPack}
              />
              <SceneShakeMarkers
                objects={state.objects}
                animation={state.animation}
                artPack={artPack}
              />
              {showAnchoredCallout && (
                <SceneFocusCallout
                  objects={state.objects}
                  focusLabel={state.focus}
                  question={showQuestionInScene ? question : undefined}
                  artPack={artPack}
                />
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {(sceneTitle || sceneSubcaption) && learnPhase === "vocab" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] bg-gradient-to-t from-stone-900/75 via-stone-900/35 to-transparent px-4 pb-3 pt-12">
          {sceneTitle ? (
            <p className="text-sm font-medium text-white">{sceneTitle}</p>
          ) : null}
          {sceneSubcaption ? (
            <p className="text-xs text-white/75" suppressHydrationWarning>
              {sceneSubcaption}
            </p>
          ) : null}
        </div>
      )}

      {showAnswerInScene && !isConcept && state.focus && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] flex justify-center bg-gradient-to-t from-stone-900/70 to-transparent px-4 pb-3 pt-10">
          <motion.div
            className="max-w-[95%] rounded-xl bg-primary px-4 py-2.5 text-center shadow-lg"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-primary-foreground/85">
              参考答案
            </p>
            <p className="text-base font-semibold leading-snug text-primary-foreground">
              {answer}
            </p>
          </motion.div>
        </div>
      )}

      {useStoryset && !isConcept && <StorysetAttribution />}

      {showQuestionInScene && learnPhase === "question" && isConcept && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[4] flex justify-center px-3">
          <p className="rounded-xl bg-stone-900/80 px-4 py-2 text-center text-sm font-semibold text-white backdrop-blur-sm">
            {question}
          </p>
        </div>
      )}
    </div>
  );
}
