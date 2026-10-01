import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata={
 title:{default:"Noble | Digital Campus Platform",template:"%s | Noble"},
 description:"Noble Group of Institutions — attendance and academic operations platform.",
 applicationName:"Noble Digital Campus"
};

export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}