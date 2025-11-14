// src/app/api/ai/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const prompt = body.prompt ?? '';

  const apiKey = process.env.CLAUDE_API_KEY;
  const model = process.env.CLAUDE_MODEL ?? 'claude-haiku-4.5';

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
  }

  // Example fetch — adjust URL & payload to provider API
  const resp = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      // other model-specific params...
    }),
  });

  const data = await resp.json();
  return NextResponse.json(data);
}