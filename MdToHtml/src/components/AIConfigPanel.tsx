'use client';

import React, { useState, useCallback } from 'react';
import { Settings, RefreshCw, Eye, EyeOff, ExternalLink, CheckCircle, XCircle, AlertCircle, Info, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiKeyManager } from '@/lib/env-hot-loader';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { AppError, ErrorType } from '@/types/file-system';

interface AIConfigPanelProps {
  onClose: () => void;
  onBack: () => void;
}

interface ConnectionResult {
  success: boolean;
  latency?: number;
  message: string;
  code?: string;
}

type ValidationType = 'error' | 'warning' | 'info' | null;

/** 首次确认标记（localStorage Key） */
const HAS_CONFIRMED_TEST_KEY = 'ai_test_connection_confirmed';

export const AIConfigPanel: React.FC<AIConfigPanelProps> = ({ onClose, onBack }) => {
  // --- API Key 状态 ---
  const [aiApiKey, setAiApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'configured' | 'unconfigured'>(
    ApiKeyManager.get() ? 'configured' : 'unconfigured'
  );

  // --- 验证相关 ---
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // --- 模型选择 ---
  const [aiDefaultModel, setAiDefaultModel] = useState<'deepseek-chat' | 'deepseek-reasoner'>('deepseek-chat');

  // --- 校验 ---
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationType, setValidationType] = useState<ValidationType>(null);

  // --- 错误弹窗 ---
  const [error, setError] = useState<AppError | null>(null);
  const [showError, setShowError] = useState(false);

  // --- 保存状态 ---
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<'success' | 'warning' | null>(null);

  /** 输入实时校验 */
  const handleKeyChange = useCallback((value: string) => {
    setAiApiKey(value);
    setConnectionResult(null);
    setSaveResult(null);

    if (!value) {
      setValidationMessage(null);
      setValidationType(null);
      return;
    }

    if (value.length < 10) {
      setValidationMessage('API Key 长度过短，请检查是否完整复制');
      setValidationType('warning');
    } else if (!value.startsWith('sk-')) {
      setValidationMessage('DeepSeek API Key 通常以 sk- 开头');
      setValidationType('warning');
    } else {
      setValidationMessage('格式正确，可点击「测试连接」验证有效性');
      setValidationType('info');
    }
  }, []);

  /** 首次弹窗说明 */
  const showFirstTimeConfirm = useCallback(async (): Promise<boolean> => {
    // 如果已确认过，直接返回 true
    if (localStorage.getItem(HAS_CONFIRMED_TEST_KEY)) return true;

    // 使用 confirm 弹窗（后续可替换为更美观的 Dialog）
    const message = [
      '🔍 即将验证 API Key 有效性，请确认以下事项：\n',
      '📊 费用说明：',
      '  • 将发送一条极小请求到 DeepSeek API',
      '  • 预计消耗 10-50 tokens（约 0.001 元）',
      '',
      '🔒 隐私说明：',
      '  • 密钥仅与 DeepSeek 官方服务器通信',
      '  • 验证请求不包含您的文档内容',
      '  • 密钥不会上传到任何第三方服务器',
      '',
      'ℹ️ 后续验证将不再弹窗提示。',
    ].join('\n');

    const confirmed = window.confirm(message);
    if (confirmed) {
      localStorage.setItem(HAS_CONFIRMED_TEST_KEY, 'true');
    }
    return confirmed;
  }, []);

  /** 测试连接 */
  const handleTestConnection = useCallback(async () => {
    const keyToTest = aiApiKey.trim() || ApiKeyManager.get();
    if (!keyToTest) {
      setValidationMessage('请先输入 API Key');
      setValidationType('error');
      return;
    }

    // 首次使用弹窗说明
    const confirmed = await showFirstTimeConfirm();
    if (!confirmed) return;

    setIsTesting(true);
    setConnectionResult(null);

    try {
      const res = await fetch('/api/ai/config/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest }),
      });

      const data = await res.json();
      setConnectionResult(data);

      if (!data.success) {
        // 显示更详细的错误弹窗
        setError({
          type: data.code === '401' ? ErrorType.AUTH
            : data.code === 'NETWORK_ERROR' ? ErrorType.NETWORK
            : ErrorType.API,
          message: data.message,
          details: data.detail ? { errorDetail: data.detail } : undefined,
        });
        setShowError(true);
      }
    } catch (err: any) {
      setConnectionResult({
        success: false,
        message: `网络请求失败: ${err.message || '未知错误'}`,
        code: 'NETWORK_ERROR',
      });
      setError({
        type: ErrorType.NETWORK,
        message: '无法连接到测试服务，请检查网络连接',
        details: { error: err.message },
      });
      setShowError(true);
    } finally {
      setIsTesting(false);
    }
  }, [aiApiKey, showFirstTimeConfirm]);

  /** 保存配置（惰性覆盖模式） */
  const handleSaveConfig = useCallback(async () => {
    const keyToSave = aiApiKey.trim();
    if (!keyToSave) {
      setValidationMessage('请输入 API Key');
      setValidationType('error');
      return;
    }

    if (!keyToSave.startsWith('sk-')) {
      setValidationMessage('API Key 格式不正确，应以 sk- 开头');
      setValidationType('error');
      return;
    }

    setIsSaving(true);
    setSaveResult(null);

    const result = await ApiKeyManager.set(keyToSave);

    if (result.success) {
      setAiApiKey('');
      setCurrentStatus('configured');
      setSaveResult('success');
      setValidationMessage('✅ 配置已保存并即时生效，无需重启服务');
      setValidationType('info');
    } else {
      setSaveResult('warning');
      setValidationMessage(`⚠️ ${result.error || '保存异常'}`);
      setValidationType('warning');
    }

    setIsSaving(false);
  }, [aiApiKey]);

  /** 当前 Key 的脱敏显示 */
  const getMaskedKey = () => {
    const key = ApiKeyManager.get();
    if (!key) return null;
    if (key.length <= 10) return key.slice(0, 3) + '***';
    return key.slice(0, 6) + '***' + key.slice(-4);
  };

  // --- 连接状态指示器 ---
  const statusIndicator = connectionResult ? (
    connectionResult.success ? (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
        <div className="text-xs text-green-800">
          <span className="font-medium">已连接</span>
          <span className="text-green-600 ml-2">延迟: {connectionResult.latency}ms</span>
        </div>
      </div>
    ) : (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
        <span className="text-xs text-red-700">{connectionResult.message}</span>
      </div>
    )
  ) : null;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1 hover:bg-bg-page rounded-md transition-colors text-text-muted hover:text-text-primary"
          title="返回设置"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Settings className="w-5 h-5 text-text-primary" />
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">AI 服务配置</h3>
      </div>

      {/* ① API 密钥区域 */}
      <div className="bg-bg-page rounded-lg p-4 border border-border-soft">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-text-secondary flex items-center gap-2">
            API 密钥
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              currentStatus === 'configured'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {currentStatus === 'configured' ? '已配置' : '未配置'}
            </span>
          </label>
          {currentStatus === 'configured' && (
            <span className="text-[10px] text-text-muted font-mono">{getMaskedKey()}</span>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={aiApiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder={ApiKeyManager.get() ? '输入新 Key 以覆盖当前配置' : '粘贴你的 DeepSeek API Key'}
              className="w-full px-3 py-2 text-xs border border-border-soft rounded-md bg-bg-card text-text-primary placeholder:text-text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              {aiApiKey && (
                <button
                  onClick={() => { setAiApiKey(''); setValidationMessage(null); setValidationType(null); }}
                  className="p-1 text-text-muted hover:text-text-primary transition-colors"
                  title="清空"
                >
                  ✕
                </button>
              )}
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-1 text-text-muted hover:text-text-primary transition-colors"
                title={showKey ? '隐藏' : '显示'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 实时校验消息 */}
        {validationMessage && (
          <div className={`mt-2 flex items-start gap-1.5 text-[11px] ${
            validationType === 'error' ? 'text-red-600' :
            validationType === 'warning' ? 'text-amber-600' :
            'text-indigo-500'
          }`}>
            {validationType === 'error' ? <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> :
             validationType === 'warning' ? <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> :
             <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
            <span>{validationMessage}</span>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestConnection}
            disabled={isTesting || (!aiApiKey.trim() && !ApiKeyManager.get())}
            className="h-8 text-xs px-3"
          >
            {isTesting ? (
              <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> 验证中...</>
            ) : (
              <><RefreshCw className="w-3 h-3 mr-1" /> 测试连接</>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveConfig}
            disabled={isSaving || !aiApiKey.trim()}
            className="h-8 text-xs px-3"
          >
            {isSaving ? '保存中...' : '💾 保存密钥'}
          </Button>
        </div>

        {/* 连接状态 / 保存结果 */}
        {statusIndicator}
        {saveResult === 'success' && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-xs text-green-700">密钥已保存，即时生效。重启后自动加载。</span>
          </div>
        )}
        {saveResult === 'warning' && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-700">内存已保存，但文件写入异常（详见控制台日志）</span>
          </div>
        )}

        <p className="text-[10px] text-text-muted mt-2">
          ⚠️ 密钥仅存储在本地 .env.local 文件中，不会上传到第三方服务器（DeepSeek 官方 API 除外）
        </p>
      </div>

      {/* ② 模型选择 */}
      <div className="bg-bg-page rounded-lg p-4 border border-border-soft">
        <label className="text-xs font-semibold text-text-secondary block mb-3">
          默认模型
        </label>
        <div className="flex gap-2">
          <Button
            variant={aiDefaultModel === 'deepseek-chat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAiDefaultModel('deepseek-chat')}
            className="h-8 text-xs"
          >
            DeepSeek Flash ⚡
          </Button>
          <Button
            variant={aiDefaultModel === 'deepseek-reasoner' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAiDefaultModel('deepseek-reasoner')}
            className="h-8 text-xs"
          >
            DeepSeek Pro 🧠
          </Button>
        </div>
        <p className="text-[10px] text-text-muted mt-2">
          💡 Flash 已足够应对大多数 CHD 转换场景，Pro 适合需要深度推理的复杂文档
        </p>
      </div>

      {/* ③ 安全与说明 */}
      <div className="bg-bg-page rounded-lg p-4 border border-border-soft">
        <h4 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> 安全与说明
        </h4>

        <div className="space-y-2 text-[11px]">
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✅</span>
            <span className="text-text-secondary">端到端加密：Key 仅在本地与 DeepSeek 官方 API 之间传输</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✅</span>
            <span className="text-text-secondary">不存储云端：Key 仅保存在您电脑的 .env.local 文件中</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✅</span>
            <span className="text-text-secondary">浏览器不可读：Key 不在 localStorage 中，无法通过浏览器开发者工具窃取</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✅</span>
            <span className="text-text-secondary">Git 安全：.env.local 已加入 .gitignore，不会被提交到仓库</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">❌</span>
            <span className="text-text-secondary">不要分享：Key 泄露请立即在 <a href="https://platform.deepseek.com/" target="_blank" className="text-indigo-500 underline">DeepSeek 平台</a> 吊销</span>
          </div>
        </div>

        {/* 费用说明 */}
        <div className="mt-3 pt-3 border-t border-border-soft">
          <h5 className="text-[11px] font-medium text-text-primary mb-2">💰 费用说明</h5>
          <div className="space-y-1 text-[10px] text-text-muted">
            <p>• 验证连接：每次约 10-50 tokens（≈0.001 元）</p>
            <p>• 生成文档：每篇约 2000-8000 tokens（≈0.1-0.4 元）</p>
            <p>• 详见 <a href="https://platform.deepseek.com/api-docs/pricing" target="_blank" className="text-indigo-500 underline">DeepSeek 官方定价</a></p>
          </div>
        </div>

        {/* 获取引导 */}
        <div className="mt-3 pt-3 border-t border-border-soft">
          <h5 className="text-[11px] font-medium text-text-primary mb-2">🔑 如何获取 DeepSeek API Key</h5>
          <ol className="space-y-1 text-[10px] text-text-muted list-decimal list-inside">
            <li>访问 DeepSeek 开放平台</li>
            <li>注册/登录账号</li>
            <li>进入「API Keys」页面 → 创建新 Key</li>
            <li>复制以 sk- 开头的密钥粘贴到上方输入框</li>
          </ol>
          <a
            href="https://platform.deepseek.com/"
            target="_blank"
            className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
          >
            <ExternalLink className="w-3 h-3" />
            前往 DeepSeek 开放平台
          </a>
        </div>
      </div>

      {/* 错误弹窗 */}
      <ErrorDialog
        error={error}
        isOpen={showError}
        onClose={() => setShowError(false)}
        onRetry={handleTestConnection}
      />
    </div>
  );
};