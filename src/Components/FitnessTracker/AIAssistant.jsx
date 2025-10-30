import React, { useState, useRef, useEffect } from 'react';

const AIAssistant = ({ user, meals, workouts, profile }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hey ${user?.displayName || 'there'}! I'm your personal fitness coach. I can help you with:\n• Calorie counts for foods (try "how many calories in 2 dosas?" or "150g rice")\n• Nutrition breakdowns (protein, carbs, fats)\n• Healthy meal ideas\n• Workout routines for your goals\n• Quick fitness tips\n\nWhat would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [lastFoodItem, setLastFoodItem] = useState(''); // Track the last food item asked about

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to correct common typos and misspellings
  const correctTypos = (text) => {
    // Common typo corrections
    const corrections = {
      'amny': 'many',
      'doas': 'dosa',
      'dosas': 'dosa',
      'disa': 'dosa',
      'banan': 'banana',
      'bananas': 'banana',
      'aple': 'apple',
      'aples': 'apple',
      'organe': 'orange',
      'oranges': 'orange',
      'chapathi': 'chapati',
      'chapaties': 'chapati',
      'rotis': 'roti',
      'parathas': 'paratha',
      'pooris': 'poori',
      'idlis': 'idli',
      'vadas': 'vada',
      'samosas': 'samosa',
      'puri': 'poori',
      'pories': 'poori',
      'chiken': 'chicken',
      'protien': 'protein',
      'carbs': 'carbohydrates',
      'carb': 'carbohydrates',
      'fats': 'fat',
      'cal': 'calories',
      'cals': 'calories',
      'calorie': 'calories',
      'wokrout': 'workout',
      'wokrouts': 'workout',
      'exersise': 'exercise',
      'exersises': 'exercise',
      'fitnes': 'fitness',
      'heathy': 'healthy',
      'helthy': 'healthy',
      'nutriton': 'nutrition',
      'nutritious': 'nutrition',
      'recepie': 'recipe',
      'recipie': 'recipe',
      'receipes': 'recipe',
      'recipies': 'recipe',
      'plese': 'please',
      'pls': 'please',
      'plz': 'please',
      'thnks': 'thanks',
      'thnx': 'thanks',
      'thanx': 'thanks',
      'workout': 'workout',
      'workouts': 'workout',
      'exercis': 'exercise',
      'exercises': 'exercise',
      'fit': 'fitness',
      'nutri': 'nutrition',
      'proteins': 'protein',
      'fatty': 'fat',
      'carbohydrate': 'carbohydrates',
      'carbo': 'carbohydrates',
      'hydrat': 'hydrate',
      'hydrating': 'hydrate',
      'hydrated': 'hydrate'
    };

    // Split text into words and correct each word
    const words = text.split(/\s+/);
    const correctedWords = words.map(word => {
      const lowerWord = word.toLowerCase().replace(/[^\w]/g, ''); // Remove punctuation for matching
      // Check if word needs correction
      if (corrections[lowerWord]) {
        // Preserve original capitalization
        if (word.charAt(0) === word.charAt(0).toUpperCase()) {
          return corrections[lowerWord].charAt(0).toUpperCase() + corrections[lowerWord].slice(1);
        }
        return corrections[lowerWord];
      }
      return word;
    });

    return correctedWords.join(' ');
  };

  // Function to filter out irrelevant words and phrases
  const filterIrrelevantWords = (text) => {
    const irrelevantWords = [
      'amny', 'plese', 'disa', 'pls', 'plz', 'thnks', 'thnx', 'thanx'
    ];
    
    const irrelevantPhrases = [
      'in pieces or grams',
      'pieces or grams',
      'in grams or pieces',
      'grams or pieces'
    ];
    
    // Remove irrelevant phrases first
    let filteredText = text;
    irrelevantPhrases.forEach(phrase => {
      filteredText = filteredText.replace(new RegExp(phrase, 'gi'), '');
    });
    
    // Then filter individual words
    const words = filteredText.split(/\s+/);
    return words.filter(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      return !irrelevantWords.includes(cleanWord);
    }).join(' ').replace(/\s+/g, ' ').trim(); // Remove extra spaces
  };

  // Function to parse food queries and extract quantity and food name
  const parseFoodQuery = (query) => {
    // First correct any typos and filter irrelevant words
    const correctedQuery = filterIrrelevantWords(correctTypos(query));
    
    // Handle special case where user just says "one piece" or similar after being asked for quantity
    if (correctedQuery === 'one piece' || correctedQuery === 'one') {
      return {
        quantity: '1',
        unit: 'piece',
        food: ''
      };
    }
    
    // Common patterns for food queries
    const patterns = [
      /^how many calories (?:does |contain )?(.+)$/i,
      /^calories (in|for) (.+)$/i,
      /^what are the calories (in|for) (.+)$/i,
      /^(.+)$/i // Catch-all pattern
    ];
    
    for (let pattern of patterns) {
      const match = correctedQuery.match(pattern);
      if (match) {
        const foodText = match[2] || match[1];
        
        // Extract quantity and unit from food text
        const quantityPattern = /^([\d½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞\s]+)?\s*([a-zA-Zμ]+)?\s*(.+)$/;
        const quantityMatch = foodText.match(quantityPattern);
        
        if (quantityMatch) {
          const [, quantityPart, unitPart, foodPart] = quantityMatch;
          return {
            quantity: quantityPart ? quantityPart.trim() : '',
            unit: unitPart ? unitPart.toLowerCase() : '',
            food: foodPart ? foodPart.trim() : foodText.trim()
          };
        } else {
          // If no quantity pattern matches, treat the whole thing as food name
          return {
            quantity: '',
            unit: '',
            food: foodText.trim()
          };
        }
      }
    }
    
    return {
      quantity: '',
      unit: '',
      food: correctedQuery.trim()
    };
  };

  // Function to convert fractions to decimals
  const parseQuantity = (quantityStr) => {
    // Handle empty or undefined input
    if (!quantityStr || quantityStr.trim() === '') {
      return 1; // Default to 1
    }
    
    // Handle fraction inputs like ½, ¼, etc.
    const fractions = {
      '½': 0.5,
      '¼': 0.25,
      '¾': 0.75,
      '⅓': 0.333,
      '⅔': 0.667,
      '⅕': 0.2,
      '⅖': 0.4,
      '⅗': 0.6,
      '⅘': 0.8,
      '⅙': 0.167,
      '⅚': 0.833,
      '⅛': 0.125,
      '⅜': 0.375,
      '⅝': 0.625,
      '⅞': 0.875
    };
    
    // Check if it's a fraction
    if (fractions[quantityStr]) {
      return fractions[quantityStr];
    }
    
    // Handle mixed numbers like "1 ½"
    const mixedNumberRegex = /^(\d+)\s+([½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/;
    const mixedMatch = quantityStr.match(mixedNumberRegex);
    if (mixedMatch) {
      const whole = parseFloat(mixedMatch[1]);
      const fraction = fractions[mixedMatch[2]];
      return whole + fraction;
    }
    
    // Handle decimal numbers
    const decimal = parseFloat(quantityStr);
    return isNaN(decimal) ? 1 : decimal;
  };

  // Function to fetch nutrition data from DeepSeek API
  const fetchNutritionData = async (foodName) => {
    if (!foodName.trim()) {
      throw new Error('No food name provided');
    }
    
    try {
      // DeepSeek API configuration
      const apiKey = 'sk-1116ca52ef05484c83f0b8b3603f7ad0'; // Your DeepSeek API key
      const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: `Given a food name, return approximate nutrition facts per 100 grams in strict JSON format with keys: food, calories, protein_g, carbs_g, fat_g. Only return valid JSON without any markdown formatting. Food: ${foodName}`
            }
          ],
          temperature: 0.1,
          max_tokens: 200
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const nutritionInfo = data.choices[0].message.content.trim();
      
      // Clean the response to remove any markdown formatting
      let cleanedNutritionInfo = nutritionInfo;
      if (cleanedNutritionInfo.startsWith('```json')) {
        cleanedNutritionInfo = cleanedNutritionInfo.substring(7);
      }
      if (cleanedNutritionInfo.startsWith('```')) {
        cleanedNutritionInfo = cleanedNutritionInfo.substring(3);
      }
      if (cleanedNutritionInfo.endsWith('```')) {
        cleanedNutritionInfo = cleanedNutritionInfo.slice(0, -3);
      }
      cleanedNutritionInfo = cleanedNutritionInfo.trim();
      
      // Try to parse the JSON response
      const nutritionData = JSON.parse(cleanedNutritionInfo);
      
      return {
        food: nutritionData.food,
        calories: parseFloat(nutritionData.calories) || 0,
        protein: parseFloat(nutritionData.protein_g) || 0,
        carbs: parseFloat(nutritionData.carbs_g) || 0,
        fat: parseFloat(nutritionData.fat_g) || 0
      };
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      // Return default values if API fails
      return { calories: 100, protein: 5, carbs: 10, fat: 3, food: foodName };
    }
  };

  // Function to convert units to grams
  const convertToGrams = (quantity, unit, foodName = '') => {
    const numericQuantity = parseQuantity(quantity);
    
    // Special handling for piece-based Indian foods with more accurate weights
    if ((!unit || unit === '') && foodName) {
      if (isCountedByPieces(foodName)) {
        // Use more realistic weights for Indian foods
        const foodWeights = {
          'dosa': 70,      // A typical dosa weighs around 70g
          'dosas': 70,
          'idli': 40,      // A typical idli weighs around 40g
          'idlis': 40,
          'chapati': 60,   // A typical chapati weighs around 60g
          'chapatis': 60,
          'roti': 60,      // A typical roti weighs around 60g
          'rotis': 60,
          'paratha': 80,   // A typical paratha weighs around 80g
          'parathas': 80,
          'poori': 50,     // A typical poori weighs around 50g
          'pooris': 50,
          'puri': 50,
          'puris': 50,
          'vada': 60,      // A typical vada weighs around 60g
          'vadas': 60,
          'samosa': 50,    // A typical samosa weighs around 50g
          'samosas': 50,
          'egg': 60,       // A typical egg weighs around 60g
          'eggs': 60,
          'apple': 150,    // A typical apple weighs around 150g
          'apples': 150,
          'banana': 120,   // A typical banana weighs around 120g
          'bananas': 120,
          'orange': 130,   // A typical orange weighs around 130g
          'oranges': 130
        };
        
        // Check if we have a specific weight for this food
        const lowerFoodName = foodName.toLowerCase();
        if (foodWeights[lowerFoodName]) {
          return numericQuantity * foodWeights[lowerFoodName];
        }
        
        // Default to 100g per piece if not specified
        return numericQuantity * 100;
      }
    }
    
    switch (unit.toLowerCase()) {
      case 'g':
      case 'gram':
      case 'grams':
        return numericQuantity;
      case 'kg':
      case 'kilogram':
      case 'kilograms':
        return numericQuantity * 1000;
      case 'mg':
      case 'milligram':
      case 'milligrams':
        return numericQuantity / 1000;
      case 'ml':
      case 'milliliter':
      case 'milliliters':
        return numericQuantity; // Assume 1ml ≈ 1g
      case 'l':
      case 'liter':
      case 'liters':
        return numericQuantity * 1000;
      case 'cup':
      case 'cups':
        return numericQuantity * 240; // Approximate 1 cup = 240g
      case 'tbsp':
      case 'tablespoon':
      case 'tablespoons':
        return numericQuantity * 15; // Approximate 1 tbsp = 15g
      case 'tsp':
      case 'teaspoon':
      case 'teaspoons':
        return numericQuantity * 5; // Approximate 1 tsp = 5g
      case 'oz':
      case 'ounce':
      case 'ounces':
        return numericQuantity * 28.35; // 1 oz = 28.35g
      case 'lb':
      case 'lbs':
      case 'pound':
      case 'pounds':
        return numericQuantity * 453.59; // 1 lb = 453.59g
      default:
        // For pieces, use more accurate weights when available
        if (foodName) {
          const foodWeights = {
            'dosa': 70,
            'dosas': 70,
            'idli': 40,
            'idlis': 40,
            'chapati': 60,
            'chapatis': 60,
            'roti': 60,
            'rotis': 60,
            'paratha': 80,
            'parathas': 80,
            'poori': 50,
            'pooris': 50,
            'puri': 50,
            'puris': 50,
            'vada': 60,
            'vadas': 60,
            'samosa': 50,
            'samosas': 50,
            'egg': 60,
            'eggs': 60,
            'apple': 150,
            'apples': 150,
            'banana': 120,
            'bananas': 120,
            'orange': 130,
            'oranges': 130
          };
          
          const lowerFoodName = foodName.toLowerCase();
          if (foodWeights[lowerFoodName]) {
            return numericQuantity * foodWeights[lowerFoodName];
          }
        }
        // Default to 100g per piece if not specified
        return numericQuantity * 100;
    }
  };

  // Function to determine if a food is typically counted by pieces or weight
  const isCountedByPieces = (foodName) => {
    const pieceFoods = [
      'dosa', 'dosas', 'idli', 'idlis', 'chapati', 'chapatis', 'roti', 'rotis',
      'paratha', 'parathas', 'puri', 'puris', 'samosa', 'samosas', 'vada', 'vadas',
      'egg', 'eggs', 'apple', 'apples', 'banana', 'bananas', 'orange', 'oranges',
      'bread', 'breads', 'sandwich', 'sandwiches', 'cookie', 'cookies',
      'biscuit', 'biscuits', 'cake', 'cakes', 'muffin', 'muffins', 'pizza', 'pizzas',
      'poori', 'pooris', 'upma', 'poha', 'medu vada', 'vada'
    ];
    
    // For non-piece foods like biryani, rice, etc., return false
    const weightBasedFoods = [
      'biryani', 'biriyani', 'rice', 'oats', 'milk', 'yogurt', 'curd', 'dal',
      'lentils', 'chicken', 'fish', 'meat', 'beef', 'pork', 'turkey', 'salmon',
      'pasta', 'noodles', 'quinoa', 'cereal', 'soup', 'stew', 'curry'
    ];
    
    const lowerFoodName = foodName.toLowerCase();
    
    // If it's explicitly weight-based, return false
    if (weightBasedFoods.some(weightFood => lowerFoodName.includes(weightFood))) {
      return false;
    }
    
    // Check if it's piece-based
    return pieceFoods.some(pieceFood => lowerFoodName.includes(pieceFood));
  };

  // Enhanced AI responses with real nutrition API integration and context memory
  const getAIResponse = async (userMessage, messageHistory) => {
    // First correct any typos and filter irrelevant words
    const correctedMessage = filterIrrelevantWords(correctTypos(userMessage));
    const message = correctedMessage.toLowerCase().trim();
    
    // Handle greetings
    if (message.includes('hello') || message.includes('hi') || message.includes('hey') || 
        message.includes('good morning') || message.includes('good afternoon') || 
        message.includes('good evening')) {
      return `Hello ${user?.displayName || 'there'}! Ready to crush your fitness goals today?`;
    }
    
    // Handle thanks
    if (message.includes('thank') || message.includes('thanks')) {
      return `You're welcome! Keep going strong 💪`;
    }
    
    // Handle how are you
    if (message.includes('how are you') || message.includes('how do you do')) {
      return `I'm doing great! How are you doing today?`;
    }
    
    // Check if we're waiting for quantity input (context-based response)
    const lastAIMessage = messageHistory.filter(m => m.sender === 'ai').pop();
    if (lastAIMessage && (lastAIMessage.text.includes('How many') || lastAIMessage.text.includes('Could you tell me the quantity'))) {
      // Use the last food item we stored
      const foodName = lastFoodItem;
      
      if (foodName) {
        // Handle common responses like "one piece" or just "one"
        let quantity = '1';  // Default to 1
        let unit = '';
        
        // Parse common quantity expressions
        if (message === 'one piece' || message === 'one') {
          quantity = '1';
          unit = 'piece';
        } else if (message === 'two pieces' || message === 'two') {
          quantity = '2';
          unit = 'piece';
        } else if (message === 'three pieces' || message === 'three') {
          quantity = '3';
          unit = 'piece';
        } else if (message === 'four pieces' || message === 'four') {
          quantity = '4';
          unit = 'piece';
        } else if (message === 'five pieces' || message === 'five') {
          quantity = '5';
          unit = 'piece';
        } else {
          // For other inputs, try to parse as regular quantity
          quantity = message;
        }
        
        // Fetch nutrition data from API
        const nutrition = await fetchNutritionData(foodName);
        
        // Convert quantity to grams with more accurate piece weights
        const grams = convertToGrams(quantity, unit, foodName);
        
        // Calculate nutrition based on grams (API returns per 100g)
        const multiplier = grams / 100;
        const totalCalories = Math.round(nutrition.calories * multiplier);
        const totalProtein = (nutrition.protein * multiplier).toFixed(1);
        const totalCarbs = (nutrition.carbs * multiplier).toFixed(1);
        const totalFat = (nutrition.fat * multiplier).toFixed(1);
        
        const numericQuantity = parseQuantity(quantity);
        
        // For Indian foods, use piece-based measurement in response
        if (isCountedByPieces(foodName)) {
          const plural = numericQuantity > 1 ? 's' : '';
          if (numericQuantity === 1) {
            return `One ${foodName} has about ${totalCalories} calories, with ${totalProtein}g protein, ${totalCarbs}g carbs, and ${totalFat}g fat. Nice choice!`;
          } else {
            return `${quantity} ${foodName}${plural} total roughly ${totalCalories} calories — perfect for a light meal!`;
          }
        } else {
          // For other foods, use grams/ml in response
          if (grams <= 100) {
            return `${grams}g of ${foodName} has about ${totalCalories} calories, with ${totalProtein}g protein, ${totalCarbs}g carbs, and ${totalFat}g fat. Keep fueling your goals 💪`;
          } else {
            return `${grams}g of ${foodName} contains about ${totalCalories} calories — a solid macro profile for your goals!`;
          }
        }
      }
    }
    
    // Handle food calorie queries
    if (message.includes('calorie') || message.includes('how many') || 
        message.includes('nutrition') || message.includes('protein') || 
        message.includes('carb') || message.includes('fat')) {
      
      // Parse the food query
      const parsed = parseFoodQuery(userMessage); // Use original message for parsing
      let quantity = parsed.quantity;
      let unit = parsed.unit;
      const foodName = parsed.food;
      
      // Store the food item for context
      if (foodName) {
        setLastFoodItem(foodName);
      }
      
      // Check if quantity was specified
      const quantitySpecified = quantity !== '';
      
      // Special handling for piece-based foods when no quantity is specified
      if (!quantitySpecified && foodName && isCountedByPieces(foodName)) {
        // Default to 1 piece for piece-counted foods
        quantity = '1';
        unit = 'piece';
      }
      
      // If no quantity specified for any food, ask for it
      if (!quantitySpecified && !isCountedByPieces(foodName)) {
        // Ask user for quantity if not specified (but only for weight-based foods)
        return `Could you tell me the quantity — in grams or milliliters?`;
      }
      
      // Fetch nutrition data from API
      const nutrition = await fetchNutritionData(foodName);
      
      // Convert quantity to grams with more accurate piece weights
      const grams = convertToGrams(quantity, unit, foodName);
      
      // Calculate nutrition based on grams (API returns per 100g)
      const multiplier = grams / 100;
      const totalCalories = Math.round(nutrition.calories * multiplier);
      const totalProtein = (nutrition.protein * multiplier).toFixed(1);
      const totalCarbs = (nutrition.carbs * multiplier).toFixed(1);
      const totalFat = (nutrition.fat * multiplier).toFixed(1);
      
      const numericQuantity = parseQuantity(quantity);
      
      // Create response based on query type
      if (message.includes('protein')) {
        if (isCountedByPieces(foodName)) {
          const plural = numericQuantity > 1 ? 's' : '';
          const verb = numericQuantity <= 1 ? 's' : '';
          if (numericQuantity === 1) {
            return `A single ${foodName} contains approximately ${totalProtein}g of protein. That's a solid start for your daily intake!`;
          } else {
            return `${quantity} ${foodName}${plural} contain${verb} ${totalProtein}g of protein. Great choice for muscle maintenance!`;
          }
        } else {
          return `${grams}g of ${foodName} contains ${totalProtein}g of protein. Great choice for muscle maintenance!`;
        }
      } else if (message.includes('carb')) {
        if (isCountedByPieces(foodName)) {
          const plural = numericQuantity > 1 ? 's' : '';
          const verb = numericQuantity <= 1 ? 's' : '';
          if (numericQuantity === 1) {
            return `A single ${foodName} contains approximately ${totalCarbs}g of carbohydrates. Perfect for fueling your day!`;
          } else {
            return `${quantity} ${foodName}${plural} contain${verb} ${totalCarbs}g of carbohydrates. Perfect for fueling your day!`;
          }
        } else {
          return `${grams}g of ${foodName} contains ${totalCarbs}g of carbohydrates. Perfect for fueling your day!`;
        }
      } else if (message.includes('fat')) {
        if (isCountedByPieces(foodName)) {
          const plural = numericQuantity > 1 ? 's' : '';
          const verb = numericQuantity <= 1 ? 's' : '';
          if (numericQuantity === 1) {
            return `A single ${foodName} contains approximately ${totalFat}g of fat. Focus on getting healthy fats like these!`;
          } else {
            return `${quantity} ${foodName}${plural} contain${verb} ${totalFat}g of fat. Focus on getting healthy fats like these!`;
          }
        } else {
          return `${grams}g of ${foodName} contains ${totalFat}g of fat. Focus on getting healthy fats like these!`;
        }
      } else {
        // General calorie response
        if (isCountedByPieces(foodName)) {
          const plural = numericQuantity > 1 ? 's' : '';
          if (numericQuantity === 1) {
            return `One ${foodName} has about ${totalCalories} calories, with ${totalProtein}g protein, ${totalCarbs}g carbs, and ${totalFat}g fat. Nice choice!`;
          } else {
            return `${quantity} ${foodName}${plural} total roughly ${totalCalories} calories — perfect for a light meal!`;
          }
        } else {
          if (grams <= 100) {
            return `${grams}g of ${foodName} has about ${totalCalories} calories, with ${totalProtein}g protein, ${totalCarbs}g carbs, and ${totalFat}g fat. Keep fueling your goals 💪`;
          } else {
            return `${grams}g of ${foodName} contains about ${totalCalories} calories — a solid macro profile for your goals!`;
          }
        }
      }
    }
    
    // Handle workout-related queries
    if (message.includes('workout') || message.includes('exercise') || message.includes('training') || 
        message.includes('abs') || message.includes('cardio') || message.includes('strength') ||
        message.includes('hiit') || message.includes('weight loss') || message.includes('fat loss') ||
        message.includes('muscle') || message.includes('gain')) {
      const goal = profile?.goal || 'maintain';
      
      if (message.includes('abs')) {
        return `Try this 3-move abs routine:
• Planks (30-60 seconds x 3 sets)
• Bicycle crunches (20 reps x 3 sets)
• Leg raises (15 reps x 3 sets)

4 weeks of consistency will show results! Keep going strong 💪`;
      } else if (message.includes('cardio')) {
        return `For effective cardio:
• Brisk walking/jogging (20-30 mins)
• Jump rope (10-15 mins)
• Dancing or cycling (20 mins)

Aim for 150 minutes per week minimum. Keep fueling your goals!`;
      } else if (message.includes('hiit') || message.includes('fat loss') || message.includes('weight loss')) {
        return `For fat loss, try 20 min HIIT and 10 min walking daily. You've got this! 💪`;
      } else if (message.includes('muscle') || message.includes('gain') || message.includes('strength')) {
        return `For muscle gain:
• Bodyweight exercises (push-ups, squats, lunges)
• Resistance training (dumbbells, resistance bands)
• 3 sets of 8-12 reps
• Rest 48 hours between sessions. Keep going strong!`;
      } else if (message.includes('beginner')) {
        return `Starting strong! Try this beginner plan:
• 20 mins walking
• 10 mins bodyweight exercises
• 3 days/week

Small steps lead to big results! You've got this 💪`;
      } else {
        return `For your ${goal} goal:
${goal === 'lose' ? '• 20 min HIIT + 10 mins walking daily\n• Focus on compound movements' : 
  goal === 'gain' ? '• 30 mins strength training\n• Progressive overload' : 
  '• 20 mins cardio + bodyweight exercises\n• Focus on consistency'}

Keep going strong 💪`;
      }
    }
    
    // Detailed meal suggestions
    if (message.includes('meal') || message.includes('food') || message.includes('eat') || 
        message.includes('lunch') || message.includes('dinner') || message.includes('breakfast') || 
        message.includes('snack')) {
      const goal = profile?.goal || 'maintain';
      
      if (message.includes('breakfast')) {
        return `Great breakfast ideas for your ${goal} goal:
• Oats with banana and nuts
• Veggie omelet with toast
• Greek yogurt with berries

Aim for 25-35g protein to start your day right! Keep fueling your goals 💪`;
      } else if (message.includes('lunch')) {
        return `Satisfying lunch options:
• Grilled chicken with rice and veggies
• Lentil curry with roti
• Salmon salad with olive oil

Include a palm-sized protein portion for balance. Nice choice!`;
      } else if (message.includes('dinner')) {
        return `Recovery-focused dinners:
• Dal with rice and vegetables
• Grilled fish with quinoa
• Tofu stir-fry with noodles

Eat light 2-3 hours before bed for better sleep. Keep going strong!`;
      } else if (message.includes('snack')) {
        return `Smart snack choices:
• Apple with almond butter
• Roasted chana
• Greek yogurt
• Mixed nuts

Time snacks between meals for best results! You've got this 💪`;
      } else {
        return `Balanced meal structure:
1. Protein source (palm-sized portion)
2. Carb source (fist-sized portion)
3. Vegetables (cup-sized portion)
4. Healthy fat (thumb-sized portion)

This works for any goal - adjust portions based on your ${goal} objective! Keep fueling your goals!`;
      }
    }
    
    // Motivational and general fitness advice
    if (message.includes('motivat') || message.includes('encourag') || message.includes('keep going') ||
        message.includes('give up') || message.includes('tired') || message.includes('lazy')) {
      return `You've got this! Remember:\n• Small, consistent actions beat dramatic changes\n• Progress isn't always linear - trust the process\n• Focus on how you feel, not just the scale\nKeep going strong 💪`;
    }
    
    // Water and hydration advice
    if (message.includes('water') || message.includes('hydrate')) {
      const weight = profile?.currentWeight || 70;
      const waterGoal = Math.round(weight * 35 / 1000 * 10) / 10; // liters
      
      return `Based on your ${weight}kg weight, aim for ${waterGoal} liters daily.
Timing tips:
• 500ml upon waking
• 250ml before each meal
• Sip consistently throughout the day

Add lemon or cucumber if plain water feels boring! Keep hydrating! 💪`;
    }
    
    // Redirect off-topic queries
    if (message.includes('weather') || message.includes('news') || message.includes('joke') || 
        message.includes('movie') || message.includes('entertainment') || message.includes('politics') ||
        message.includes('celebrity')) {
      return `I'm focused on helping you with fitness and nutrition! Try asking about:\n• Calorie counts for foods\n• Workout routines\n• Meal ideas\n• Nutrition advice`;
    }
    
    // Default response
    return `What would you like to know about your nutrition or fitness goals?`;
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Get AI response with message history context
      const aiResponseText = await getAIResponse(inputValue, [...messages, userMessage]);
      
      const aiResponse = {
        id: messages.length + 2,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: messages.length + 2,
        sender: 'ai',
        text: "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <h3>AI Fitness Assistant</h3>
        <p>Your personal nutrition and fitness advisor</p>
      </div>
      
      <div className="chat-container">
        <div className="messages-container">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender}`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                <span className="timestamp">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about calories, meals, workouts, or fitness tips..."
            rows="3"
          />
          <button 
            onClick={handleSendMessage}
            disabled={isLoading || inputValue.trim() === ''}
            className="send-button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;