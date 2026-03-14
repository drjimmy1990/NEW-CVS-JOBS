import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "GrowthNexus - منصة التوظيف الذكية",
  description: "منصة توظيف ذكية مدعومة بالذكاء الاصطناعي في الإمارات. أنشر وظائف، حلل السير الذاتية بالذكاء الاصطناعي، ووظّف بذكاء.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} font-sans antialiased`}
      >
        <Navbar />
        {children}
        <Toaster richColors position="bottom-left" />
      </body>
    </html>
  );
}


