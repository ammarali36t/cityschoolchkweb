const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const genAI = new GoogleGenerativeAI(process.env.AYAAN_API_KEY);
        // Use gemini-1.5-flash because it's the best for Vision + Speed
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are CampusBuddy for TCS Chakwal. You can see images. Help students solve problems, explain diagrams, and answer school queries professionally."
        });

        const { prompt, imageData } = JSON.parse(event.body);
        let payload = [prompt || "What is in this image?"];

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
            body: JSON.stringify({ reply: response.text() }),
        };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ reply: "AI Error: " + error.message }) };
    }
};
