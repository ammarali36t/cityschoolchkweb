const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // Initialize the AI with your API Key
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);

        // FIX: Explicitly using the model name without 'models/' prefix 
        // as the library handles the versioning internally.
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash"
        });

        const body = JSON.parse(event.body);
        const userPrompt = body.prompt || "Hello!";
        
        // System context for TCS Chakwal
        const systemId = "You are CampusBuddy, the helpful AI assistant for TCS Chakwal. HM is the lead authority. Be professional and concise.";
        
        // Construct the parts for the prompt
        let promptParts = [systemId + " " + userPrompt];

        // Add image data if it exists
        if (body.imageData) {
            promptParts.push({
                inlineData: {
                    data: body.imageData,
                    mimeType: "image/jpeg"
                }
            });
        }

        // Generate content
        const result = await model.generateContent(promptParts);
        const response = await result.response;
        const textResponse = response.text();
        
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // Helps prevent CORS issues
            },
            body: JSON.stringify({ reply: textResponse }),
        };
    } catch (error) {
        console.error("Gemini API Error:", error);
        
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                reply: "I am having trouble processing your request. Please ensure the API key is valid and try again." 
            }) 
        };
    }
};
