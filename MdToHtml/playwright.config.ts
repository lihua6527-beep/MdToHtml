import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // 顺序执行：E2E 共享同一个隔离数据目录（.e2e-tmp/input），并行会互相干扰。
  // 各用例仍使用各自唯一的 fixture 文件名，互不覆盖。
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    // 固定为 false：确保 E2E 始终由 Playwright 自己拉起带隔离配置的服务器。
    // 若复用已在运行（未加 MDTOHTML_CONFIG）的服务器，测试会直接操作真实文档目录。
    reuseExistingServer: false,
    // 超时：本机首次编译 2~5s，30s 足够；GitHub 的 2 核 runner 首次编译
    // 明显更慢（15~40s），故 CI 下放宽到 120s，否则 e2e job 会以
    // "Timed out waiting 30000ms for the webServer" 这种与代码无关的原因变红。
    timeout: process.env.CI ? 120000 : 30000,
    env: {
      // 数据隔离：加载 config.e2e.json，把 input / output / data / trash 指向 .e2e-tmp/
      MDTOHTML_CONFIG: 'config.e2e.json',
    },
  },
});