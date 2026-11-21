import { describe, it, expect } from 'vitest';
import app from '../src/app.js';

describe('Backend Foundation Test', () => {
  it('app module is initialized as an express application', () => {
    expect(app).toBeDefined();
    expect(typeof app.handle).toBe('function');
  });
});
