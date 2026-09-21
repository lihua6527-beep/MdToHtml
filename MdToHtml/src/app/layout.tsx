import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/use-toast";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
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
    <html lang="en">
      <head>
        {/* 提前设置背景色，确保首次绘制时不会出现白屏 */}
        <style>{`body { background: #f0f5ff; margin: 0; }`}</style>
      </head>
      <body>
        {/*
          不再使用 initial-loader —— 第 2 阶段（加载动画）在网页加载完成后才出现，
          属于多余的过渡。网页加载完直接显示第 3 阶段（主页内容）。
        */}

        <GlobalErrorBoundary moduleName="Root Layout">
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}