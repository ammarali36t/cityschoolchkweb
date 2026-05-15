const { GoogleGenerativeAI } = require("@google-generativeai/generative-ai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const { prompt, imageData } = JSON.parse(event.body);
        
        // This ensures he knows he's CampusBuddy for text OR images
        const systemIdentity = "You are CampusBuddy, the AI for TCS Chakwal. HM is the lead authority. School is on Bhoun Road. Answer queries about the school or analyze uploaded images helpfully.";
        
        let payload = [systemIdentity + " " + (prompt || "Explain this image.")];

        if (imageData) {
            payload.push({
                inlineData: {
                    data: imageData,
                    mimeType: "image/jpeg"
                }
            });
        }

        const result = await model.generateContent(payload);
        const response = await result.response;
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply: response.text() }),
        };
    } catch (error) {
        console.error(error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ reply: "I'm connecting my vision sensors. Please try again in 30 seconds!" }) 
        };
    }
};
