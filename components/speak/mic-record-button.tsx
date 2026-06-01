"use client"

import { useRef } from "react"
import { Loader2, Mic } from "lucide-react"

interface MicRecordButtonProps {
  busy: boolean
  disabled?: boolean
  onPressStart: () => void
  onPressEnd: () => void
  idleLabel?: string
  busyLabel?: string
}

export function MicRecordButton({
  busy,
  disabled,
  onPressStart,
  onPressEnd,
  idleLabel = "按住麦克风用英语说，松开结束",
  busyLabel = "正在听… 松开结束",
}: MicRecordButtonProps) {
  const pressed = useRef(false)

  function endPress() {
    if (!pressed.current) return
    pressed.current = false
    onPressEnd()
  }

  return (
    <div className="flex flex-col items-center gap-3 select-none touch-none">
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => {
          if (disabled || pressed.current) return
          if (e.button !== 0) return
          e.preventDefault()
          pressed.current = true
          try {
            (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
          onPressStart()
        }}
        onPointerUp={(e) => {
          e.preventDefault()
          endPress()
        }}
        onPointerCancel={endPress}
        onLostPointerCapture={endPress}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_32px_rgba(16,185,129,0.45)] ${
          busy ? "bg-red-500 animate-pulse" : "bg-primary text-primary-foreground"
        } disabled:opacity-50`}
        aria-label="按住说话"
      >
        {busy ? (
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </button>
      <p className="text-xs text-muted-foreground text-center">
        {busy ? busyLabel : idleLabel}
      </p>
    </div>
  )
}
