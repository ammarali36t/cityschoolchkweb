const { GoogleGenerativeAI } = require("@google-generativeai/generative-ai");

exports.handler = async (event) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are CampusBuddy for TCS Chakwal. Admissions: +92 335 9579576. Location: Bhoun Road. Be helpful."
        });

        const { prompt } = JSON.parse(event.body);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: response.text() }),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ reply: "Error: " + error.message }) };
    }
};
