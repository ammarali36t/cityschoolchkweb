const { GoogleGenerativeAI } = require("@google-generativeai/generative-ai");

exports.handler = async (event) => {
    // Basic security check
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // Use the key you set in Netlify
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are CampusBuddy, the AI for TCS Chakwal. The Headmistress is the lead authority. School is on Bhoun Road. Be professional and helpful."
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
        console.error("Function Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ reply: "My AI brain is warming up. Please try again in a minute!" }) 
        };
    }
};
