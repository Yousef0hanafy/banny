"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions";

/** Simple account settings: display name + bio (Release B profile completion). */
export function ProfileSettings({ nickname, bio }: { nickname: string; bio: string }) {
  const [name, setName] = useState(nickname);
  const [userBio, setUserBio] = useState(bio);
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = () => {
    setMsg("");
    startTransition(async () => {
      const res = await updateProfile({ nickname: name, bio: userBio });
      setMsg(res.ok ? "تم الحفظ ✓" : (res.error ?? "تعذّر الحفظ"));
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="pf-name" className="mb-1.5 block text-xs text-muted-foreground">الاسم الظاهر</label>
        <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </div>
      <div>
        <label htmlFor="pf-bio" className="mb-1.5 block text-xs text-muted-foreground">نبذة قصيرة (اختياري)</label>
        <Textarea id="pf-bio" value={userBio} onChange={(e) => setUserBio(e.target.value)} rows={2} maxLength={300} className="resize-none" />
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" disabled={pending || name.trim().length < 2} onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">
          حفظ
        </Button>
        {msg && <span className="text-xs text-muted-foreground" aria-live="polite">{msg}</span>}
      </div>
    </div>
  );
}
