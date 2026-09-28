"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setUserRole } from "@/lib/actions";
import type { Role } from "@/lib/constants";

const LABELS: Record<Role, string> = { admin: "مدير", editor: "محرر", reader: "قارئ" };

/** Admin-only role switcher; the admin cannot demote themselves. */
export function RoleSelect({ profileId, role, isSelf }: { profileId: string; role: Role; isSelf: boolean }) {
  const [value, setValue] = useState<Role>(role);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const change = (next: Role) => {
    setError("");
    setValue(next);
    startTransition(async () => {
      const res = await setUserRole(profileId, next);
      if (!res.ok) {
        setError(res.error ?? "تعذّر التغيير");
        setValue(role);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Select value={value} onValueChange={(v) => change(v as Role)} disabled={pending || isSelf}>
        <SelectTrigger className="h-8 w-28 text-xs" aria-label={`دور ${value}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(LABELS) as Role[]).map((r) => (
            <SelectItem key={r} value={r} disabled={isSelf && r !== "admin"}>
              {LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isSelf && <span className="text-[10px] text-muted-foreground">حسابك الحالي</span>}
      {error && <span className="text-[10px] text-danger">{error}</span>}
    </div>
  );
}
