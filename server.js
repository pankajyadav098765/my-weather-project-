// api/server.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. Setup - Get keys from Vercel's secure vault
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const WEATHER_KEY = process.env.WEATHER_API_KEY;

    if (!GEMINI_KEY || !WEATHER_KEY) {
        return res.status(500).json({ error: "API Keys missing on server" });
    }

    // 2. Get the city from the frontend request
    const { city } = req.query;

    if (!city) {
        return res.status(400).json({ error: "City name is required" });
    }

    try {
        // 3. Step A: Get Weather Data (Hiding Weather Key)
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_KEY}`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        if (weatherData.cod !== 200) {
            throw new Error("City not found");
        }

        const temp = weatherData.main.temp;
        const condition = weatherData.weather[0].description;

        // 4. Step B: Ask Gemini to explain it (Hiding Gemini Key)
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `The weather in ${city} is ${temp}°C and ${condition}. Give me a funny, sarcastic 2-sentence weather report for this.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 5. Send the safe text back to the frontend
        res.status(200).json({ result: text });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}