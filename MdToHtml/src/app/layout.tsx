import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/use-toast";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import InitialLoader from "@/components/InitialLoader";
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
          初始加载指示器 - 用 SVG 实现，完全不依赖 CSS
          SVG <animateTransform> 动画引擎在 HTML 解析阶段即刻生效
          无需等待任何外部 CSS 文件下载
        */}
        <div id="initial-loader" style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f5ff',
          transition: 'opacity 0.3s ease-out'
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            {/* 背景灰色轨道 */}
            <circle cx="24" cy="24" r="20" stroke="#d0d7ff" strokeWidth="4" fill="none" />
            {/* 蓝色旋转弧线 - SVG 原生动画，零 CSS 依赖 */}
            <circle cx="24" cy="24" r="20" stroke="#4f6ef7" strokeWidth="4" fill="none"
              strokeDasharray="125" strokeDashoffset="0" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate"
                from="0 24 24" to="360 24 24" dur="0.8s" repeatCount="indefinite" />
            </circle>
          </svg>
          <p style={{
            marginTop: '20px',
            fontSize: '14px',
            color: '#6b7280',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif'
          }}>正在加载...</p>
        </div>

        <GlobalErrorBoundary moduleName="Root Layout">
          <ThemeProvider>
            <ToastProvider>
              <InitialLoader />
              {children}
            </ToastProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
