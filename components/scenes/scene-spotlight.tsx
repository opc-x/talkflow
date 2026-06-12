"use client";

import type { ArtPackId } from "@/lib/scene-art-pack";
import type { AnimationPreset, SceneObject, SizeVariant } from "@/lib/visual-state";
import { slotToPercent } from "@/lib/scene-layout";
import "./scene-effects.css";

function sizeRingClass(variant?: SizeVariant): string {
  if (variant === "large" || variant === "long") {
    return "tf-scene-pulse-ring tf-scene-pulse-ring--large";
  }
  if (variant === "small" || variant === "short") {
    return "tf-scene-pulse-ring tf-scene-pulse-ring--small";
  }
  return "tf-scene-pulse-ring";
}

export function SceneSpotlight({
  objects,
  animation,
  focusLabel,
  sizeVariant,
  anchoredCallout = false,
  artPack,
}: {
  objects: SceneObject[];
  animation: AnimationPreset;
  focusLabel?: string;
  sizeVariant?: SizeVariant;
  /** 与 SceneFocusCallout 同用时不重复叠 PEN 芯片 */
  anchoredCallout?: boolean;
  artPack?: ArtPackId;
}) {
  const highlighted = objects.filter((o) => o.highlight);
  if (!highlighted.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      {highlighted.map((obj) => {
        const { left, top } = slotToPercent(obj.slot, artPack);
        const showPulse =
          animation === "pulse_highlight" || animation === "size_contrast";
        const showBounce =
          animation === "spatial_on" ||
          animation === "spatial_under" ||
          animation === "spatial_in";
        const ringClass =
          animation === "size_contrast"
            ? sizeRingClass(sizeVariant)
            : "tf-scene-pulse-ring";

        return (
          <div
            key={`spot-${obj.id}`}
            className="absolute"
            style={{ left, top, width: 0, height: 0 }}
          >
            {showPulse && <div className={ringClass} />}
            {showBounce && (
              <div
                className="tf-scene-pulse-ring tf-scene-prop-bounce"
                style={{ opacity: 0.75 }}
              />
            )}
            {focusLabel && obj.highlight && !anchoredCallout && (
              <span className="tf-scene-focus-chip">{focusLabel}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 「看这里」锚在 focus 物体上方，不再误指吊灯 */
export function SceneFocusCallout({
  objects,
  focusLabel,
  question,
  artPack,
}: {
  objects: SceneObject[];
  focusLabel?: string;
  question?: string;
  artPack?: ArtPackId;
}) {
  const target = objects.find((o) => o.highlight);
  if (!target || !focusLabel) return null;

  const { left, top } = slotToPercent(target.slot, artPack);

  return (
    <div className="pointer-events-none absolute inset-0 z-[3]" aria-hidden>
      <div
        className="absolute flex max-w-[88%] flex-col items-center gap-1.5"
        style={{
          left,
          top,
          transform: "translate(-50%, calc(-100% - 14px))",
        }}
      >
        <span className="tf-scene-callout-chip">看这里 · {focusLabel}</span>
        {question ? (
          <span className="tf-scene-question-chip">{question}</span>
        ) : null}
        <span className="tf-scene-callout-tail" aria-hidden />
      </div>
    </div>
  );
}

/** Dimmed + shake targets (wrong noun in negation drills) */
export function SceneShakeMarkers({
  objects,
  animation,
  artPack,
}: {
  objects: SceneObject[];
  animation: AnimationPreset;
  artPack?: ArtPackId;
}) {
  if (animation !== "shake_no") return null;
  const shaken = objects.filter((o) => o.dimmed);
  if (!shaken.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      {shaken.map((obj) => {
        const { left, top } = slotToPercent(obj.slot, artPack);
        return (
          <div
            key={`shake-${obj.id}`}
            className="absolute tf-scene-prop-shake"
            style={{ left, top, width: 0, height: 0 }}
          >
            <div
              className="tf-scene-pulse-ring tf-scene-pulse-ring--wrong"
              style={{ width: "4.5rem", height: "3.5rem" }}
            />
            <span className="tf-scene-wrong-mark">✕</span>
          </div>
        );
      })}
    </div>
  );
}
