import { createServerFn } from "@tanstack/react-start";

const cache = new Map<string, { at: number; text: string }>();
const TTL = 30 * 60 * 1000;

export const briefHuntEvent = createServerFn({ method: "POST" })
  .validator((input: { title: string; url: string; note: string; botsDesigned: boolean }) => ({
    title: input.title.slice(0, 160),
    url: input.url.slice(0, 240),
    note: input.note.slice(0, 240),
    botsDesigned: Boolean(input.botsDesigned),
  }))
  .handler(async ({ data }) => {
    const key = `${data.url}|${data.title}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return { ok: true as const, text: hit.text, cached: true };

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: true as const,
        cached: false,
        text: data.botsDesigned
          ? `${data.title} is flagged as bot-designed. Confirm the host still allows BOT titles, join only through the official page (${data.url}), and keep Liorin off any human-only section. ${data.note}`
          : `${data.title} is not a dedicated bot event. Diplomat says watch only. Do not point an engine at a human pool.`,
      };
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 280,
        messages: [
          {
            role: "system",
            content:
              "You are DIPLOMAT-06 CHARTER for Liorin, a chess engine. Brief the captain in 90 words. Only recommend joining if the event is designed for bots/engines. Never advise engine use against unsuspecting humans. Mention the official URL. No emoji.",
          },
          {
            role: "user",
            content: `Event: ${data.title}\nURL: ${data.url}\nBot-designed flag: ${data.botsDesigned}\nScout note: ${data.note}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `Briefing channel ${res.status}` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "Empty briefing" };
    cache.set(key, { at: Date.now(), text });
    return { ok: true as const, text, cached: false };
  });
