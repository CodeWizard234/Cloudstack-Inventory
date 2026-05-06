const Product = require('../models/Product');
const { GoogleGenAI } = require('@google/genai');

const aiInsights = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user.id });
    
    if (products.length === 0) {
      return res.status(200).json({ insight: "You have no products yet. Add some inventory to get AI insights!" });
    }

    const inventoryData = products.map(p => ({
      name: p.name,
      stock: p.currentStock,
      threshold: p.minStockLevel,
      salesLast5Days: p.salesHistory,
    }));

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: "GEMINI_API_KEY is not set in environment." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `
    You are an expert Inventory Management AI assistant.
    Analyze this inventory data and provide concise, actionable business insights. 
    Point out items that need immediate restocking, overstocked items, and simple demand trends based on salesLast5Days.
    Keep your response easy to read, using markdown bullet points. Do not include introductory filler. 
    
    Data:
    ${JSON.stringify(inventoryData)}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    res.json({ insight: response.text });
  } catch (error) {
    console.error('AI Insight Error (detailed):', error);
    res.status(500).json({ error: 'Failed to generate AI insights', details: error.message });
  }
};

module.exports = { aiInsights };