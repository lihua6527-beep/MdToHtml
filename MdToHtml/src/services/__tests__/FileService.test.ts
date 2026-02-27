import { FileService } from '../FileService';
import { ApiClient } from '../core/ApiClient';
import PermissionManager from '../core/PermissionManager';
import { TransactionManager } from '../core/TransactionManager';
import { mutate } from 'swr';

// Mock dependencies
jest.mock('../core/ApiClient');
jest.mock('../core/PermissionManager');
jest.mock('../core/TransactionManager');
jest.mock('swr');

const mockApiClient = ApiClient as jest.Mocked<typeof ApiClient>;
const mockPermissionManager = PermissionManager as jest.Mocked<typeof PermissionManager>;
const mockTransactionManager = TransactionManager as jest.Mocked<typeof TransactionManager>;
const mockMutate = mutate as jest.MockedFunction<typeof mutate>;

// Mock PermissionManager methods
mockPermissionManager.requirePermission = jest.fn();
mockPermissionManager.requireAllPermissions = jest.fn();

describe('FileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllFiles', () => {
    it('should return an array of files on success', async () => {
      const mockFiles = [{ slug: 'test1', mtime: 1234567890 }, { slug: 'test2', mtime: 1234567891 }];
      mockApiClient.get.mockResolvedValue(mockFiles);

      const result = await FileService.getAllFiles();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/files');
      expect(result).toEqual(mockFiles);
    });

    it('should return empty array on error', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await FileService.getAllFiles();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/files');
      expect(result).toEqual([]);
    });

    it('should handle wrapped response', async () => {
      const mockFiles = [{ slug: 'test1', mtime: 1234567890 }];
      mockApiClient.get.mockResolvedValue({ data: mockFiles });

      const result = await FileService.getAllFiles();

      expect(result).toEqual(mockFiles);
    });
  });

  describe('getFileBySlug', () => {
    it('should return file content on success', async () => {
      const mockContent = 'Test content';
      mockApiClient.get.mockResolvedValue({ content: mockContent, slug: 'test' });

      const result = await FileService.getFileBySlug('test');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/files/test');
      expect(result).toBe(mockContent);
    });

    it('should return null on error', async () => {
      mockApiClient.get.mockRejectedValue(new Error('File not found'));

      const result = await FileService.getFileBySlug('test');

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/files/test');
      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('should return true on success', async () => {
      mockPermissionManager.requirePermission.mockReturnValue();
      mockApiClient.post.mockResolvedValue({ count: 1 });

      const result = await FileService.deleteFile('test', false);

      expect(mockPermissionManager.requirePermission).toHaveBeenCalledWith('DELETE');
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/delete', { slug: 'test', deleteOutput: false });
      expect(mockMutate).toHaveBeenCalledTimes(4);
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockPermissionManager.requirePermission.mockReturnValue();
      mockApiClient.post.mockRejectedValue(new Error('Delete failed'));

      const result = await FileService.deleteFile('test', false);

      expect(result).toBe(false);
    });
  });

  describe('deleteMultipleFiles', () => {
    it('should return true on success', async () => {
      mockPermissionManager.requirePermission.mockReturnValue();
      mockApiClient.post.mockResolvedValue({ count: 2 });

      const result = await FileService.deleteMultipleFiles(['test1', 'test2'], true);

      expect(mockPermissionManager.requirePermission).toHaveBeenCalledWith('DELETE');
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/delete', { slugs: ['test1', 'test2'], deleteOutput: true });
      expect(mockMutate).toHaveBeenCalledTimes(4);
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockPermissionManager.requirePermission.mockReturnValue();
      mockApiClient.post.mockRejectedValue(new Error('Delete failed'));

      const result = await FileService.deleteMultipleFiles(['test1', 'test2'], true);

      expect(result).toBe(false);
    });
  });

  describe('saveFile', () => {
    it('should return true on success', async () => {
      mockPermissionManager.requirePermission.mockReturnValue();
      mockApiClient.post.mockResolvedValue({ success: true, slug: 'test' });

      const result = await FileService.saveFile('test', 'content', [{ type: 'edit' }]);

      expect(mockPermissionManager.requirePermission).toHaveBeenCalledWith('WRITE');
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/save', { slug: 'test', content: 'content', operations: [{ type: 'edit' }] });
      expect(mockMutate).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockPermissionManager.requirePermission.mockReturnValue();
      mockApiClient.post.mockRejectedValue(new Error('Save failed'));

      const result = await FileService.saveFile('test', 'content');

      expect(result).toBe(false);
    });
  });

  describe('logTrainingData', () => {
    it('should return true on success', async () => {
      mockPermissionManager.requirePermission.mockReturnValue();
      mockApiClient.post.mockResolvedValue({});

      const result = await FileService.logTrainingData({ data: 'test' });

      expect(mockPermissionManager.requirePermission).toHaveBeenCalledWith('ADMIN');
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/dataset', { data: 'test' });
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockPermissionManager.requirePermission.mockReturnValue();
      mockApiClient.post.mockRejectedValue(new Error('Log failed'));

      const result = await FileService.logTrainingData({ data: 'test' });

      expect(result).toBe(false);
    });
  });

  describe('saveExport', () => {
    it('should return true on success', async () => {
      mockPermissionManager.requirePermission.mockReturnValue();
      mockApiClient.post.mockResolvedValue({});

      const result = await FileService.saveExport({ filename: 'test.html', content: '<html></html>' });

      expect(mockPermissionManager.requirePermission).toHaveBeenCalledWith('WRITE');
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/save-export', { filename: 'test.html', content: '<html></html>' });
      expect(mockMutate).toHaveBeenCalledWith('/api/config/capacity');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockPermissionManager.requirePermission.mockReturnValue();
      mockApiClient.post.mockRejectedValue(new Error('Export failed'));

      const result = await FileService.saveExport({ filename: 'test.html', content: '<html></html>' });

      expect(result).toBe(false);
    });
  });

  describe('moveFile', () => {
    it('should return true on success', async () => {
      mockPermissionManager.requireAllPermissions.mockReturnValue();
      mockTransactionManager.createTransaction.mockReturnValue({ addOperation: jest.fn() } as any);
      mockTransactionManager.executeWithRetry.mockResolvedValue(true);
      mockApiClient.get.mockResolvedValue({ content: 'content' });
      mockApiClient.post.mockResolvedValue({ success: true, slug: 'new-test' });

      const result = await FileService.moveFile('old-test', 'new-test');

      expect(mockPermissionManager.requireAllPermissions).toHaveBeenCalledWith(['WRITE', 'DELETE']);
      expect(mockTransactionManager.createTransaction).toHaveBeenCalled();
      expect(mockTransactionManager.executeWithRetry).toHaveBeenCalled();
      expect(mockMutate).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockPermissionManager.requireAllPermissions.mockReturnValue();
      mockTransactionManager.createTransaction.mockReturnValue({ addOperation: jest.fn() } as any);
      mockTransactionManager.executeWithRetry.mockRejectedValue(new Error('Move failed'));

      const result = await FileService.moveFile('old-test', 'new-test');

      expect(result).toBe(false);
    });
  });
});
