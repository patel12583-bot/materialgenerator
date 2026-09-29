import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campus Attendance",
  description: "Professional college attendance management platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}