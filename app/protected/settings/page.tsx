"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? "");
    });
  }, []);

  function save() {
    startSave(async () => {
      // For now just show saved state — profile update can be wired to profiles table
      await new Promise((r) => setTimeout(r, 400));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="max-w-lg mx-auto w-full px-4 py-6 flex flex-col gap-6 pb-20 md:pb-6">
      <h1 className="text-2xl font-bold text-foreground">设置</h1>

      {/* Account */}
      <Card className="rounded-2xl border p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">账户</h2>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">昵称</Label>
          <div className="flex gap-2">
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入昵称"
              className="rounded-xl flex-1"
            />
            <Button onClick={save} disabled={saving} className="rounded-xl shrink-0">
              {saving ? "保存中…" : saved ? "已保存 ✓" : "保存"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">邮箱</Label>
          <Input
            value={email}
            readOnly
            disabled
            className="rounded-xl bg-muted text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">邮箱不可修改</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">密码</Label>
          <Button variant="outline" asChild className="rounded-xl w-fit">
            <a href="/auth/update-password">修改密码 →</a>
          </Button>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="rounded-2xl border p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">偏好设置</h2>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-foreground">主题</p>
            <p className="text-xs text-muted-foreground">跟随系统设置</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
            跟随系统
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-foreground">发音</p>
            <p className="text-xs text-muted-foreground">音频播放偏好</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
            英式发音
          </span>
        </div>
      </Card>

      {/* Subscription */}
      <Card className="rounded-2xl border p-6 flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">订阅</h2>
        <p className="text-sm text-muted-foreground">当前计划：免费版</p>
        <Button className="rounded-xl w-fit" disabled>
          升级到专业版 →
        </Button>
      </Card>

      {/* Danger zone */}
      <Card className="rounded-2xl border border-destructive/30 p-6 flex flex-col gap-3">
        <h2 className="text-base font-semibold text-destructive">危险区</h2>
        <div className="flex gap-3">
          <LogoutButton variant="button" />
          <Button variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10" disabled>
            删除账户
          </Button>
        </div>
      </Card>
    </div>
  );
}
