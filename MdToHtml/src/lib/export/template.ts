export const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="{{THEME}}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>
        /* Base Reset & Variables */
        :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --popover: 0 0% 100%;
            --popover-foreground: 222.2 84% 4.9%;
            --primary: 222.2 47.4% 11.2%;
            --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96.1%;
            --secondary-foreground: 222.2 47.4% 11.2%;
            --muted: 210 40% 96.1%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --accent: 210 40% 96.1%;
            --accent-foreground: 222.2 47.4% 11.2%;
            --destructive: 0 84.2% 60.2%;
            --destructive-foreground: 210 40% 98%;
            --border: 214.3 31.8% 91.4%;
            --input: 214.3 31.8% 91.4%;
            --ring: 222.2 84% 4.9%;
            --radius: 0.5rem;
            --chart-1: 12 76% 61%;
            --chart-2: 173 58% 39%;
            --chart-3: 197 37% 24%;
            --chart-4: 43 74% 66%;
            --chart-5: 27 87% 67%;
        }

        .dark {
            --background: 222.2 84% 4.9%;
            --foreground: 210 40% 98%;
            --card: 222.2 84% 4.9%;
            --card-foreground: 210 40% 98%;
            --popover: 222.2 84% 4.9%;
            --popover-foreground: 210 40% 98%;
            --primary: 210 40% 98%;
            --primary-foreground: 222.2 47.4% 11.2%;
            --secondary: 217.2 32.6% 17.5%;
            --secondary-foreground: 210 40% 98%;
            --muted: 217.2 32.6% 17.5%;
            --muted-foreground: 215 20.2% 65.1%;
            --accent: 217.2 32.6% 17.5%;
            --accent-foreground: 210 40% 98%;
            --destructive: 0 62.8% 30.6%;
            --destructive-foreground: 210 40% 98%;
            --border: 217.2 32.6% 17.5%;
            --input: 217.2 32.6% 17.5%;
            --ring: 212.7 26.8% 83.9%;
            --chart-1: 220 70% 50%;
            --chart-2: 160 60% 45%;
            --chart-3: 30 80% 55%;
            --chart-4: 280 65% 60%;
            --chart-5: 340 75% 55%;
        }

        body { 
            margin: 0; 
            padding: 0; 
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: hsl(var(--bg-page));
            color: hsl(var(--text-primary));
            transition: background-color 0.3s, color 0.3s;
        }

        /* Container */
        .chd-export-container {
            max-width: 90rem; /* Increased to max-w-7xl+ to match editor feel */
            margin: 0 auto;
            padding: 2rem;
            min-height: 100vh;
        }

        /* Extracted CSS */
        {{CSS}}

        /* ========================================
           PDF/Print 导出样式
           利用 @media print + window.print() 实现零依赖 PDF
           ======================================== */
        @media print {
            @page {
                margin: 2cm;
                size: A4;
            }

            body {
                font-size: 12pt;
                line-height: 1.6;
                color: #000;
                background: #fff !important;
            }

            .chd-export-container {
                max-width: 100%;
                padding: 0;
                margin: 0;
            }

            nav, button, iframe, .toolbar, .no-print,
            [class*="debug"], [class*="fixed"], [class*="sticky"] {
                display: none !important;
            }

            /* Section 分页控制 */
            [class*="section"] {
                page-break-after: auto;
                margin-bottom: 1.5cm;
            }

            /* 卡片不跨页 */
            [class*="card"] {
                break-inside: avoid;
                page-break-inside: avoid;
            }

            /* 代码块 */
            pre, code {
                font-size: 9pt;
                white-space: pre-wrap;
                word-break: break-all;
                background: #f5f5f5 !important;
                border: 1px solid #ddd !important;
            }

            /* 表格 */
            table {
                font-size: 10pt;
                border-collapse: collapse;
                width: 100%;
            }
            th, td {
                border: 1px solid #ccc;
                padding: 6px 10px;
            }

            /* 链接显示 URL */
            a[href^="http"]:after {
                content: " (" attr(href) ")";
                font-size: 9pt;
                color: #666;
                word-break: break-all;
            }

            /* 图片适配 */
            img {
                max-width: 100% !important;
                page-break-inside: avoid;
            }

            /* 数学公式 */
            .katex { font-size: 11pt !important; }

            /* 统一白色背景覆盖 */
            * {
                background: #fff !important;
                color: #000 !important;
                box-shadow: none !important;
                text-shadow: none !important;
            }
        }
    </style>
    <script>
        // Init Theme
        {{THEME_SCRIPT}}
    </script>
</head>
<body>
    <div id="root" class="chd-export-container">
        {{CONTENT}}
    </div>
    <script>
        {{SCRIPT}}
    </script>
</body>
</html>`;
