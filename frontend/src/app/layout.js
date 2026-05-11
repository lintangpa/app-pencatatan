import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Pencatatan Keuangan",
  description: "Aplikasi pencatatan keuangan pribadi",
};

import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
