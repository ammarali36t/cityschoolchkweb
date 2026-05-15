const { GoogleGenerativeAI } = require("@google-generativeai/generative-ai");

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // We use AYAAN_API_KEY because that matches your Netlify settings exactly
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: `You are CampusBuddy, the official AI for The City School (TCS) Chakwal Campus.
            - Location: Bhoun Road, Chakwal.
            - Admissions: +92 335 9579576.
            - Authority: The Headmistress.
            - Tone: Helpful, professional, and school-proud.
            Keep answers short. If you don't know an answer, tell them to contact the front office.`
        });

        const { prompt } = JSON.parse(event.body);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: response.text() }),
        };
    } catch (error) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ reply: "I'm having a bit of a brain freeze. Try again in a moment!" }) 
        };
    }
};
