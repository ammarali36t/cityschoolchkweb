const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // This must match your Netlify Environment Variable name exactly
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are CampusBuddy, the AI for The City School Chakwal. The school is on Bhoun Road. HM is the lead authority. Be helpful and concise."
        });

        const { prompt } = JSON.parse(event.body);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply: response.text() }),
        };
    } catch (error) {
        console.error("AI Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ reply: "I'm having trouble thinking. Please try again in a moment!" }) 
        };
    }
};
