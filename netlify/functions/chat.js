const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    // Standard check for POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const body = JSON.parse(event.body);
        
        // This handles BOTH text-only and Image+Text
        let promptParts = [
            "You are CampusBuddy for TCS Chakwal. HM is the lead authority. Be helpful.",
            body.prompt || "Hello!"
        ];

        if (body.imageData) {
            promptParts.push({
                inlineData: {
                    data: body.imageData,
                    mimeType: "image/jpeg"
                }
            });
        }

        const result = await model.generateContent(promptParts);
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
            body: JSON.stringify({ reply: "I'm having trouble reaching my AI core. Error: " + error.message }) 
        };
    }
};
