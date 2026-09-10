/**
 * useHistory — 撤销/重做引擎（操作级）
 *
 * ===== 改造说明 (Phase 1) =====
 * 将核心数据结构从 string[] 快照改造为 Operation[] 操作序列，
 * 实现"操作级回退"替代"整篇快照回退"。
 *
 * ===== 向后兼容 =====
 * - pushState(content) — 保留！内部转为 pushOperation (基于 diff)
 * - undo() / redo() — 返回完整内容字符串，调用方无需修改
 * - canUndo / canRedo — 不变
 *
 * ===== 新增能力 =====
 * - pushOperation(op) — 直接推入 Operation
 * - getOperationLog() — 获取完整操作日志
 * - setCheckpoint(label) — 手动暂存点（用户主动保存里程碑）
 * - getCheckpoints() — 获取暂存点列表
 * - goToCheckpoint(id) — 跳转到暂存点
 * - clearHistory() — 清空历史
 * - getCurrentUndoStack() / getCurrentRedoStack() — 调试用
 *
 * ===== 暂存点设计 =====
 * - 初始文档状态自动作为第一个暂存点（"打开时的文档"）
 * - 用户可手动添加暂存点（"保存里程碑"）
 * - 暂存点存储在 undoStack 中，以 CHECKPOINT 操作标记
 * - 撤销/重做时跳过 CHECKPOINT，用户无感知
 * - goToCheckpoint 定位到 CHECKPOINT 位置，截断后续所有操作
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  type Operation,
  type AnyOperation,
  OperationType,
  invertOperation,
} from '@/types/operation';
import { OperationBuilder } from '@/lib/OperationBuilder';

// ──────────────────────────────────────────
// 类型定义
// ──────────────────────────────────────────

interface HistoryState {
  /** 撤销栈：按时间顺序排列的操作 */
  undoStack: Operation[];
  /** 重做栈：被撤销的操作 */
  redoStack: Operation[];
  /** 当前内容快照（用于 pushState 的 diff 计算） */
  present: string;
}

interface UseHistoryOptions {
  sessionId?: string;
  maxHistory?: number;
}

interface CheckpointInfo {
  id: string;
  label: string;
  timestamp: number;
}

interface UseHistoryReturn {
  /** 当前文档内容 */
  state: string;
  /** 快照式压入（向后兼容，内部转为 Operation） */
  pushState: (nextState: string) => void;
  /** 操作式压入 */
  pushOperation: (op: Operation) => void;
  /** 撤销（跳过 CHECKPOINT，用户无感知） */
  undo: () => string | null;
  /** 重做（跳过 CHECKPOINT） */
  redo: () => string | null;
  /** 是否可撤销 */
  canUndo: boolean;
  /** 是否可重做 */
  canRedo: boolean;
  /** 获取完整操作日志 */
  getOperationLog: () => Operation[];
  /** 清空历史 */
  clearHistory: () => void;
  /** 获取撤销栈（调试用） */
  getCurrentUndoStack: () => Operation[];
  /** 获取重做栈（调试用） */
  getCurrentRedoStack: () => Operation[];

  // ── 暂存点相关 ──
  /** 手动添加暂存点（用户主动保存里程碑） */
  setCheckpoint: (label: string) => void;
  /** 获取所有暂存点列表 */
  getCheckpoints: () => CheckpointInfo[];
  /** 跳转到指定暂存点（撤销该暂存点之后的所有操作） */
  goToCheckpoint: (checkpointId: string) => string | null;
}

// ──────────────────────────────────────────
// 防抖合并器
// ──────────────────────────────────────────

class DebounceMerger {
  private batch: Operation[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 300;

  push(op: Operation, onFlush: (op: Operation) => void): void {
    this.batch.push(op);
    this.resetTimer(onFlush);
  }

  private resetTimer(onFlush: (op: Operation) => void): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(onFlush), this.DEBOUNCE_MS);
  }

  private flush(onFlush: (op: Operation) => void): void {
    if (this.batch.length === 0) return;

    if (this.batch.length === 1) {
      onFlush(this.batch[0]);
    } else {
      const batchOp = OperationBuilder.batch({
        children: [...this.batch],
        description: `合并操作（${this.batch.length} 步）`,
        producer: 'codemirror',
      });
      onFlush(batchOp);
    }

    this.batch = [];
  }

  /** 强制刷新（在撤销/重做前调用） */
  forceFlush(onFlush: (op: Operation) => void): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.flush(onFlush);
  }

  cleanup(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.batch = [];
  }
}

// ──────────────────────────────────────────
// 操作 → 内容变更的"执行"函数
// ──────────────────────────────────────────

/**
 * 将 Operation 应用到当前内容字符串上
 * 返回变更后的内容
 */
function applyOperationToString(content: string, op: Operation): string {
  switch (op.type) {
    case OperationType.TEXT_INSERT: {
      const textOp = op as import('@/types/operation').TextOperation;
      const pos = Math.min(textOp.position, content.length);
      return content.slice(0, pos) + textOp.text + content.slice(pos);
    }

    case OperationType.TEXT_DELETE: {
      const textOp = op as import('@/types/operation').TextOperation;
      const start = Math.min(textOp.position, content.length);
      const end = Math.min(start + textOp.text.length, content.length);
      return content.slice(0, start) + content.slice(end);
    }

    case OperationType.TEXT_REPLACE: {
      const textOp = op as import('@/types/operation').TextOperation;
      const start = Math.min(textOp.inverse.position, content.length);
      const oldLen = textOp.inverse.text.length;
      const end = Math.min(start + oldLen, content.length);
      return content.slice(0, start) + textOp.text + content.slice(end);
    }

    // 非文本操作：不修改内容字符串
    case OperationType.CARD_CREATE:
    case OperationType.CARD_DELETE:
    case OperationType.CARD_MOVE:
    case OperationType.CARD_UPDATE:
    case OperationType.AI_GENERATE:
    case OperationType.AI_REPLACE:
    case OperationType.AI_REWRITE:
      return content;

    // 元操作：递归执行子操作（BATCH）
    case OperationType.BATCH: {
      const metaOp = op as import('@/types/operation').MetaOperation;
      if (metaOp.children) {
        return metaOp.children.reduce(
          (acc, child) => applyOperationToString(acc, child),
          content
        );
      }
      return content;
    }

    // 暂存点/标记：不修改内容
    case OperationType.CHECKPOINT:
    case OperationType.MARKER:
      return content;

    default:
      return content;
  }
}

// ──────────────────────────────────────────
// 通用 diff 函数（用于 pushState 适配）
// ──────────────────────────────────────────

/**
 * 基于内容差异生成 Operation
 * 简化版本：仅处理尾部追加/删除/全篇替换三种场景
 */
function diffToOperation(oldContent: string, newContent: string): Operation | null {
  if (oldContent === newContent) return null;

  // 尾部追加
  if (newContent.startsWith(oldContent)) {
    return OperationBuilder.textInsert({
      position: oldContent.length,
      text: newContent.slice(oldContent.length),
      producer: 'codemirror',
      description: '编辑内容',
    });
  }

  // 尾部删除
  if (oldContent.startsWith(newContent)) {
    return OperationBuilder.textDelete({
      position: newContent.length,
      text: oldContent.slice(newContent.length),
      producer: 'codemirror',
      description: '删除内容',
    });
  }

  // 全篇替换（fallback）
  return OperationBuilder.textReplace({
    position: 0,
    oldText: oldContent,
    newText: newContent,
    producer: 'codemirror',
    description: '修改内容',
  });
}

// ──────────────────────────────────────────
// 工具：从撤销栈中提取暂存点列表
// ──────────────────────────────────────────

function extractCheckpoints(stack: Operation[]): CheckpointInfo[] {
  return stack
    .filter(
      (op): op is import('@/types/operation').MetaOperation =>
        op.type === OperationType.CHECKPOINT
    )
    .map((op) => ({
      id: op.id,
      label: op.label ?? '未命名暂存点',
      timestamp: op.timestamp,
    }));
}

/** 找到指定暂存点在撤销栈中的索引 */
function findCheckpointIndex(stack: Operation[], checkpointId: string): number {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].id === checkpointId) return i;
  }
  return -1;
}

// ──────────────────────────────────────────
// useHistory Hook
// ──────────────────────────────────────────

export function useHistory(
  initialState: string,
  options: UseHistoryOptions = {}
): UseHistoryReturn {
  const { sessionId, maxHistory = 50 } = options;

  const initialContent = String(initialState ?? '');

  // ── 状态 ──
  const [state, setState] = useState<HistoryState>({
    undoStack: [],
    redoStack: [],
    present: initialContent,
  });

  // ── Refs ──
  const stateRef = useRef(state);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergerRef = useRef<DebounceMerger>(new DebounceMerger());
  const initialCheckpointSet = useRef(false);

  // 保持 ref 同步
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── 初始化时自动添加"打开时的文档"暂存点 ──
  useEffect(() => {
    if (initialCheckpointSet.current) return;
    initialCheckpointSet.current = true;

    setState((curr) => {
      // 只在撤销栈为空时添加初始暂存点
      if (curr.undoStack.length === 0) {
        const checkpoint = OperationBuilder.checkpoint({
          label: '打开时的文档',
          description: '初始状态',
        });
        return {
          ...curr,
          undoStack: [checkpoint],
        };
      }
      return curr;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 持久化（向后兼容）──
  const persistHistory = useCallback(
    (currentState: HistoryState) => {
      if (!sessionId) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const payload = {
          sessionId,
          history: {
            past: currentState.undoStack,
            future: currentState.redoStack,
          },
        };

        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((err) => console.error('Failed to save history:', err));
      }, 1000);
    },
    [sessionId]
  );

  // ── 核心：推入 Operation ──
  const pushOperation = useCallback(
    (op: Operation) => {
      setState((curr) => {
        const newPresent = applyOperationToString(curr.present, op);

        const newUndoStack = [...curr.undoStack, op];
        if (newUndoStack.length > maxHistory) {
          newUndoStack.shift();
        }

        const newState: HistoryState = {
          undoStack: newUndoStack,
          redoStack: [],
          present: newPresent,
        };

        persistHistory(newState);
        return newState;
      });
    },
    [maxHistory, persistHistory]
  );

  // ── 向后兼容：pushState ──
  const pushState = useCallback(
    (nextState: string) => {
      const nextContent = nextState ?? '';
      const currentPresent = stateRef.current.present;

      if (currentPresent === nextContent) return;

      mergerRef.current.forceFlush((op) => {
        pushOperation(op);
      });

      const diffOp = diffToOperation(currentPresent, nextContent);
      if (diffOp) {
        setState((curr) => {
          const newUndoStack = [...curr.undoStack, diffOp];
          if (newUndoStack.length > maxHistory) {
            newUndoStack.shift();
          }

          const newState: HistoryState = {
            undoStack: newUndoStack,
            redoStack: [],
            present: nextContent,
          };

          persistHistory(newState);
          return newState;
        });
      }
    },
    [maxHistory, persistHistory]
  );

  // ── 撤销（跳过 CHECKPOINT）──
  const undo = useCallback((): string | null => {
    mergerRef.current.forceFlush((op) => {
      pushOperation(op);
    });

    let result: string | null = null;

    setState((curr) => {
      if (curr.undoStack.length === 0) return curr;

      // 从后往前找：跳过 CHECKPOINT，找到第一个非 CHECKPOINT 操作
      let popIndex = curr.undoStack.length - 1;
      while (popIndex >= 0 && curr.undoStack[popIndex].type === OperationType.CHECKPOINT) {
        popIndex--;
      }

      // 全是 CHECKPOINT → 不可撤销
      if (popIndex < 0) return curr;

      // 弹出该操作
      const op = curr.undoStack[popIndex];
      const newUndoStack = [
        ...curr.undoStack.slice(0, popIndex),
        ...curr.undoStack.slice(popIndex + 1),
      ];

      const inverseOp = invertOperation(op as AnyOperation);
      const newPresent = applyOperationToString(curr.present, inverseOp);

      const newState: HistoryState = {
        undoStack: newUndoStack,
        redoStack: [...curr.redoStack, op],
        present: newPresent,
      };

      result = newPresent;
      persistHistory(newState);
      return newState;
    });

    return result;
  }, [persistHistory, pushOperation]);

  // ── 重做（跳过 CHECKPOINT）──
  const redo = useCallback((): string | null => {
    let result: string | null = null;

    setState((curr) => {
      if (curr.redoStack.length === 0) return curr;

      // 从后往前找：跳过 CHECKPOINT
      let popIndex = curr.redoStack.length - 1;
      while (popIndex >= 0 && curr.redoStack[popIndex].type === OperationType.CHECKPOINT) {
        popIndex--;
      }

      if (popIndex < 0) return curr;

      const op = curr.redoStack[popIndex];
      const newRedoStack = [
        ...curr.redoStack.slice(0, popIndex),
        ...curr.redoStack.slice(popIndex + 1),
      ];

      const newPresent = applyOperationToString(curr.present, op);

      const newState: HistoryState = {
        undoStack: [...curr.undoStack, op],
        redoStack: newRedoStack,
        present: newPresent,
      };

      result = newPresent;
      persistHistory(newState);
      return newState;
    });

    return result;
  }, [persistHistory]);

  // ── 获取操作日志 ──
  const getOperationLog = useCallback((): Operation[] => {
    return stateRef.current.undoStack;
  }, []);

  // ── 清空历史（保留当前内容）──
  const clearHistory = useCallback(() => {
    setState((curr) => ({
      undoStack: [],
      redoStack: [],
      present: curr.present,
    }));
  }, []);

  const getCurrentUndoStack = useCallback((): Operation[] => {
    return stateRef.current.undoStack;
  }, []);

  const getCurrentRedoStack = useCallback((): Operation[] => {
    return stateRef.current.redoStack;
  }, []);

  // ── 暂存点：手动添加 ──
  const setCheckpoint = useCallback(
    (label: string) => {
      const checkpoint = OperationBuilder.checkpoint({
        label,
        description: `暂存点：${label}`,
      });

      pushOperation(checkpoint);
    },
    [pushOperation]
  );

  // ── 暂存点：获取列表 ──
  const getCheckpoints = useCallback((): CheckpointInfo[] => {
    return extractCheckpoints(stateRef.current.undoStack);
  }, []);

  // ── 暂存点：跳转（撤销到指定暂存点之后的所有操作）──
  const goToCheckpoint = useCallback(
    (checkpointId: string): string | null => {
      let result: string | null = null;

      setState((curr) => {
        const cpIndex = findCheckpointIndex(curr.undoStack, checkpointId);

        if (cpIndex === -1) return curr;

        // 定位到 CHECKPOINT 位置
        // 保留 checkpoint 本身以及其之前的所有操作
        const preservedOps = curr.undoStack.slice(0, cpIndex + 1);
        const removedOps = curr.undoStack.slice(cpIndex + 1);

        // 计算跳转后的内容：依次执行保留的操作
        // （从初始内容开始逐步应用）
        // 但 checkpoints 不修改内容，所以可以直接用当前 present 往前逆推？？？
        // 更准确的做法：从最开始的 present 开始

        // 最好的方式是从 preservedOps 序列中找到内容的最终结果
        // 因为 CHECKPOINT 本身不改变内容，所以我们需要找到
        // 在 CHECKPOINT 之后的所有非 CHECKPOINT 操作，并逆操作回去

        // 简化实现：通过逆操作 removedOps 中的所有非 CHECKPOINT 操作
        let newPresent = curr.present;
        // 从后往前逆操作
        for (let i = removedOps.length - 1; i >= 0; i--) {
          const op = removedOps[i];
          if (op.type !== OperationType.CHECKPOINT) {
            const inverseOp = invertOperation(op as AnyOperation);
            newPresent = applyOperationToString(newPresent, inverseOp);
          }
        }

        const newState: HistoryState = {
          undoStack: preservedOps,
          redoStack: [...removedOps, ...curr.redoStack],
          present: newPresent,
        };

        result = newPresent;
        persistHistory(newState);
        return newState;
      });

      return result;
    },
    [persistHistory]
  );

  // ── 加载持久化历史 ──
  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/history?sessionId=${sessionId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.history && isMounted) {
          setState((curr) => ({
            ...curr,
            undoStack: Array.isArray(data.history.past)
              ? data.history.past
              : [],
            redoStack: Array.isArray(data.history.future)
              ? data.history.future
              : [],
          }));
        }
      } catch (e) {
        console.error('Failed to load history', e);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      mergerRef.current.cleanup();
    };
  }, [sessionId]);

  return {
    state: state.present,
    pushState,
    pushOperation,
    undo,
    redo,
    canUndo: state.undoStack.some((op) => op.type !== OperationType.CHECKPOINT),
    canRedo: state.redoStack.some((op) => op.type !== OperationType.CHECKPOINT),
    getOperationLog,
    clearHistory,
    getCurrentUndoStack,
    getCurrentRedoStack,

    // ── 暂存点 ──
    setCheckpoint,
    getCheckpoints,
    goToCheckpoint,
  };
}