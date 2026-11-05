import request from 'supertest';
import { vi } from 'vitest';
import app from '../src/app';
import { env } from '../src/config/env';
import { createTestUser, cleanupTestUser } from './helpers';

const createMock = vi.fn();

vi.mock('openai', () => {
  return {
    default: class {
      chat = { completions: { create: createMock } };
    },
  };
});

describe('AI', () => {
  let user: any;
  beforeAll(async () => {
    user = await createTestUser('pharmacist');
  });
  afterAll(async () => {
    await cleanupTestUser(user.id);
  });

  beforeEach(() => {
    createMock.mockReset();
  });

  it('returns 503 when no API key', async () => {
    const orig = env.OPENAI_API_KEY;
    env.OPENAI_API_KEY = undefined as any;
    const res = await request(app)
      .post('/api/ai/ask')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ question: 'What is low stock?' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_UNAVAILABLE');
    env.OPENAI_API_KEY = orig;
  });

  it('tool-calling loop returns answer', async () => {
    env.OPENAI_API_KEY = 'test-key';
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call1',
                type: 'function',
                function: { name: 'get_low_stock_items', arguments: '{}' },
              },
            ],
          },
        },
      ],
    });
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Low stock items: none found as of current records.',
          },
        },
      ],
    });

    const res = await request(app)
      .post('/api/ai/ask')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ question: 'What is low stock?' });
    expect(res.status).toBe(200);
    expect(res.body.data.answer).toContain('Low stock');
    expect(res.body.data.tool_calls.length).toBeGreaterThan(0);
  });

  it('clinical question is refused (mocked model)', async () => {
    env.OPENAI_API_KEY = 'test-key';
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'I cannot provide medical advice. I can help with inventory questions.',
          },
        },
      ],
    });
    const res = await request(app)
      .post('/api/ai/ask')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ question: 'What dosage of paracetamol should I give a child?' });
    expect(res.status).toBe(200);
    expect(res.body.data.answer.toLowerCase()).not.toContain('mg per kg');
    expect(res.body.data.answer.toLowerCase()).toContain('cannot');
  });
});
