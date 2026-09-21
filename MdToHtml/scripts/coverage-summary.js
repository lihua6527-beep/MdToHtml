/* coverage-summary.js -- 把 Jest 覆盖率写进 GitHub Actions 运行摘要。
 *
 * 为什么需要这个文件：
 *   pr-check.yml / ci.yml 此前只把 coverage/ 作为 artifact 上传，看数要下载压缩包；
 *   接入 Codecov 又需要额外账号与 secret。本脚本用 GitHub 原生的
 *   $GITHUB_STEP_SUMMARY 机制，把四项覆盖率直接渲染到运行页面 —— 零外部依赖。
 *
 * 数据来源：coverage/coverage-summary.json（由 jest.config.js 的
 *   coverageReporters 生成，故该 reporter 必须保留）。
 *
 * 行为：
 *   - 本地运行：只往 stdout 打印表格（GITHUB_STEP_SUMMARY 未设置时）
 *   - CI 运行：追加 markdown 表格到 $GITHUB_STEP_SUMMARY
 *   - 任何异常都吞掉并以 0 退出：看板不得影响门禁结果
 *     （workflow 中同时标了 continue-on-error: true 作为双保险）
 *
 * Usage: node scripts/coverage-summary.js   (run from MdToHtml/)
 */
const fs = require('fs');
const path = require('path');

const SUMMARY_PATH = path.resolve(__dirname, '..', 'coverage', 'coverage-summary.json');
const METRICS = ['statements', 'branches', 'functions', 'lines'];
const LABELS = {
  statements: 'Statements（语句）',
  branches: 'Branches（分支）',
  functions: 'Functions（函数）',
  lines: 'Lines（行）',
};

function main() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.log('[coverage-summary] 未找到 coverage/coverage-summary.json，跳过（先跑 npm run test:ci）');
    return;
  }

  const total = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8')).total;
  if (!total) {
    console.log('[coverage-summary] coverage-summary.json 缺少 total 字段，跳过');
    return;
  }

  const lines = [
    '### 覆盖率（全量 src 口径）',
    '',
    '| 指标 | 覆盖率 | 已覆盖 / 总数 |',
    '|------|-------:|--------------:|',
  ];
  for (const key of METRICS) {
    const m = total[key];
    if (!m) continue;
    lines.push(`| ${LABELS[key]} | ${m.pct}% | ${m.covered} / ${m.total} |`);
  }
  lines.push('');
  lines.push('> 阈值门禁见 `MdToHtml/jest.config.js` 的 `coverageThreshold`；口径为全量 `src/**`（非"测试触达文件"）。');
  const table = lines.join('\n');

  console.log(table);

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, table + '\n', 'utf8');
    console.log(`[coverage-summary] 已写入 ${summaryFile}`);
  }
}

try {
  main();
} catch (err) {
  console.log(`[coverage-summary] 生成摘要失败（不影响门禁）：${err && err.message}`);
}
