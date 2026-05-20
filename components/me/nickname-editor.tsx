"use client"

import { useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NicknameEditor({
  userId,
  initialNickname,
}: {
  userId: string
  initialNickname: string
}) {
  const [nickname, setNickname] = useState(initialNickname)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.from("profiles").upsert(
        { id: userId, nickname: nickname.trim() || null },
        { onConflict: "id" }
      )

      if (!error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <div className="flex gap-2 mt-3">
      <Input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="昵称"
        className="rounded-xl flex-1"
      />
      <Button onClick={save} disabled={isPending} size="sm" className="rounded-xl shrink-0">
        {isPending ? "…" : saved ? "已保存" : "保存"}
      </Button>
    </div>
  )
}
