import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TextSelectionProvider } from "@/components/text-selection/text-selection-provider";
import { CaseStudyProvider } from "@/contexts/case-study-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Innovation Kit - Transform Ideas into Pitch Decks",
  description: "AI-powered innovation wizard guiding you through transforming ideas into validated business concepts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CaseStudyProvider>
          <TextSelectionProvider>{children}</TextSelectionProvider>
        </CaseStudyProvider>
      </body>
    </html>
  );
}
