/**
 * POST /api/ai/config/save — 占位接口
 *
 * 现状：返回 501。API Key 的存储与热加载方式尚未定稿
 *       （需要先确认「Key 只存在于服务端」的方案），故先保留接口形态。
 *
 * 待办：文件落盘 + 进程内热加载，由协作阶段实现。
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: '尚未实现：API Key 保存接口待接入（计划：写入本地环境文件并热加载）' },
    { status: 501 }
  );
}
