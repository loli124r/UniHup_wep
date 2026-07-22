import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "UniHub — أرشيف الطالب الجامعي",
    template: "%s | UniHub",
  },
  description: "منصة UniHub الجامعية: ملخصات، أسئلة، محاضرات، جدول، درجات، وحضور — كل شيء بمكان واحد.",
  openGraph: {
    title: "UniHub",
    description: "منصة UniHub الجامعية",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UniHub",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${inter.variable}`}>
      <body className="font-sans bg-bg text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
