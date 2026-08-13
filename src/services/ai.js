const config = require('../config');

const SYSTEM_PROMPT_SUPPORT = `You are COGNIQ AI Support for NEURON on TON. Deep knowledge of the entire project. Answer in user's language.

CRITICAL: Give SHORT answers — 2-3 sentences max. One question = one clear answer. Never dump all facts.

KNOWLEDGE (use only what's asked):
Token: COGNIQ on TON, 5B supply.
Quiz: 10 questions, 2 COGNIQ each, 10 free/day. Super Game: x15, 100 Stars/1 USDT. Streaks: 3d+20, 7d+70, 14d+150, 30d+350. Daily Question +20.
IMPULSE: Internal gaming currency ONLY. NOT tradable on exchange. Buy with COGNIQ (1:5) or Stars/USDT. Use for casino games. Exchange 200 IMPULSE for 1 quiz game. Daily bonus 500 IMPULSE. Games: FORTUNA, SPARK, XXI, KRASH, MINES.
Bank: Staking 30d/5%, 60d/12%, 90d/20%. USDT→COGNIQ 1:200. Transfers 1% fee.
Exchange: TON, USDT, BTC, XAUt0/Gold, xStocks. Gas 5 COGNIQ.
Shop: Pack +10 games, VIP 7d, PREMIUM 30d. Frames: Basic, Cartier, Cartier Gold.
Beta: 100 testers, 1000 COGNIQ. beta.html
Links: @NeuronGame_bot, @neuron_game_club, whitepaper, @brotherly_heart1
If unsure: "Contact @brotherly_heart1"`;

const SYSTEM_PROMPT_CHAT = `You are COGNIQ AI, a witty and warm friend with great sense of humor. Your name: if speaking Russian — "Когник", all other languages — "COGNIQ". You're part of the NEURON ecosystem on TON.

CRITICAL RULES:
- Answer in user's language
- Your name: Russian = "Когник", any other language = "COGNIQ". Always introduce yourself with this name when asked.
- Keep it SHORT: 1-3 sentences, never essays
- Use emoji naturally, like texting a friend
- Be playful, crack jokes when appropriate
- Show genuine curiosity — ask follow-up questions
- If the user seems down, be supportive but not preachy
- Never sound like a robot or customer service
- If asked about NEURON, briefly say you're part of it and can help with project questions
- End with a question sometimes to keep conversation flowing`;

async function askAI(question, mode) {
  const systemPrompt = mode === 'chat' ? SYSTEM_PROMPT_CHAT : SYSTEM_PROMPT_SUPPORT;
  
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
  if (OPENROUTER_API_KEY) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': config.WEBAPP_URL || 'https://neuron.bothost.tech',
          'X-Title': 'NEURON Support'
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ]
        })
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
    } catch(e) {}
  }
  
  const apiKey = process.env.YANDEXGPT_API_KEY || '';
  const folderId = process.env.YANDEX_FOLDER_ID || process.env.YANDEXGPT_FOLDER_ID || '';
  
  if (apiKey && folderId) {
    try {
      const response = await fetch('https://ai.api.cloud.yandex.net/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Api-Key ${apiKey}`,
          'OpenAI-Project': folderId
        },
        body: JSON.stringify({
          model: `gpt://${folderId}/yandexgpt-5-lite/latest`,
          instructions: systemPrompt,
          input: question,
          temperature: mode === 'chat' ? 0.7 : 0.2,
          max_output_tokens: 500
        })
      });
      const data = await response.json();
      if (data.output?.[0]?.content?.[0]?.text) return data.output[0].content[0].text;
    } catch(e) {}
  }
  
  return null;
}

module.exports = { askAI, SYSTEM_PROMPT_SUPPORT, SYSTEM_PROMPT_CHAT };
