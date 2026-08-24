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
    default: "Graaly Docs: JavaScript, TypeScript, and Python plugins",
    template: "%s · Graaly Docs",
  },
  description:
    "Build Graaly plugins with one stable JavaScript, TypeScript, and Python API from Minecraft 1.7.10 through 26.2.",
  keywords: [
    "Graaly",
    "Minecraft 1.7.10 to 26.2",
    "GraalJS",
    "GraalPy",
    "TypeScript",
    "PacketEvents",
    "React renderer",
    "FastAPI",
    "SQLAlchemy",
    "GraalyBoard",
    "HTML boards",
    "Java 17+",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Graaly: stable Minecraft plugins in TypeScript and Python",
    description: "One version-independent Graaly API, React UI, FastAPI, PacketEvents, and website-board documentation.",
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
    title: "Graaly: Minecraft plugins with TypeScript, JavaScript, and Python",
    description: "Build plugins, React game UI, Python services and website boards in JavaScript, TypeScript, Python, and Java.",
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
