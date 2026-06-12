"use client";

import { useRef } from "react";
import { Loader2, Mic, Volume2 } from "lucide-react";

interface SpeakStageProps {
  /** 正在录音/评估中 */
  busy: boolean;
  disabled?: boolean;
  /** 移动端一屏布局 — 缩小麦克风与留白 */
  compact?: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  /** 播放问题发音 */
  onListen: () => void;
}

/**
 * 「聚光灯舞台」的开口说控件：
 *  顶部一枚轻量发音胶囊 + 中央会呼吸的麦克风（同心光环），
 *  录音时切红并外扩声波涟漪。取代旧的描边「听问题」按钮 + 裸麦克风。
 */
export function SpeakStage({
  busy,
  disabled,
  compact = false,
  onPressStart,
  onPressEnd,
  onListen,
}: SpeakStageProps) {
  const pressed = useRef(false);

  function endPress() {
    if (!pressed.current) return;
    pressed.current = false;
    onPressEnd();
  }

  return (
    <div className="flex select-none flex-col items-center">
      {/* 发音胶囊 —— 次要动作，藏在主舞台之上 */}
      <button
        type="button"
        onClick={onListen}
        disabled={busy}
        className={`group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 backdrop-blur-sm transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/[0.08] hover:text-white disabled:opacity-40 ${compact ? "mb-3" : "mb-5"}`}
      >
        <Volume2 className="h-4 w-4 text-emerald-400 transition-transform group-hover:scale-110" />
        听一遍问题
      </button>

      {/* 麦克风聚光灯 */}
      <div
        className={`relative flex items-center justify-center ${compact ? "h-24 w-24" : "h-32 w-32"}`}
      >
        {/* 落地光晕 */}
        <div
          aria-hidden
          className={`absolute rounded-full blur-2xl transition-colors duration-500 ${compact ? "h-28 w-28" : "h-36 w-36"}`}
          style={{
            background: busy
              ? "radial-gradient(circle, rgba(244,63,94,0.32), transparent 68%)"
              : "radial-gradient(circle, rgba(16,185,129,0.30), transparent 68%)",
          }}
        />

        {/* 呼吸 / 涟漪光环 —— 三层错相 */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            className={`absolute rounded-full ${compact ? "h-16 w-16" : "h-20 w-20"}`}
            style={{
              border: `2px solid ${busy ? "rgba(244,63,94,0.55)" : "rgba(16,185,129,0.5)"}`,
              animation: `${busy ? "mic-ripple 1.1s" : "mic-halo 3.4s"} ease-out ${i * (busy ? 0.36 : 1.1)}s infinite`,
            }}
          />
        ))}

        <button
          type="button"
          disabled={disabled}
          onPointerDown={(e) => {
            if (disabled || pressed.current) return;
            if (e.button !== 0) return;
            e.preventDefault();
            pressed.current = true;
            try {
              (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
            onPressStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            endPress();
          }}
          onPointerCancel={endPress}
          onLostPointerCapture={endPress}
          aria-label="按住说话"
          className={`relative z-10 flex items-center justify-center rounded-full text-white transition-transform duration-200 active:scale-95 disabled:opacity-50 ${
            compact ? "h-[72px] w-[72px]" : "h-[88px] w-[88px]"
          } ${
            busy
              ? "bg-gradient-to-b from-rose-500 to-rose-600 shadow-[0_0_44px_rgba(244,63,94,0.6)]"
              : "bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_10px_40px_rgba(16,185,129,0.55)]"
          }`}
        >
          {busy ? (
            <Loader2 className={compact ? "h-8 w-8 animate-spin" : "h-9 w-9 animate-spin"} />
          ) : (
            <Mic className={compact ? "h-8 w-8" : "h-9 w-9"} strokeWidth={2.25} />
          )}
        </button>
      </div>

      {/* 引导文案 */}
      <p
        className={`text-center font-medium tracking-wide text-white/85 ${compact ? "mt-2.5 text-sm" : "mt-4 text-[0.95rem]"}`}
      >
        {busy ? "正在听…   松开结束" : "按住麦克风，用英语说出来"}
      </p>
      <p className={`text-center text-white/35 ${compact ? "mt-0.5 text-[0.65rem]" : "mt-1 text-xs"}`}>
        {busy ? "别急，说完整一句" : "松开后 AI 会即时点评你的发音"}
      </p>
    </div>
  );
}
