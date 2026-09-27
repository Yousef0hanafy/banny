"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { BookOpenText, BookMarked, Compass, Library, Search, Menu, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="مكتبة باني — الرئيسية">
      <span className="grid size-9 place-items-center rounded-xl bg-primary/15 border border-primary/30 text-primary transition group-hover:bg-primary/25">
        <BookOpenText className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block font-bold text-[15px] text-foreground">مكتبة باني</span>
        <span className="block text-[10px] text-muted-foreground tracking-normal">Bunny Library</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Logo />

        <nav className="mx-4 hidden items-center gap-1 md:flex" aria-label="التنقل الرئيسي">
          <Button asChild variant="ghost" size="sm" className={pathname === "/" ? "text-foreground bg-accent" : "text-muted-foreground"}>
            <Link href="/">الرئيسية</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className={pathname === "/explore" ? "text-foreground bg-accent" : "text-muted-foreground"}>
            <Link href="/explore">استكشف</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className={pathname === "/library" ? "text-foreground bg-accent" : "text-muted-foreground"}>
            <Link href="/library">المكتبة</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className={pathname === "/updates" ? "text-foreground bg-accent" : "text-muted-foreground"}>
            <Link href="/updates">التحديثات</Link>
          </Button>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2 border-border text-muted-foreground hover:text-foreground">
            <Link href="/explore">
              <Search className="size-4" aria-hidden />
              <span className="hidden sm:inline">ابحث في المكتبة</span>
            </Link>
          </Button>

          {status === "loading" ? (
            <div className="size-9 animate-pulse rounded-full bg-accent" aria-hidden />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="قائمة الحساب">
                  <Avatar className="size-9 border border-border">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                      {(session.user?.name ?? "؟").slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <span className="block text-sm font-medium text-foreground">{session.user?.name}</span>
                  <span className="block text-xs text-muted-foreground" dir="ltr">{session.user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <UserRound className="size-4 me-2" aria-hidden /> حسابي
                  </Link>
                </DropdownMenuItem>
                {(role === "admin" || role === "editor") && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <ShieldCheck className="size-4 me-2" aria-hidden /> لوحة الإدارة
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-danger focus:text-danger"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="size-4 me-2" aria-hidden /> تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const items = [
    { href: "/", label: "الرئيسية", icon: BookOpenText },
    { href: "/explore", label: "استكشف", icon: Compass },
    { href: "/library", label: "المكتبة", icon: Library },
    { href: "/updates", label: "التحديثات", icon: BookMarked },
    { href: status ? "/profile" : "/login", label: status ? "حسابي" : "دخول", icon: UserRound },
  ];
  if (pathname.startsWith("/admin") || pathname.startsWith("/read/")) return null;
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom)]"
      aria-label="التنقل السفلي"
    >
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.label}
              href={it.href}
              className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <it.icon className="size-5" aria-hidden />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 text-foreground">
              <Library className="size-4 text-primary" aria-hidden />
              <span className="font-bold">مكتبة باني</span>
            </div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              مكتبتك الشخصية للقصص التي تستحق الضياع فيها. تجربة قراءة عربية هادئة وفاخرة، بلا إعلانات ولا ضجيج.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <p className="mb-2 font-medium text-foreground">تصفح</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link className="hover:text-foreground" href="/">الرئيسية</Link></li>
                <li><Link className="hover:text-foreground" href="/explore">استكشف</Link></li>
                <li><Link className="hover:text-foreground" href="/library">مكتبتي</Link></li>
                <li><Link className="hover:text-foreground" href="/updates">التحديثات</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-medium text-foreground">الحساب</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link className="hover:text-foreground" href="/login">تسجيل الدخول</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 rounded-lg border border-gold/25 bg-gold/5 px-4 py-3 text-xs leading-6 text-gold">
          منصة تجريبية لأغراض العرض — جميع الأعمال والعناوين والفصول والأسماء هنا محتوى خيالي أصلي أُنشئ خصيصًا لهذا العرض،
          ولا يمثل أي أعمال حقيقية أو مرخّصة.
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">© ٢٠٢٦ مكتبة باني — عرض تجريبي</p>
      </div>
    </footer>
  );
}
