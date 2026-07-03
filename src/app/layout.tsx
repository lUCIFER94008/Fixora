import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import BackgroundWrapper from "@/components/layout/BackgroundWrapper";

export const metadata: Metadata = {
  title: "FIXORA | AI-Powered Vehicle Complaint & Workshop Management Platform",
  description: "The ultimate hyper-futuristic ecosystem for auto repairs. Diagnose faults instantly with AI, coordinate with premium workshops, and monitor active repairs in real-time.",
  keywords: ["vehicle repair", "AI diagnostic", "mechanic queue", "car check", "workshop manager", "real-time chat"],
  icons: {
    icon: "https://res.cloudinary.com/dpmpefw2p/image/upload/v1782325003/ChatGPT_Image_Jun_24_2026_11_46_25_PM_vdhyet.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-neon-cyan selection:text-black">
        <Providers>
          <BackgroundWrapper>
            {children}
          </BackgroundWrapper>
        </Providers>
      </body>
    </html>
  );
}

