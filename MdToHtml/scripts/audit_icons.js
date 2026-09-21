const fs = require('fs');
const c = fs.readFileSync(__dirname + '/../src/lib/icon-manager.ts', 'utf-8');

const names = [...c.matchAll(/name: '([^']+)'/g)].map(m => m[1]);
const primaries = [...c.matchAll(/primaryName: '([^']+)'/g)].map(m => m[1]);
const standard = names.filter(n => !primaries.includes(n));
const aliases = names.filter(n => primaries.includes(n));

console.log('=== 图标资源审计报告 ===\n');
console.log('ICON_CONFIG 总条目数: ' + names.length);
console.log('标准名（无 primaryName）: ' + standard.length + ' 个');
console.log('别名（有 primaryName）  : ' + aliases.length + ' 个 →', aliases);

// 场景分类
const sceneMap = {};
for (const n of standard) {
    const idx = c.indexOf("name: '" + n + "'");
    const before = c.substring(Math.max(0, idx - 60), idx);
    const after = c.substring(idx, idx + 120);
    const combined = before + after;
    const m = combined.match(/scene: '([^']+)'/);
    if (m) {
        if (!sceneMap[m[1]]) sceneMap[m[1]] = [];
        sceneMap[m[1]].push(n);
    }
}

console.log('\n场景分类明细:');
for (const [scene, icons] of Object.entries(sceneMap).sort()) {
    console.log('  ' + scene + ' (' + icons.length + ' 个):');
    for (let i = 0; i < icons.length; i += 6) {
        console.log('    ' + icons.slice(i, i + 6).join(', '));
    }
}

console.log('\n总计: ' + standard.length + ' 个标准图标，覆盖 ' + Object.keys(sceneMap).length + ' 个场景');