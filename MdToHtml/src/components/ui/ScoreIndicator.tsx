import React from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ScoreIndicatorProps {
  scoreResult: any;
  showScoreDetails: boolean;
  setShowScoreDetails: (show: boolean) => void;
}

const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({
  scoreResult,
  showScoreDetails,
  setShowScoreDetails
}) => {
  if (!scoreResult) return null;

  return (
    <div className="relative flex items-center">
      <button 
        onClick={() => setShowScoreDetails(!showScoreDetails)}
        className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-secondary/10 border border-border-soft hover:bg-secondary/20 transition-colors"
      >
        {scoreResult.totalScore >= 90 ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        )}
        <span className={clsx("text-sm font-semibold", 
          scoreResult.totalScore >= 90 ? 'text-green-600' : 'text-yellow-600'
        )}>
          {scoreResult.totalScore}分
        </span>
      </button>

      {showScoreDetails && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-bg-card border border-border-soft rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-sm text-text-primary">评分详情</h4>
            <button onClick={() => setShowScoreDetails(false)} className="text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          </div>
          
          {/* Dimensions Breakdown */}
          <div className="grid grid-cols-2 gap-2 mb-4 p-2 bg-bg-page rounded-lg">
            <div className="text-xs text-text-secondary flex justify-between">结构规范: <span className="font-mono font-bold text-text-primary">{scoreResult.dimensions.structure}</span></div>
            <div className="text-xs text-text-secondary flex justify-between">内容原子: <span className="font-mono font-bold text-text-primary">{scoreResult.dimensions.atomicity}</span></div>
            <div className="text-xs text-text-secondary flex justify-between">元数据: <span className="font-mono font-bold text-text-primary">{scoreResult.dimensions.metadata}</span></div>
            <div className="text-xs text-text-secondary flex justify-between">语法正确: <span className="font-mono font-bold text-text-primary">{scoreResult.dimensions.syntax}</span></div>
            <div className="text-xs text-text-secondary flex justify-between">样式布局: <span className="font-mono font-bold text-text-primary">{scoreResult.dimensions.styling}</span></div>
            
            <div className="col-span-2 h-px bg-border-soft my-1" />
            
            <div className="text-xs text-text-secondary flex justify-between">静态基准: <span className="font-mono font-bold text-text-primary">{scoreResult.baseScore || 0}</span></div>
            <div className="text-xs text-text-secondary flex justify-between">过程加分: <span className="font-mono font-bold text-green-600">+{scoreResult.processBonus || 0}</span></div>
            <div className="col-span-2 text-[10px] text-text-muted text-right mt-1">
              基于 {scoreResult.historyCount || 0} 次有效编辑
            </div>
          </div>

          {/* Issues List */}
          {scoreResult.totalScore < 80 && (
            <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-blue-700">
              <div className="flex items-center gap-2 mb-1 font-bold">
                <span>AI 优化建议</span>
              </div>
              <p className="leading-relaxed opacity-90">
                当前文档评分较低 ({scoreResult.totalScore}分)。建议使用 AI 重新生成文档内容，通常可以获得 85+ 的基准分，再进行人工微调效率更高。
              </p>
            </div>
          )}

          {scoreResult.issues.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {scoreResult.issues.map((issue: any, idx: number) => (
                <div key={idx} className="bg-bg-page rounded p-3 text-xs border border-border-soft">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={clsx(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      issue.severity === 'error' ? "bg-red-500" : 
                      issue.severity === 'warning' ? "bg-amber-500" : "bg-blue-500"
                    )} />
                    <span className="font-bold text-text-primary">Line {issue.line}</span>
                    <span className={clsx(
                      "ml-auto text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
                      issue.severity === 'error' ? "bg-red-100 text-red-600" : 
                      issue.severity === 'warning' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                    )}>{issue.severity}</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed break-words whitespace-pre-wrap">{issue.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-text-muted text-xs">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500/50" />
              完美！没有发现扣分项。
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ScoreIndicator);
