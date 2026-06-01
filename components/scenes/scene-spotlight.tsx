"use client";

import type { AnimationPreset, SceneObject } from "@/lib/visual-state";
import { slotToPercent } from "@/lib/scene-layout";
import "./scene-effects.css";

/**
 * 场景聚光灯 - 高亮目标物体并显示标签
 */
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

  // 根据动画类型选择不同的样式
  const getSpatialClass = () => {
    switch (animation) {
      case "spatial_on":
        return "tf-scene-spatial-on";
      case "spatial_under":
        return "tf-scene-spatial-under";
      case "spatial_in":
        return "tf-scene-spatial-in";
      default:
        return "";
    }
  };

  const showPulse = animation === "pulse_highlight";
  const isSpatial =
    animation === "spatial_on" ||
    animation === "spatial_under" ||
    animation === "spatial_in";
  const spatialClass = getSpatialClass();

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
      {highlighted.map((obj) => {
        const { left, top } = slotToPercent(obj.slot);

        return (
          <div
            key={`spot-${obj.id}`}
            className="absolute"
            style={{ left, top, width: 0, height: 0 }}
          >
            {/* 主高亮环 */}
            {showPulse && <div className="tf-scene-pulse-ring" />}
            
            {/* 空间位置动画 */}
            {isSpatial && (
              <div className={`tf-scene-pulse-ring ${spatialClass}`} />
            )}
            
            {/* 焦点标签 */}
            {focusLabel && obj.highlight && (
              <span className="tf-scene-focus-chip">{focusLabel}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 否定/错误标记 - 用于"No, it isn't"类型的回答
 */
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
            className="absolute"
            style={{ left, top, width: 0, height: 0 }}
          >
            <div className="tf-scene-error-ring" />
          </div>
        );
      })}
    </div>
  );
}
