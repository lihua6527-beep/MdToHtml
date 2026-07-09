/**
 * POST /api/ai/config/save
 *
 * 保存 API Key 到 .env.local 文件
 * - 接收前端传来的 API Key
 * - 写入服务端 .env.local 文件（追加或替换已有 Key）
 * - 仅用于持久化，内存由 ApiKeyManager 管理
 *
 * ⚠️ 安全说明：
 * - .env.local 中的 API Key 仅在服务端 API Route 中使用
 * - 不会暴露到前端
 * - .env.local 已加入 .gitignore，不会被提交到 Git 仓库
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/** 验证 API Key 格式（DeepSeek Key 以 sk- 开头） */
function isValidApiKey(key: string): boolean {
  return typeof key === 'string' && key.trim().length > 0 && key.trim().startsWith('sk-');
}

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const { apiKey } = await request.json();

    // 2. 校验参数
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: '缺少必要参数: apiKey' },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();

    if (!isValidApiKey(trimmedKey)) {
      return NextResponse.json(
        { error: 'API Key 格式无效，DeepSeek API Key 应以 sk- 开头' },
        { status: 400 }
      );
    }

    // 3. 确定 .env.local 路径
    // 在 Next.js 中，当前工作目录即为项目根目录
    const envPath = path.join(process.cwd(), '.env.local');

    // 4. 读取现有内容并更新
    let content = '';
    let found = false;

    try {
      content = await fs.readFile(envPath, 'utf-8');
    } catch {
      // 文件不存在，从空白开始
      content = '';
    }

    const lines = content.split('\n');
    const newLines = lines.map((line) => {
      if (line.startsWith('DEEPSEEK_API_KEY=')) {
        found = true;
        return `DEEPSEEK_API_KEY=${trimmedKey}`;
      }
      return line;
    });

    if (!found) {
      // 追加新行（保留文件末尾空行）
      if (newLines.length > 0 && newLines[newLines.length - 1] !== '') {
        newLines.push('');
      }
      newLines.push(`DEEPSEEK_API_KEY=${trimmedKey}`);
    }

    // 5. 写入文件
    await fs.writeFile(envPath, newLines.join('\n'), 'utf-8');

    console.log('[AI Config Save] API Key 已保存到 .env.local');

    return NextResponse.json({
      success: true,
      message: 'API Key 已保存到 .env.local',
    });
  } catch (error: any) {
    console.error('[AI Config Save] Error:', error);

    return NextResponse.json(
      {
        error: `保存失败: ${error.message || '文件写入错误'}`,
        hint: '请检查 .env.local 文件权限，或手动添加 DEEPSEEK_API_KEY=sk-your-key',
      },
      { status: 500 }
    );
  }
}