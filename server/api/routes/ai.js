const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Calculate Calories Burned
router.post('/calories', async (req, res) => {
  const { name, type, duration } = req.body;

  if (!name || !duration) {
    return res.status(400).json({ error: 'Workout name and duration are required' });
  }

  try {
    const response = await axios.post(API_URL, {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: `Calculate approximate calories burned for a 30-year-old male weighing 70kg doing ${name} (${type}) for ${duration} minutes. Return only a number representing total calories burned.`
        }
      ],
      temperature: 0.3,
      max_tokens: 50
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      }
    });

    const content = response.data.choices[0].message.content;
    const caloriesMatch = content.match(/\d+/);
    const calories = caloriesMatch ? caloriesMatch[0] : '0';

    res.json({ calories });
  } catch (error) {
    console.error('DeepSeek API Error (Calories):', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to calculate calories' });
  }
});

// Calculate Nutrition Facts
router.post('/nutrition', async (req, res) => {
  const { name, quantity } = req.body;

  if (!name || !quantity) {
    return res.status(400).json({ error: 'Food name and quantity are required' });
  }

  try {
    const response = await axios.post(API_URL, {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: `Given a food name, return approximate nutrition facts per 100 grams in strict JSON format with keys: food, calories, protein_g, carbs_g, fat_g. Only return valid JSON without any markdown formatting. Food: ${name}`
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      }
    });

    let cleaned = response.data.choices[0].message.content.trim();
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const nutritionData = JSON.parse(cleaned);
    const multiplier = parseFloat(quantity) / 100;

    res.json({
      calories: Math.round((nutritionData.calories || 0) * multiplier).toString(),
      protein: (Math.round((nutritionData.protein_g || 0) * multiplier * 10) / 10).toString(),
      carbs: (Math.round((nutritionData.carbs_g || 0) * multiplier * 10) / 10).toString(),
      fat: (Math.round((nutritionData.fat_g || 0) * multiplier * 10) / 10).toString()
    });
  } catch (error) {
    console.error('DeepSeek API Error (Nutrition):', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch nutrition data' });
  }
});

module.exports = router;
