import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/use-toast";
import "./globals.css";
import 'katex/dist/katex.min.css'; // Global KaTeX styles for formula rendering

export const metadata: Metadata = {
  title: "CHD Document Renderer",
  description: "Render CHD formatted markdown documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
