const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const Idea = require('../models/Idea');

async function callGemini(prompt) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      timeout: 30000
    }
  );
  return response.data.content[0].text.trim();
}

function extractJSON(text) {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No valid JSON in response');
  return JSON.parse(match[0]);
}

module.exports = router;
