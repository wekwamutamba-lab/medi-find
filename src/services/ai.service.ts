import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { env, isAiConfigured } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { SYSTEM_PROMPT } from '../ai/systemPrompt';
import { toolDefinitions, toolArgSchemas, ALLOWED_TOOLS } from '../ai/tools';
import { toolHandlers } from '../ai/toolHandlers';

// in-memory rate limiter per user
const rateBuckets = new Map<string, number[]>();
function checkRateLimit(userId: string) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const max = env.AI_RATE_LIMIT_PER_5MIN;
  const arr = rateBuckets.get(userId) || [];
  const recent = arr.filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    return false;
  }
  recent.push(now);
  rateBuckets.set(userId, recent);
  return true;
}

export interface AiAskResult {
  answer: string;
  tool_calls: { name: string; args_summary: string }[];
  records_referenced: string[];
  conversation_id: string;
}

export async function askAi(userId: string, pharmacyId: string, question: string, conversationId?: string): Promise<AiAskResult> {
  if (!isAiConfigured()) {
    throw new AppError(503, 'AI_UNAVAILABLE', 'AI features are not configured');
  }
  if (!checkRateLimit(userId)) {
    throw new AppError(429, 'AI_UNAVAILABLE', 'Rate limit exceeded');
  }

  const cid = conversationId || randomUUID();
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY! });

  const messages: any[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question },
  ];

  const toolCallsMeta: { name: string; args_summary: string }[] = [];
  const recordsReferenced = new Set<string>();

  const maxRounds = env.AI_MAX_TOOL_ROUNDS;

  for (let round = 0; round < maxRounds; round++) {
    let response: any;
    try {
      response = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages,
        tools: toolDefinitions as any,
        tool_choice: 'auto',
      });
    } catch (e) {
      console.error('OpenAI error:', e);
      throw new AppError(503, 'AI_UNAVAILABLE', 'AI service unavailable');
    }

    const choice = response.choices?.[0];
    const msg = choice?.message;
    if (!msg) {
      throw new AppError(503, 'AI_UNAVAILABLE', 'No response from AI');
    }

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      // append assistant message
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        const name = tc.function?.name;
        let args: any = {};
        try {
          args = JSON.parse(tc.function?.arguments || '{}');
        } catch {
          args = {};
        }

        if (!ALLOWED_TOOLS.has(name)) {
          // unknown tool: refuse and re-ask once
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify({ error: 'Unknown tool' }),
          });
          continue;
        }

        // validate args with zod
        const schema = toolArgSchemas[name];
        const parsed = schema.safeParse(args);
        if (!parsed.success) {
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify({ error: 'Invalid arguments' }),
          });
          continue;
        }
        const validArgs = parsed.data;

        // clamp
        if (name === 'get_expiring_batches') {
          validArgs.days = Math.min(Math.max(validArgs.days, 1), 365);
        }
        if (name === 'get_stock_movements') {
          validArgs.limit = Math.min(Math.max(validArgs.limit ?? 20, 1), 100);
        }

        toolCallsMeta.push({ name, args_summary: JSON.stringify(validArgs).slice(0, 200) });

        let result: any;
        try {
          result = await toolHandlers[name](validArgs, pharmacyId);
        } catch (e) {
          console.error('Tool handler error:', e);
          result = { error: 'Tool execution failed' };
        }

        // collect ids
        collectIds(result, recordsReferenced);

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result).slice(0, 8000),
        });
      }
      // loop again
      continue;
    }

    // final answer
    const answer = msg.content || '';
    // filter medical advice? We rely on prompt. But also ensure no clinical. Keep as is.
    return {
      answer,
      tool_calls: toolCallsMeta,
      records_referenced: Array.from(recordsReferenced),
      conversation_id: cid,
    };
  }

  // exhausted rounds: ask model to finalize without tools
  try {
    const finalResp = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [...messages, { role: 'user', content: 'Please provide your final answer based on the data above.' }],
    });
    const answer = finalResp.choices?.[0]?.message?.content || 'Unable to generate answer.';
    return {
      answer,
      tool_calls: toolCallsMeta,
      records_referenced: Array.from(recordsReferenced),
      conversation_id: cid,
    };
  } catch (e) {
    console.error('OpenAI final error:', e);
    throw new AppError(503, 'AI_UNAVAILABLE', 'AI service unavailable');
  }
}

function collectIds(obj: any, set: Set<string>) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    for (const o of obj) collectIds(o, set);
    return;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'id' && (typeof v === 'string' || typeof v === 'number')) {
        set.add(String(v));
      } else {
        collectIds(v, set);
      }
    }
  }
}
