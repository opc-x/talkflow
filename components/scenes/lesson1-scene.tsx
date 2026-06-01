"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import "./scene-effects.css";

/**
 * Lesson 1 专用场景 - 使用精美插画图片 + 高亮叠加层
 * 道具: pen (钢笔), pencil (铅笔), book (书本)
 */

// 道具在图片中的位置（百分比坐标）
const PROP_POSITIONS: Record<string, { x: number; y: number; width: number; height: number }> = {
  pen: { x: 42, y: 58, width: 28, height: 10 },      // 蓝色钢笔
  pencil: { x: 36, y: 70, width: 30, height: 10 },   // 黄色铅笔
  book: { x: 62, y: 52, width: 28, height: 26 },     // 红色书本
};

type AnimationType = "pulse" | "shake" | "bounce" | "none";

interface HighlightOverlayProps {
  target: string;
  animation?: AnimationType;
  label?: string;
  isError?: boolean;
}

function HighlightOverlay({ target, animation = "pulse", label, isError = false }: HighlightOverlayProps) {
  const pos = PROP_POSITIONS[target];
  if (!pos) return null;

  const ringClass = isError ? "lesson1-error-ring" : "lesson1-highlight-ring";
  const animClass = animation === "shake" ? "lesson1-shake" : animation === "bounce" ? "lesson1-bounce" : "";

  return (
    <motion.div
      className={`absolute ${animClass}`}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: `${pos.width}%`,
        height: `${pos.height}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* 高亮环 */}
      <div className={`absolute inset-0 ${ringClass}`} />
      
      {/* 标签 */}
      {label && (
        <motion.span
          className="absolute left-1/2 -top-8 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}

interface Lesson1SceneProps {
  highlight?: string | null;      // 高亮的道具: "pen" | "pencil" | "book"
  dimmed?: string[];              // 变暗的道具列表
  animation?: AnimationType;
  label?: string;
  showAnswerCard?: boolean;
  className?: string;
}

export function Lesson1Scene({
  highlight,
  dimmed = [],
  animation = "pulse",
  label,
  showAnswerCard = true,
  className = "",
}: Lesson1SceneProps) {
  return (
    <div className={`relative aspect-square w-full overflow-hidden rounded-2xl ${className}`}>
      {/* 背景图片 */}
      <Image
        src="/scenes/lesson1-desk.png"
        alt="Study desk with pen, pencil and book"
        fill
        className="object-cover"
        priority
      />

      {/* 变暗遮罩 */}
      {dimmed.map((prop) => {
        const pos = PROP_POSITIONS[prop];
        if (!pos) return null;
        return (
          <motion.div
            key={`dim-${prop}`}
            className="absolute bg-black/40"
            style={{
              left: `${pos.x - pos.width / 2}%`,
              top: `${pos.y - pos.height / 2}%`,
              width: `${pos.width}%`,
              height: `${pos.height}%`,
              borderRadius: "8px",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        );
      })}

      {/* 高亮层 */}
      {highlight && (
        <HighlightOverlay
          target={highlight}
          animation={animation}
          label={label}
          isError={dimmed.includes(highlight)}
        />
      )}

      {/* 答案提示卡 */}
      {showAnswerCard && label && (
        <motion.div
          className="absolute bottom-4 left-4 right-4 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <motion.div
            className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-3 text-center shadow-xl shadow-emerald-500/30"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-100">
              answer with
            </p>
            <p className="text-xl font-bold text-white">{label}</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
