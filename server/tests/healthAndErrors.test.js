import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { setupTestDb, teardownTestDb } from './testDb.js';

describe('Health Check & Error Handling Endpoints', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('GET /api/health returns ok status and database connected state', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.service).toBe('recipe-organizer-server');
    expect(res.body.data.database.connected).toBe(true);
  });

  it('GET /health root alias returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });

  it('GET /api/nonexistent-route returns 404 with structured error envelope', async () => {
    const res = await request(app).get('/api/nonexistent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toContain('Endpoint not found');
  });

  it('GET /api/recipes/invalid-id-format returns 400 for invalid ObjectId format', async () => {
    const res = await request(app).get('/api/recipes/invalid-hex-id');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Invalid ID format');
  });
});
