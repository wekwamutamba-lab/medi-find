import { FormEvent, useState } from 'react';

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

const demoPrompts = [
  'Which medicines are low stock?',
  'What is expiring soon?',
  'Summarize the recent stock movements.',
];

function buildDemoAnswer(question: string) {
  const q = question.toLowerCase();

  if (q.includes('low stock') || q.includes('reorder') || q.includes('stock')) {
    return 'The current low-stock risk is Paracetamol 500mg at 18 units against a reorder level of 30. Salbutamol Inhaler is also out of stock and should be prioritized for re-ordering.';
  }

  if (q.includes('expiry') || q.includes('expire') || q.includes('batch')) {
    return 'The batch list shows no immediate critical expiry risk, but the next items to review are the older Amoxicillin and Paracetamol lots near their expiry window.';
  }

  if (q.includes('movement') || q.includes('audit') || q.includes('issue')) {
    return 'Recent movement activity shows a supplier receipt of 40 units for Paracetamol, a ward issue of 18 units for Amoxicillin, and a shelf adjustment flagged for Metformin.';
  }

  return 'I can help with stock risk, expiry review, and movement summaries. Based on the current pharmacy snapshot, the biggest immediate risks are low stock on Paracetamol and the out-of-stock Salbutamol inhaler.';
}

async function askAi(question: string) {
  const token = localStorage.getItem('medifind_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/ai/ask', {
      method: 'POST',
      headers,
      body: JSON.stringify({ question }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        answer: payload?.error?.message || buildDemoAnswer(question),
        mode: 'fallback',
      };
    }

    return {
      answer: payload?.data?.answer || buildDemoAnswer(question),
      mode: 'live',
    };
  } catch {
    return {
      answer: buildDemoAnswer(question),
      mode: 'fallback',
    };
  }
}

export function AiPage() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'I can help review stock risk, expiry windows, and recent movements. Ask me about low stock, urgent replenishment, or batch issues.',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Demo assistant ready');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setQuestion('');
    setLoading(true);
    setStatus('Thinking…');

    const result = await askAi(trimmed);

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: result.answer,
    };

    setMessages((current) => [...current, assistantMessage]);
    setStatus(result.mode === 'live' ? 'Live AI response' : 'Demo fallback active');
    setLoading(false);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow"><span className="preview-badge"><span /> AI Assistant</span></div>
          <h1>Pharmacy Intelligence Assistant</h1>
          <p className="page-subtitle">Ask about low stock, expiring batches, and recent inventory trends.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">{status}</div>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            {status.includes('Live') ? 'Live' : 'Demo'} mode
          </span>
        </div>

        <div className="max-h-[480px] overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Thinking…</div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {demoPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setQuestion(prompt)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about stock, batches, or replenishment…"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? 'Sending…' : 'Ask AI'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
