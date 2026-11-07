import type { Metadata } from "next";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/geist-mono/wght.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Continental",
    template: "%s | The Continental",
  },
  description:
    "Career intelligence and operations built around evidence, grounded actions, and durable career memory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
