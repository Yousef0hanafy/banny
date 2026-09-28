import { UsersRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { requireRole, getAdminUsers } from "@/lib/queries";
import { RoleSelect } from "@/components/admin/role-select";

export const dynamic = "force-dynamic";

const ROLE_BADGE: Record<string, string> = {
  admin: "border-primary/40 bg-primary/10 text-primary",
  editor: "border-gold/40 bg-gold/10 text-gold",
  reader: "border-border bg-secondary text-muted-foreground",
};

export default async function AdminUsersPage() {
  const me = await requireRole(["admin"]);
  const users = await getAdminUsers();

  return (
    <main className="mx-auto max-w-4xl p-4 pt-6 sm:p-6">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <UsersRound className="size-6 text-primary" aria-hidden />
          المستخدمون والأدوار
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          شاشة حصرية للمدير — تغيير الدور يسري فورًا على الجلسة التالية للمستخدم.
        </p>
      </header>

      <ul className="space-y-2.5">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
            <Avatar className="size-10 border border-border">
              <AvatarFallback className="bg-primary/15 text-primary font-semibold">{u.nickname.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {u.nickname}
                <Badge variant="secondary" className={ROLE_BADGE[u.role] ?? ""}>
                  {u.role === "admin" ? "مدير" : u.role === "editor" ? "محرر" : "قارئ"}
                </Badge>
              </p>
              <p className="text-[11px] text-muted-foreground" dir="ltr">{u.email}</p>
            </div>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              {u._count.libraryItems} مكتبة · {u._count.comments} تعليق · {u._count.readingProgress} تقدم
            </p>
            <RoleSelect profileId={u.id} role={u.role as "reader"} isSelf={u.id === me.id} />
          </li>
        ))}
      </ul>
    </main>
  );
}
