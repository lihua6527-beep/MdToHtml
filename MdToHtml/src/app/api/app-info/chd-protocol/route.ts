import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PathManager from '@/lib/path-manager';

const readCHDProtocol = (): string => {
  try {
    const possiblePaths = [
      PathManager.getCHDProtocolPath(),
      path.join(process.cwd(), 'docs', '核心规划', '5_CHD协议与AI生成指南.md'),
      path.join(process.cwd(), 'portable_ml_package', 'resources', 'CHD_protocol.md')
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
    }

    return `# CHD协议未找到

请确保CHD协议文件存在于以下位置之一：
- ${PathManager.getCHDProtocolPath()}
- docs/核心规划/5_CHD协议与AI生成指南.md
- portable_ml_package/resources/CHD_protocol.md`;
  } catch (error) {
    console.error('Error reading CHD protocol:', error);
    return `# CHD协议读取错误

${error instanceof Error ? error.message : '未知错误'}`;
  }
};

export async function GET() {
  const protocolContent = readCHDProtocol();
  return new NextResponse(protocolContent, {
    headers: {
      'Content-Type': 'text/markdown'
    }
  });
}
