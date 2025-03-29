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
      <head>
        {/* Add direct link to Google Font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Special+Elite&display=swap" rel="stylesheet" />
      </head>
      <body className={specialElite.className}>
        {children}
      </body>
    </html>
  );
}
