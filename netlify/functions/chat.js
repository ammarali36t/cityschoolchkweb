const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        // Ensure the API Key is present
        if (!process.env.AYAAN_API_KEY) {
            throw new Error("AYAAN_API_KEY is missing from Netlify settings.");
        }

        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        
        // FIX: Some library versions need "models/gemini-1.5-flash" 
        // while others just need "gemini-1.5-flash". 
        // We'll use the most standard one.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const body = JSON.parse(event.body);
        const userPrompt = body.prompt || "Hello!";
        
        const systemId = "You are CampusBuddy for TCS Chakwal. HM is the lead authority. Be helpful and concise.";
        
        let parts = [{ text: systemId + " " + userPrompt }];

        if (body.imageData) {
            parts.push({
                inlineData: {
                    data: body.imageData,
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
        console.error("Detailed Error:", error);
        
        // If it's the 404 error again, we provide a clearer fallback
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                reply: "Brain Connection Error. My model version might be outdated. Please check the Netlify logs." 
            }) 
        };
    }
};
