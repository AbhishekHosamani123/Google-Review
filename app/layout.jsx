import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import IconFontReady from "@/components/IconFontReady";

// Typography system (matched to the reference site's rendering):
//  - Inter for UI/body text
//  - Bricolage Grotesque for display headings
// next/font self-hosts both at build time — no render-blocking requests, no layout shift.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });

export const metadata = {
  title: "ReviewHub — Smart Google Reviews for every shop",
  description: "Generate and manage NFC/QR Google review cards for multiple shops. Dynamic QR redirect + template-based review helper. No LLM, no backend.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..400,0..1,0&display=block" rel="stylesheet" />
      </head>
      <body>
        <IconFontReady />
        {children}
      </body>
    </html>
  );
}
