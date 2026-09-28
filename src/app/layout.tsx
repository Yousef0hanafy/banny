import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "مكتبة باني — مكتبتك العربية للقصص",
    template: "%s · مكتبة باني",
  },
  description:
    "منصة قراءة عربية فاخرة للمانجا والمانهوا والويبتون والروايات — مكتبتك الشخصية للقصص التي تستحق الضياع فيها. نسخة تجريبية بمحتوى خيالي.",
  applicationName: "Bunny Library",
};

export const viewport: Viewport = {
  themeColor: "#0B0B10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body className={`${arabic.variable} font-sans antialiased bg-background text-foreground`}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
