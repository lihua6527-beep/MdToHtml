import '@testing-library/jest-dom';

// TextEncoder polyfill for Jest
if (typeof TextEncoder === 'undefined') {
  (global as any).TextEncoder = require('util').TextEncoder;
  (global as any).TextDecoder = require('util').TextDecoder;
}

// 扩展 global 类型声明
declare global {
  var mockToast: (() => void) | undefined;
}

// Mock ToastProvider for testing
global.mockToast = () => {
  // Mock useToast hook
  jest.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({
      toast: jest.fn(),
      dismiss: jest.fn(),
      update: jest.fn(),
    }),
  }));
};
