'use client';

import React, { useEffect, useState } from 'react';
import { Database, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface CapacityStats {
  limit: number;
  count: number;
  usage: number; // Percentage
}

interface CapacityProgressBarProps {
  current?: number;
  limit?: number;
  variant?: 'default' | 'compact';
  label?: string;
}

export const CapacityProgressBar: React.FC<CapacityProgressBarProps> = ({ current, limit: propLimit, variant = 'default', label = '存储容量' }) => {
  const [stats, setStats] = useState<CapacityStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (current !== undefined && propLimit !== undefined) {
        setStats({
            count: current,
            limit: propLimit,
            usage: Math.round((current / propLimit) * 100)
        });
        setLoading(false);
        return;
    }

    try {
      const res = await fetch('/api/config/capacity');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch capacity stats', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    if (current === undefined) {
        // Poll every 30 seconds to keep updated only if not controlled
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }
  }, [current, propLimit]);

  if (loading || !stats) return null;

  const { limit, count, usage } = stats;
  
  // Determine color based on usage
  let colorClass = 'bg-green-500';
  let textColorClass = 'text-green-600';
  
  if (usage >= 90) {
    colorClass = 'bg-red-500';
    textColorClass = 'text-red-600';
  } else if (usage >= 70) {
    colorClass = 'bg-yellow-500';
    textColorClass = 'text-yellow-600';
  }

  return (
    <div className="w-full px-4 py-2 bg-bg-card border-b border-border-soft">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
          <Database className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>
        <div className={clsx("text-xs font-bold", textColorClass)}>
          {count} / {limit} ({usage}%)
        </div>
      </div>
      
      <div className="w-full h-1.5 bg-secondary/20 rounded-full overflow-hidden">
        <div 
          className={clsx("h-full transition-all duration-500 rounded-full", colorClass)}
          style={{ width: `${Math.min(usage, 100)}%` }}
        />
      </div>
      
      {usage >= 90 && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-red-500 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          <span>容量即将耗尽，将自动清理旧文件</span>
        </div>
      )}
    </div>
  );
};
