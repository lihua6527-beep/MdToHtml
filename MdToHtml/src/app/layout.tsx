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
          初始加载指示器 - 用 SVG 实现，完全不依赖 CSS
          SVG <animateTransform> 动画引擎在 HTML 解析阶段即刻生效
          通过内联 <script> 在页面实际加载完成后延迟隐藏
          不再依赖 React hydration（解决了水合前白屏问题）
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
          transition: 'opacity 0.4s ease-out'
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
          }}>正在准备...</p>
        </div>

        {/* 
          内联脚本：控制加载指示器的隐藏时机
          策略：等待 window.onload（所有资源加载完毕）后再延迟 800ms 淡出
          保证用户看到加载动画直到真实内容就绪
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var loader = document.getElementById('initial-loader');
                if (!loader) return;
                
                function hideLoader() {
                  loader.style.opacity = '0';
                  setTimeout(function() { 
                    if (loader.parentNode) loader.parentNode.removeChild(loader);
                  }, 500);
                }
                
                // 如果页面已经加载完成，直接隐藏
                if (document.readyState === 'complete') {
                  setTimeout(hideLoader, 800);
                } else {
                  window.addEventListener('load', function() {
                    setTimeout(hideLoader, 800);
                  });
                }
                
                // 后备：3秒后强制隐藏（防止某些状况下永不隐藏）
                setTimeout(hideLoader, 3000);
              })();
            `
          }}
        />

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