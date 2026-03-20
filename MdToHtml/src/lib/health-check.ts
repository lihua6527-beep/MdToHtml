/**
 * 系统健康检查工具
 * 监控系统的各个组件状态，提供健康状态报告
 */

import fs from 'fs';
import path from 'path';
import ConfigManager from './config-manager';
import PathManager from './path-manager';
import { logger } from './logger';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    filesystem: HealthComponent;
    cache: HealthComponent;
    config: HealthComponent;
    resources: HealthComponent;
  };
  timestamp: Date;
  message: string;
}

export interface HealthComponent {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details?: any;
}

class HealthCheckService {
  private static instance: HealthCheckService;

  private constructor() {}

  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * 执行全面的健康检查
   */
  public async checkHealth(): Promise<HealthCheckResult> {
    try {
      const components = {
        filesystem: await this.checkFilesystem(),
        cache: await this.checkCache(),
        config: await this.checkConfig(),
        resources: await this.checkResources()
      };

      const overallStatus = this.calculateOverallStatus(components);
      const message = this.generateStatusMessage(overallStatus, components);

      const result: HealthCheckResult = {
        status: overallStatus,
        components,
        timestamp: new Date(),
        message
      };

      logger.info('Health check completed', {
        module: 'HealthCheck',
        context: { status: overallStatus, components: Object.keys(components) }
      });

      return result;
    } catch (error) {
      logger.error('Health check failed', {
        module: 'HealthCheck',
        context: { error }
      });

      return {
        status: 'unhealthy',
        components: {
          filesystem: { status: 'unhealthy', message: '检查失败' },
          cache: { status: 'unhealthy', message: '检查失败' },
          config: { status: 'unhealthy', message: '检查失败' },
          resources: { status: 'unhealthy', message: '检查失败' }
        },
        timestamp: new Date(),
        message: `健康检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 检查文件系统状态
   */
  private async checkFilesystem(): Promise<HealthComponent> {
    try {
      const config = ConfigManager.getInstance().getConfig();
      const pathsToCheck = [
        PathManager.getInputPath(),
        PathManager.getOutputPath(),
        PathManager.getDataPath(),
        PathManager.getRecyclePath()
      ];

      const pathStatuses = [];
      let allHealthy = true;

      for (const path of pathsToCheck) {
        try {
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
            pathStatuses.push({ path, status: 'created' });
          } else {
            const stats = fs.statSync(path);
            if (stats.isDirectory()) {
              pathStatuses.push({ path, status: 'healthy' });
            } else {
              pathStatuses.push({ path, status: 'unhealthy', reason: '不是目录' });
              allHealthy = false;
            }
          }
        } catch (error) {
          pathStatuses.push({ path, status: 'unhealthy', reason: error instanceof Error ? error.message : '未知错误' });
          allHealthy = false;
        }
      }

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        message: allHealthy ? '文件系统状态正常' : '部分路径存在问题',
        details: { paths: pathStatuses }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `文件系统检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 检查缓存状态
   */
  private async checkCache(): Promise<HealthComponent> {
    try {
      const cachePath = path.join(PathManager.getDataPath(), '.metadata_cache.json');
      
      if (fs.existsSync(cachePath)) {
        try {
          const content = fs.readFileSync(cachePath, 'utf-8');
          const cache = JSON.parse(content);
          
          if (cache.version && Array.isArray(cache.entries)) {
            return {
              status: 'healthy',
              message: '缓存状态正常',
              details: {
                entryCount: cache.entries.length,
                version: cache.version
              }
            };
          } else {
            return {
              status: 'degraded',
              message: '缓存结构异常',
              details: { cachePath }
            };
          }
        } catch (error) {
          return {
            status: 'degraded',
            message: '缓存文件损坏',
            details: { cachePath, error: error instanceof Error ? error.message : '未知错误' }
          };
        }
      } else {
        return {
          status: 'healthy',
          message: '缓存文件不存在，将自动创建',
          details: { cachePath }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `缓存检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 检查配置状态
   */
  private async checkConfig(): Promise<HealthComponent> {
    try {
      const config = ConfigManager.getInstance().getConfig();
      
      return {
        status: 'healthy',
        message: '配置状态正常',
        details: {
          hasPaths: !!config.paths,
          hasExportOptions: !!config.exportOptions,
          hasRenderOptions: !!config.renderOptions
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `配置检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 检查系统资源状态
   */
  private async checkResources(): Promise<HealthComponent> {
    try {
      // 检查内存使用情况（仅在Node.js环境）
      let memoryUsage = null;
      if (typeof process !== 'undefined' && process.memoryUsage) {
        memoryUsage = process.memoryUsage();
      }

      // 检查磁盘空间
      let diskSpace = null;
      try {
        const stats = fs.statSync(PathManager.getAppRoot());
        diskSpace = {
          size: stats.size,
          directory: PathManager.getAppRoot()
        };
      } catch (error) {
        // 磁盘空间检查失败，不影响整体健康状态
      }

      return {
        status: 'healthy',
        message: '系统资源状态正常',
        details: {
          memoryUsage,
          diskSpace
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `资源检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 计算整体健康状态
   */
  private calculateOverallStatus(components: Record<string, HealthComponent>): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(components).map((c: HealthComponent) => c.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * 生成状态消息
   */
  private generateStatusMessage(status: string, components: Record<string, HealthComponent>): string {
    switch (status) {
      case 'healthy':
        return '系统状态健康，所有组件运行正常';
      case 'degraded':
        const degradedComponents = Object.entries(components)
          .filter(([_, c]) => c.status === 'degraded')
          .map(([name]) => name);
        return `系统状态降级，以下组件存在问题: ${degradedComponents.join(', ')}`;
      case 'unhealthy':
        const unhealthyComponents = Object.entries(components)
          .filter(([_, c]) => c.status === 'unhealthy')
          .map(([name]) => name);
        return `系统状态异常，以下组件存在严重问题: ${unhealthyComponents.join(', ')}`;
      default:
        return '系统状态未知';
    }
  }
}

// 导出单例实例
export const healthCheckService = HealthCheckService.getInstance();

// 导出类型和方法
export default healthCheckService;