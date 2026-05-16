// netlify/functions/chat.js
const { GoogleGenAI } = require('@google/genai');

exports.handler = async (event, context) => {
    // Enable CORS so your front-end can communicate smoothly
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight OPTIONS requests
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers, 
            body: JSON.stringify({ error: 'Method Not Allowed' }) 
        };
    }

    try {
        // 1. Initialize the SDK using your custom Netlify environment variable name
        const apiKey = process.env.AYYAN2_API_KEY;
        
        if (!apiKey) {
            console.error("Configuration Error: AYYAN2_API_KEY is missing in Netlify settings.");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ reply: "Backend setup error: API key missing from server environment." })
            };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        // 2. Parse the payload parameters sent from buddy.html
        const { prompt, imageData } = JSON.parse(event.body);
        
        // CampusBuddy structural personality grounding rule
        const systemInstruction = "You are CampusBuddy, the friendly, helpful AI academic assistant for The City School (TCS) Chakwal Campus. Provide concise, polite, and clean markdown answers to students and parents.";

        // 3. Assemble the content payload array
        const contents = [];

        // If an image was uploaded from the UI, format it for the vision pipeline
        if (imageData) {
            contents.push({
                inlineData: {
                    mimeType: "image/jpeg",
                    data: imageData
                }
            });
        }

        // Add the text prompt to the contents sequence array
        contents.push(prompt || "Analyze this image.");

        // 4. Generate the response using the multimodal flash model execution method
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7
            }
        });

        // 5. Return the text reply payload back to your front-end interface
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ reply: response.text })
        };

    } catch (error) {
        console.error("Runtime exception processed:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ reply: "I ran into an issue processing that payload on my backend server function." })
        };
    }
};
