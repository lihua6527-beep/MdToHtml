import '@testing-library/jest-dom';

// TextEncoder polyfill for Jest
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
  global.TextDecoder = require('util').TextDecoder;
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
