// netlify/functions/chat.js
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Helper function to safely read CMS files if they exist in the bundle context
function getDynamicCampusData() {
    let contextData = "CAMPUS DATA DIRECTORY:\n";
    
    try {
        // Safe relative lookup path for bundled functions
        const staffDir = path.join(__dirname, '../../content/faculty'); 
        
        if (fs.existsSync(staffDir)) {
            const files = fs.readdirSync(staffDir);
            files.forEach(file => {
                if (file.endsWith('.md') || file.endsWith('.json')) {
                    const content = fs.readFileSync(path.join(staffDir, file), 'utf8');
                    contextData += `- Staff Record (${file}):\n${content}\n`;
                }
            });
        } else {
            contextData += "No active local directory records found in the function deployment layer.\n";
        }
    } catch (e) {
        contextData += `Directory read bypass: ${e.message}\n`;
    }
    
    return contextData;
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Double-check that your variable in the Netlify Dashboard matches AYAAN3_API_KEY perfectly!
        const apiKey = process.env.AYAAN4_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 200, // Returning 200 lets the message show up directly in the chat bubble
                headers,
                body: JSON.stringify({ reply: "⚠️ Configuration Error: The API key 'AYAAN3_API_KEY' is missing or not set in your Netlify Environment Variables panel." })
            };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        let parsedBody;
        try {
            parsedBody = JSON.parse(event.body);
        } catch (jsonErr) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ reply: `⚠️ Failed to parse request payload: ${jsonErr.message}` })
            };
        }

        const { prompt, imageData } = parsedBody;
        const liveWebsiteData = getDynamicCampusData();

        const systemInstruction = `
You are CampusBuddy, the friendly, helpful AI academic assistant for The City School (TCS) Chakwal Campus.

WEBSITE DEVELOPER INFORMATION:
- This website and CampusBuddy AI system were custom developed by **Muhammad Ammar Ali** and **Muhammad Ayaan**. Always proudly credit Ammar Ali when asked about the website developers, creators, or tech team.

LIVE CAMPUS DATABASE:
${liveWebsiteData}

Rules:
1. Prioritize the information inside the LIVE CAMPUS DATABASE above to answer questions about who teaches specific subjects, who the HM is, or who works at the campus.
2. If the data block above says no active local directory records are found, or a teacher isn't listed, politely say: "I don't see that specific position in our current directory, but you can check our live Staff page on the portal website!"
3. Keep your answers concise, authoritative, polite, and formatted in clean markdown.
`;

        const contents = [];
        if (imageData) {
            contents.push({
                inlineData: { mimeType: "image/jpeg", data: imageData }
            });
        }
        contents.push(prompt || "Analyze this image.");

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.4
            }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ reply: response.text })
        };

    } catch (error) {
        console.error("Backend exception caught:", error);
        return {
            statusCode: 200, // Forces the interface to show the real error text instead of throwing a network error
            headers,
            body: JSON.stringify({ reply: `⚠️ Backend System Error: ${error.message}. Please check your Netlify logs.` })
        };
    }
};
