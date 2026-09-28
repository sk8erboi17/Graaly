import type { Metadata, Viewport } from "next";
import { Chivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const graalySans = Chivo({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

const graalyMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sk8erboi17.github.io/Graaly/docs/"),
  title: {
    default: "Graaly Docs: JavaScript, TypeScript, Python, and C plugins",
    template: "%s · Graaly Docs",
  },
  description:
    "Build Graaly plugins in JavaScript, TypeScript, Python, and sandboxed C/WebAssembly from Minecraft 1.7.10 through 26.2.",
  icons: {
    icon: "graaly-logo-96.png",
    apple: "graaly-logo.png",
  },
  keywords: [
    "Graaly",
    "Minecraft 1.7.10 to 26.2",
    "GraalJS",
    "GraalPy",
    "GraalWasm",
    "C WebAssembly",
    "TypeScript",
    "PacketEvents",
    "React renderer",
    "HTML CSS Minecraft GUI",
    "FastAPI",
    "SQLAlchemy",
    "GraalyBoard",
    "HTML boards",
    "Java 17+",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Graaly: Minecraft plugins in TypeScript, Python, and C/WebAssembly",
    description: "A stable Graaly scripting API plus an educational sandboxed C ABI, React UI, FastAPI, PacketEvents, and website-board documentation.",
    siteName: "Graaly Docs",
    images: [{
      url: "og.png",
      width: 1672,
      height: 941,
      alt: "Graaly: Build plugins. Design boards.",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Graaly: Minecraft plugins with TypeScript, JavaScript, Python, and C",
    description: "Build plugins in JavaScript, TypeScript, Python, and sandboxed C/WebAssembly, with Java shown as the host-side comparison.",
    images: ["og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#090b0d" },
    { media: "(prefers-color-scheme: light)", color: "#f5f3ee" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-theme="light" lang="en" suppressHydrationWarning>
      <body className={graalySans.variable + " " + graalyMono.variable}>
        {children}
      </body>
    </html>
  );
}
