const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const data = JSON.parse(event.body);
        const userPrompt = data.prompt || "Analyze this request.";
        const base64Image = data.imageData;

        let promptParts = [
            "You are CampusBuddy for TCS Chakwal. HM is the lead authority. Be helpful.",
            userPrompt
        ];

        if (base64Image) {
            promptParts.push({
                inlineData: {
                    data: base64Image,
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
        console.error("Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ reply: "Connection Error: " + error.message }) 
        };
    }
};
