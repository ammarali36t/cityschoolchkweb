import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const { prompt, imageData } = JSON.parse(event.body);
        
        // System prompt to handle both text and images
        const systemId = "You are CampusBuddy for TCS Chakwal. HM is the lead authority. Be helpful with text or images.";
        let parts = [{ text: systemId + " " + (prompt || "Explain this image.") }];

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
        console.error("AI Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ reply: "Connection Error: Please ensure AYAAN_API_KEY is set in Netlify Environment Variables." }) 
        };
    }
};
