import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 导入PathManager
import PathManager from '@/lib/path-manager';

// 读取CHD协议文件
const readCHDProtocol = (): string => {
  try {
    // 尝试从多个位置读取协议文件
    const possiblePaths = [
      // 配置的CHD协议文档路径
      PathManager.getCHDProtocolPath(),
      // 主要路径 - 核心规划文档
      path.join(process.cwd(), 'docs', '核心规划', '5_CHD协议与AI生成指南.md'),
      // 备用路径 - ML包中的协议文件
      path.join(process.cwd(), 'portable_ml_package', 'resources', 'CHD_protocol.md')
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
    }

    // 如果都不存在，返回默认内容
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
  const response = new NextResponse(protocolContent);
  response.headers.set('Content-Type', 'text/markdown');
  return response;
}