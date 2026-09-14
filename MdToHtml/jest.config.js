const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // 只收集 src 下的单元测试；e2e/ 由 Playwright 负责（此前缺失该排除项，
  // 导致 3 个 Playwright spec 被 Jest 误收并报 "Class extends value undefined"）
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.spec.{ts,tsx}',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/.next/'],
  // 覆盖率统计范围：全量 src（排除测试文件与类型声明）
  // 说明：此前未设置 collectCoverageFrom，分母仅为"测试实际触达的文件"，
  // 会把覆盖率显著抬高（曾显示 41%）。改为全量统计后才是真实数字。
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],
  // 覆盖率阈值（防回退门禁）
  // 2026-09-14 全量口径实测基线：Stmts 20.5 / Branch 15.82 / Funcs 14.03 / Lines 21.25
  // 取 阈值 = floor(实测) - 1 作为安全边际，仅用于防止回退；
  // 覆盖率目标见 plans/测试工程/00_CI全绿计划书_2026-09-14.md（P2 后续逐步抬升）
  coverageThreshold: {
    global: {
      statements: 19,
      branches: 14,
      functions: 13,
      lines: 20,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|remark-gfm|remark-math|remark-breaks|rehype-katex|unified|remark-parse|remark-stringify|rehype-parse|rehype-stringify|mdast-util-from-markdown|mdast-util-to-markdown|micromark)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
