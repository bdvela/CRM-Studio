import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/utils.ts', 'src/types/**', 'src/components/ui/badge.tsx', 'src/components/ui/button.tsx', 'src/components/ui/modal.tsx', 'src/components/ui/empty-state.tsx', 'src/components/ui/error-banner.tsx'],
      exclude: ['src/__tests__/**'],
    },
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@testing-library/jest-dom': '@testing-library/jest-dom',
    },
  },
});
