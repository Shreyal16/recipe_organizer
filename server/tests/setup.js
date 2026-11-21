import { beforeAll, afterAll } from 'vitest';

// Global test setup for backend tests
beforeAll(async () => {
  // Test environment initialization
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Global test teardown
});
