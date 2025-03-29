import type { Metadata } from "next";
import { Special_Elite } from "next/font/google";
import "./globals.css";

// Special Elite only has weight 400
const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Random Cat Generator",
  description: "Generate random cats with different features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      {/* Use Next.js font system instead of direct links which cause warnings */}
      <body className={specialElite.className}>
        {children}
      </body>
    </html>
  );
}
