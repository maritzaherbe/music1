import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Own Song — become the artist of your own song",
  description:
    "Turn a feeling into a real song in about a minute. Answer a few warm questions and we'll compose it for you.",
};

export const viewport: Viewport = {
  themeColor: "#fff7fb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Ambient background — decorative only, always behind content. */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-300/50 blur-3xl motion-safe:animate-float" />
          <div
            className="absolute right-[-4rem] top-1/4 h-80 w-80 rounded-full bg-pink-400/45 blur-3xl motion-safe:animate-float-slow"
            style={{ animationDelay: "-4s" }}
          />
          <div
            className="absolute bottom-[-6rem] left-1/4 h-64 w-64 rounded-full bg-sky-300/50 blur-3xl motion-safe:animate-float"
            style={{ animationDelay: "-8s" }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
