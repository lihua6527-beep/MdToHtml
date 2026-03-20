import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/use-toast";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { healthCheckService } from "@/lib/health-check";
import { logger } from "@/lib/logger";
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
  // Perform health check on app load
  if (typeof window !== 'undefined') {
    // Run health check in the background
    healthCheckService.checkHealth().then(result => {
      if (result.status !== 'healthy') {
        logger.warn('App started with degraded health status', {
          module: 'RootLayout',
          context: { status: result.status, message: result.message }
        });
      } else {
        logger.info('App started with healthy status', {
          module: 'RootLayout'
        });
      }
    }).catch(error => {
      logger.error('Health check failed during startup', {
        module: 'RootLayout',
        context: { error }
      });
    });
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
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
