const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash" 
        });

        const { prompt, imageData } = JSON.parse(event.body);

        // System instructions to keep it focused on TCS Chakwal
        const systemPrompt = "You are CampusBuddy, the AI for TCS Chakwal. HM is the lead authority. School is on Bhoun Road. Help students with their questions or images.";
        
        let parts = [{ text: systemPrompt + " " + (prompt || "What is in this image?") }];

        if (imageData) {
            parts.push({
                inlineData: {
                    data: imageData,
                    mimeType: "image/jpeg"
                }
            });
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply: response.text() }),
        };
    } catch (error) {
        console.error("Internal Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ reply: "I'm having trouble accessing my vision modules. Please double-check your API key in Netlify!" }) 
        };
    }
};
