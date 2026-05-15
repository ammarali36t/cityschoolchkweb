const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const { prompt } = JSON.parse(event.body);
        const result = await model.generateContent(prompt || "Hello");
        
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: result.response.text() })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ reply: error.message }) };
    }
};
