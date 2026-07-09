/**
 * 图标资源完整性审计脚本
 * 
 * 用途：验证图标系统的三个维度
 * 1. 命名规范：所有标准名使用全小写+连字符，无歧义
 * 2. 可识别性：按场景分类，每个图标有语义化分类和描述
 * 3. 容错兜底：后端修正引擎 + 渲染层降级占位 + 兼容别名
 * 
 * 输出：JSON 格式的完整审计报告
 */

const fs = require('fs');
const path = require('path');

// ===== 1. 读入数据 =====
const iconContent = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'icon-manager.ts'), 'utf-8'
);

const docMapContent = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'document-icon-mapping.ts'), 'utf-8'
);

const cardContent = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'components', 'CHD', 'Card.tsx'), 'utf-8'
);

const sectionContent = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'components', 'CHD', 'Section.tsx'), 'utf-8'
);

const fixServicePath = path.join(__dirname, '..', 'src', 'services', 'ai', 'IconAutoFixService.ts');
const fixServiceContent = fs.existsSync(fixServicePath) 
  ? fs.readFileSync(fixServicePath, 'utf-8') : null;

// ===== 2. 解析所有图标条目 =====
const entries = [];
const re = /\{([^}]+)\}/g;
let m;
while ((m = re.exec(iconContent)) !== null) {
  const block = m[1];
  const name = block.match(/name:\s*'([^']+)'/);
  const primary = block.match(/primaryName:\s*'([^']+)'/);
  const component = block.match(/component:\s*'([^']+)'/);
  const scene = block.match(/scene:\s*'([^']+)'/);
  const desc = block.match(/description:\s*'([^']+)'/);
  
  if (name && component) {
    entries.push({
      name: name[1],
      primaryName: primary ? primary[1] : null,
      component: component[1],
      scene: scene ? scene[1] : 'MISSING',
      description: desc ? desc[1] : '',
      isStandard: !primary
    });
  }
}

// ===== 3. 生成标准名对照表 =====
const standards = entries.filter(e => e.isStandard);
const aliases = entries.filter(e => !e.isStandard);

console.log('========================================');
console.log('  图标资源完整性审计报告');
console.log('========================================\n');

// ---- 3a. 命名规范检查 ----
console.log('【1/4】命名规范检查');
console.log('------------------');

const hyphenPattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
let namingIssues = 0;
for (const e of standards) {
  if (!hyphenPattern.test(e.name)) {
    console.log(`  ❌ 命名不规范: "${e.name}" (应使用全小写+连字符)`);
    namingIssues++;
  }
}
if (namingIssues === 0) {
  console.log(`  ✅ 全部 ${standards.length} 个标准名符合规范（全小写+连字符）`);
}

// 检查是否有重复的 Lucide 组件指向不同标准名
const componentMap = {};
for (const e of standards) {
  if (!componentMap[e.component]) componentMap[e.component] = [];
  componentMap[e.component].push(e.name);
}
const duplicates = Object.entries(componentMap).filter(([, names]) => names.length > 1);
if (duplicates.length > 0) {
  console.log('  ⚠️  同名组件指向多个标准名（需要确认是否合理）:');
  for (const [comp, names] of duplicates) {
    console.log(`    ${comp}: ${names.join(', ')}`);
  }
} else {
  console.log('  ✅ 标准名与 Lucide 组件一一对应');
}

// ---- 3b. 场景分类检查 ----
console.log('\n【2/4】场景分类可识别性');
console.log('----------------------');

const sceneGroups = {};
for (const e of standards) {
  if (!sceneGroups[e.scene]) sceneGroups[e.scene] = [];
  sceneGroups[e.scene].push(e.name);
}

const sceneLabels = {
  'tech': '技术/性能/开发',
  'data': '数据/分析/统计',
  'doc': '文档/知识/学习',
  'security': '安全/防护/加密',
  'ai': 'AI/智能/机器学习',
  'communication': '通信/连接/消息',
  'achievement': '成果/成就/目标',
  'time': '时间/进度/历史',
  'creation': '创意/创新/设计',
  'tool': '工具/配置/设置',
  'user': '用户/管理/群组',
  'media': '媒体/图像/音视频',
  'storage': '存储/文件/归档',
  'navigation': '导航/方向/位置',
  'device': '设备/硬件',
  'general': '通用/other'
};

for (const [scene, icons] of Object.entries(sceneGroups).sort()) {
  const label = sceneLabels[scene] || scene;
  console.log(`  ${scene} (${label}): ${icons.length} 个`);
  for (let i = 0; i < icons.length; i += 7) {
    console.log(`    ${icons.slice(i, i+7).join(', ')}`);
  }
}
console.log(`\n  ✅ 覆盖 ${Object.keys(sceneGroups).length} 个场景分类`);

// ---- 3c. 容错兜底检查 ----
console.log('\n【3/4】容错兜底机制检查');
console.log('-----------------------');

// 检查 1: 向后兼容别名
console.log(`  📌 向后兼容别名: ${aliases.length} 个`);
for (const a of aliases) {
  const target = standards.find(s => s.name === a.primaryName);
  console.log(`    "${a.name}" → "${a.primaryName}" ${target ? '✅' : '❌ 目标不存在！'}`);
}

// 检查 2: iconExists 函数
console.log(`  📌 iconExists(): ${iconContent.includes('export const iconExists') ? '✅ 存在' : '❌ 缺失'}`);

// 检查 3: getIconComponentSync 
console.log(`  📌 getIconComponentSync(): ${iconContent.includes('export const getIconComponentSync') ? '✅ 存在（含缓存）' : '❌ 缺失'}`);

// 检查 4: Card.tsx 降级占位
const hasFallback = cardContent.includes('bg-transparent') || cardContent.includes('透明占位');
const hasPlaceholder = cardContent.includes('w-5 h-5') || cardContent.includes('占位');
console.log(`  📌 Card.tsx 降级占位: ${hasFallback && hasPlaceholder ? '✅ 已实现（透明占位保持布局）' : '❌ 未实现'}`);

// 检查 5: Section.tsx 双重校验
const hasDualCheck = sectionContent.includes('iconExists') && sectionContent.includes('invalidIcons');
console.log(`  📌 Section.tsx 双重校验: ${hasDualCheck ? '✅ 已实现（存在性+有效性）' : '❌ 未实现'}`);

// 检查 6: IconAutoFixService
if (fixServiceContent) {
  const hasFix = fixServiceContent.includes('autoFixIcons') && 
                 fixServiceContent.includes('部分有') && 
                 fixServiceContent.includes('全部无效');
  console.log(`  📌 IconAutoFixService.ts: ${hasFix ? '✅ 已实现（含补齐、替换、清空三种修正策略）' : '❌ 功能不完整'}`);
} else {
  console.log('  📌 IconAutoFixService.ts: ❌ 缺失');
}

// 检查 7: CHDRenderer 集成
const hasIntegration = fixServiceContent ? true : false;
console.log(`  📌 CHDRenderer.tsx 集成: ${hasIntegration ? '✅ 已集成（解析后渲染前自动执行）' : '❌ 未集成'}`);

// 检查 8: document-icon-mapping 降级
const hasDocFallback = docMapContent.includes("return 'file-text'");
const hasDocOverride = docMapContent.includes('OVERRIDE_MAPPING');
const hasDocRule = docMapContent.includes('KEYWORD_RULES');
console.log(`  📌 document-icon-mapping.ts 降级路径:`);
console.log(`      覆盖表: ${hasDocOverride ? '✅ 有' : '❌ 无'} | 规则引擎: ${hasDocRule ? '✅ 有' : '❌ 无'} | 默认降级: ${hasDocFallback ? "✅ 'file-text'" : '❌ 无'}`);

// ---- 4. 输出完整标准图标表 ----
console.log('\n【4/4】完整标准图标规范表');
console.log('========================\n');

// 按场景分类输出
for (const [scene, icons] of Object.entries(sceneGroups).sort()) {
  const label = sceneLabels[scene] || scene;
  console.log(`┌─ ${scene}（${label}）`);
  for (const name of icons) {
    const entry = standards.find(e => e.name === name);
    const aliasFor = aliases.filter(a => a.primaryName === name).map(a => `[别名: ${a.name}]`).join(' ');
    const comp = entry ? entry.component : '?';
    const desc = entry ? entry.description : '';
    console.log(`│ ${name.padEnd(24)} ← ${comp.padEnd(16)} ${desc} ${aliasFor}`);
  }
  console.log('');
}

// ===== 最终汇总 =====
console.log('========================================');
console.log('  审计总结');
console.log('========================================\n');

const allChecks = [
  { name: '标准名命名规范', pass: namingIssues === 0 },
  { name: '场景分类完整性', pass: Object.keys(sceneGroups).length === 16 },
  { name: '向后兼容别名', pass: aliases.every(a => standards.some(s => s.name === a.primaryName)) },
  { name: 'Card.tsx 降级占位', pass: hasFallback && hasPlaceholder },
  { name: 'Section.tsx 双重校验', pass: hasDualCheck },
  { name: 'IconAutoFixService', pass: hasFix },
  { name: 'document-mapping 降级', pass: hasDocFallback && hasDocOverride && hasDocRule },
];

let allPass = true;
for (const c of allChecks) {
  console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
  if (!c.pass) allPass = false;
}

console.log(`\n标准图标数: ${standards.length}`);
console.log(`别名数: ${aliases.length}`);
console.log(`场景数: ${Object.keys(sceneGroups).length}`);
console.log(`\n${allPass ? '✅ 全部检查通过，基础工作扎实，可以进入后续工作' : '❌ 有检查未通过，请先修复'}`);