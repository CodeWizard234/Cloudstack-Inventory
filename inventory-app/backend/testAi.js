require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('No GEMINI_API_KEY in env!');
    return;
  }
  console.log('Testing with key:', process.env.GEMINI_API_KEY.substring(0, 5) + '...');
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Say hello!"
    });
    console.log('Success:', response.text);
  } catch (error) {
    console.error('AI Insight Error:', error.message);
    if (error.status) console.error('Status:', error.status);
  }
}
test();