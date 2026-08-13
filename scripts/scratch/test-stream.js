const { streamText, convertToModelMessages } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');
require('dotenv').config({ path: '.env.local' });

async function run() {
  try {
    const customOpenai = createOpenAI({ apiKey: process.env.AI_API_KEY });
    const modelMessages = await convertToModelMessages([
      { role: 'user', parts: [{ type: 'text', text: 'Combien font 2 + 2 ?' }] }
    ]);

    const result = streamText({
      model: customOpenai('gpt-4o-mini'),
      messages: modelMessages,
    });

    const response = result.toUIMessageStreamResponse();
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers));
    
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log('Chunk:', decoder.decode(value));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
