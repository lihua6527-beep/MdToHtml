/**
 * POST /api/ai/config/test-connection — 占位接口
 *
 * 现状：返回 501。连通性检测必须先有服务端代理链路，否则无从验证。
 *
 * 待办：最小请求 + 延迟测量，由协作阶段实现。
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { ok: false, error: '尚未实现：连通性检测待服务端代理落地后接入' },
    { status: 501 }
  );
}
