"use client";

import type { AnimationPreset, SceneObject } from "@/lib/visual-state";
import { slotToPercent } from "@/lib/scene-layout";
import "./scene-effects.css";

export function SceneSpotlight({
  objects,
  animation,
  focusLabel,
}: {
  objects: SceneObject[];
  animation: AnimationPreset;
  focusLabel?: string;
}) {
  const highlighted = objects.filter((o) => o.highlight);
  if (!highlighted.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      {highlighted.map((obj) => {
        const { left, top } = slotToPercent(obj.slot);
        const showPulse = animation === "pulse_highlight";
        const showBounce =
          animation === "spatial_on" ||
          animation === "spatial_under" ||
          animation === "spatial_in";

        return (
          <div
            key={`spot-${obj.id}`}
            className="absolute"
            style={{ left, top, width: 0, height: 0 }}
          >
            {showPulse && <div className="tf-scene-pulse-ring" />}
            {showBounce && (
              <div
                className="tf-scene-pulse-ring tf-scene-prop-bounce"
                style={{ opacity: 0.7 }}
              />
            )}
            {focusLabel && obj.highlight && (
              <span className="tf-scene-focus-chip">{focusLabel}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Dimmed + shake targets (wrong noun in negation drills) */
export function SceneShakeMarkers({
  objects,
  animation,
}: {
  objects: SceneObject[];
  animation: AnimationPreset;
}) {
  if (animation !== "shake_no") return null;
  const shaken = objects.filter((o) => o.dimmed);
  if (!shaken.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      {shaken.map((obj) => {
        const { left, top } = slotToPercent(obj.slot);
        return (
          <div
            key={`shake-${obj.id}`}
            className="absolute tf-scene-prop-shake"
            style={{ left, top, width: 0, height: 0 }}
          >
            <div
              className="tf-scene-pulse-ring"
              style={{
                borderColor: "rgb(239 68 68)",
                background: "rgb(239 68 68 / 0.08)",
                width: "4.5rem",
                height: "3.5rem",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
