import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeriesForm } from "@/components/admin/admin-client";

export const dynamic = "force-dynamic";

export default function NewSeriesPage() {
  return (
    <main className="mx-auto max-w-3xl p-4 pt-6 sm:p-6">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5 text-muted-foreground">
        <Link href="/admin/series">
          <ArrowRight className="size-4" aria-hidden />
          عودة إلى الأعمال
        </Link>
      </Button>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">عمل جديد</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          بيانات العمل الأساسية — الغلاف والفصول تُدار من صفحة العمل بعد الإنشاء.
        </p>
      </header>
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
        <SeriesForm />
      </div>
    </main>
  );
}
