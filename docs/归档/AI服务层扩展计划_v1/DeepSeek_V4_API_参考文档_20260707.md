# DeepSeek V4 API 参考文档

> **用途**: 为 MdToHtml Pro AI 服务层开发提供 API 调用参考
> **模型**: DeepSeek Flash (`deepseek-chat`) / DeepSeek Pro (`deepseek-reasoner`)
> **协议**: 兼容 OpenAI Chat Completions 格式
> **日期**: 2026-07-07

---

## 一、基本信息

| 项目 | 值 |
|------|-----|
| **API 端点** | `POST https://api.deepseek.com/v1/chat/completions` |
| **认证方式** | `Authorization: Bearer <DEEPSEEK_API_KEY>` |
| **Flash 模型名** | `deepseek-chat` |
| **Pro 模型名** | `deepseek-reasoner` |
| **Content-Type** | `application/json` |

---

## 二、请求格式 (Request)

### 2.1 完整请求示例

```bash
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your-deepseek-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {
        "role": "system",
        "content": "你是一位专业的信息架构师..."
      },
      {
        "role": "user",
        "content": "用户输入的原始文本内容..."
      }
    ],
    "stream": false,
    "max_tokens": 4096,
    "temperature": 0.3
  }'
```

### 2.2 请求体参数详解

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `model` | `string` | **是** | — | `deepseek-chat`(Flash) 或 `deepseek-reasoner`(Pro) |
| `messages` | `array` | **是** | — | 消息列表，包含 system/user/assistant 角色 |
| `messages[].role` | `string` | **是** | — | `system` / `user` / `assistant` |
| `messages[].content` | `string` | **是** | — | 消息内容文本 |
| `stream` | `boolean` | 否 | `false` | 是否启用流式输出（SSE） |
| `max_tokens` | `number` | 否 | `4096` | 最大输出 token 数（上限 8192） |
| `temperature` | `number` | 否 | `0.3` | 生成温度，0.0-1.0（本项目固定使用 0.3） |
| `top_p` | `number` | 否 | `0.95` | Top-P 采样参数 |
| `frequency_penalty` | `number` | 否 | `0` | 频率惩罚（本项目使用默认值 0） |
| `presence_penalty` | `number` | 否 | `0` | 存在惩罚（本项目使用默认值 0） |
| `stop` | `string/array` | 否 | `null` | 停止序列 |

### 2.3 本项目使用的请求体模板

```json
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "system",
      "content": "[PromptEngine 生成的 System Prompt]"
    },
    {
      "role": "user",
      "content": "[用户输入的原始文本]"
    }
  ],
  "stream": false,
  "max_tokens": 4096,
  "temperature": 0.3
}
```

> **注意**: 本项目的 Prompt 策略分为 A/B 两组，仅在 `system` 角色的 `content` 中替换不同的 Prompt 文本，请求体结构不变。

---

## 三、响应格式 (Response)

### 3.1 成功响应示例（非流式）

```json
{
  "id": "e1a2b3c4-d5e6-7f89-0a1b-2c3d4e5f6789",
  "object": "chat.completion",
  "created": 1720321234,
  "model": "deepseek-chat",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "---\ntitle: \"软件工程课程论文\"\nsubtitle: \"敏捷开发方法的应用与挑战\"\ntags: [\"敏捷开发\", \"Scrum\", \"XP\"]\n---\n\n## 引言 {layout=\"grid\" columns=\"2\"}\n\n### 研究背景 {card-style=\"normal\"}\n敏捷开发方法在当今软件工程中占据重要地位..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 1250,
    "completion_tokens": 850,
    "total_tokens": 2100
  }
}
```

### 3.2 响应体参数详解

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 请求唯一标识 ID |
| `object` | `string` | 固定为 `chat.completion` |
| `created` | `number` | 创建时间的 Unix 时间戳 |
| `model` | `string` | 使用的模型名称 |
| `choices` | `array` | 生成结果列表（通常只有一个元素） |
| `choices[].index` | `number` | 结果索引（从 0 开始） |
| `choices[].message.role` | `string` | 固定为 `assistant` |
| `choices[].message.content` | `string` | **核心输出**：生成的 CHD Markdown 文本 |
| `choices[].finish_reason` | `string` | 结束原因：`stop`(正常结束) / `length`(达到 max_tokens) |
| `usage.prompt_tokens` | `number` | 输入部分的 token 数 |
| `usage.completion_tokens` | `number` | 输出部分的 token 数 |
| `usage.total_tokens` | `number` | 总 token 数 |

### 3.3 错误响应示例

```json
{
  "error": {
    "message": "Incorrect API key provided: sk-xxx...",
    "type": "authentication_error",
    "param": null,
    "code": "invalid_api_key"
  }
}
```

### 3.4 常见错误码

| HTTP 状态码 | error.type | 说明 | 处理方式 |
|------------|------------|------|----------|
| 401 | `authentication_error` | API Key 无效或缺失 | 提示用户检查 `.env.local` 配置 |
| 400 | `invalid_request_error` | 请求参数格式错误 | 检查 messages 结构 |
| 429 | `rate_limit_error` | 请求频率超限 | 等待后重试（退避策略） |
| 500 | `api_error` | 服务器内部错误 | 重试最多 3 次 |
| 503 | `service_unavailable` | 服务暂时不可用 | 重试最多 3 次 |

---

## 四、TypeScript 调用实现

### 4.1 核心请求函数

```typescript
// src/services/ai/AIService.ts

const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: 'deepseek-chat' | 'deepseek-reasoner';
  messages: ChatMessage[];
  stream: boolean;
  max_tokens: number;
  temperature: number;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: 'stop' | 'length';
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function callDeepSeekAPI(
  apiKey: string,
  model: 'deepseek-chat' | 'deepseek-reasoner',
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(DEEPSEEK_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      max_tokens: 4096,
      temperature: 0.3,
    } as ChatCompletionRequest),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `DeepSeek API Error [${response.status}]: ${errorBody?.error?.message || response.statusText}`
    );
  }

  const data: ChatCompletionResponse = await response.json();

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek API: 返回内容为空');
  }

  return content;
}
```

### 4.2 使用示例

```typescript
// 调用 Flash 模型
const flashResult = await callDeepSeekAPI(
  process.env.DEEPSEEK_API_KEY!,
  'deepseek-chat',
  [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput },
  ]
);

// 调用 Pro 模型（仅需修改 model 参数）
const proResult = await callDeepSeekAPI(
  process.env.DEEPSEEK_API_KEY!,
  'deepseek-reasoner',
  [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput },
  ]
);
```

---

## 五、API Route 实现（Next.js）

### 5.1 服务端路由

```typescript
// src/app/api/ai/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, model } = await request.json();

    // 参数校验
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '缺少必要参数: text' },
        { status: 400 }
      );
    }

    // 校验模型参数
    const validModels = ['deepseek-chat', 'deepseek-reasoner'];
    const selectedModel = validModels.includes(model) ? model : 'deepseek-chat';

    // 读取环境变量（仅在服务端）
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY 未配置，请在 .env.local 中设置' },
        { status: 500 }
      );
    }

    // 调用 DeepSeek API
    const result = await callDeepSeekAPI(
      apiKey,
      selectedModel as 'deepseek-chat' | 'deepseek-reasoner',
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: text },
      ]
    );

    return NextResponse.json({ markdown: result });

  } catch (error: any) {
    console.error('AI Generate Error:', error);
    return NextResponse.json(
      { error: error.message || 'AI 生成失败' },
      { status: 500 }
    );
  }
}
```

### 5.2 客户端调用

```typescript
// 在 /ai-input/page.tsx 中的调用
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: userInput,
    model: selectedModel, // 'deepseek-chat' 或 'deepseek-reasoner'
  }),
});

const data = await response.json();
const chdMarkdown = data.markdown; // 生成的 CHD 格式 Markdown
```

---

## 六、模型对比

| 特性 | DeepSeek Flash (`deepseek-chat`) | DeepSeek Pro (`deepseek-reasoner`) |
|------|----------------------------------|------------------------------------|
| **定位** | 快速、轻量、低延迟 | 深度推理、复杂任务 |
| **适用场景** | 常规文档转换、快速预览 | 长文档、复杂结构、需要深度理解的场景 |
| **响应速度** | ⚡ 快 | 🧠 相对较慢 |
| **Token 上限** | 4096（可调整至 8192） | 4096（可调整至 8192） |
| **上下文窗口** | 128K tokens | 128K tokens |
| **本项目默认** | ✅ **是（默认使用）** | ❌ 用户可手动切换 |

---

## 七、注意事项

1. **API Key 安全**：`DEEPSEEK_API_KEY` 仅存储在 `.env.local`，通过 Next.js API Route 代理调用，前端不直接接触
2. **超时设置**：建议前端 `AbortSignal` 超时设为 120 秒（长文档生成可能需要较长时间）
3. **重试策略**：遇到 429/500/503 错误时，退避重试最多 3 次（间隔 1s → 2s → 4s）
4. **Token 监控**：可在响应中获取 `usage.total_tokens`，用于后续的成本追踪
5. **Temperature 固定**：本项目固定使用 `temperature: 0.3`，保持输出稳定性

---

> **维护说明**: 本文件为 DeepSeek V4 API 的技术参考文档，用于 MdToHtml Pro AI 服务层开发。
> 若 DeepSeek API 有版本更新，请同步更新此文档。
> 文档存放于 `plans/AI服务层扩展计划/` 目录。