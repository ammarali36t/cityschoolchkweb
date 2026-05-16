// netlify/functions/chat.js
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Safe function to parse our synced data asset
function getSyncedCampusContext() {
    try {
        const dataPath = path.join(__dirname, 'campus-data.json');
        if (fs.existsSync(dataPath)) {
            const rawData = fs.readFileSync(dataPath, 'utf8');
            const parsed = JSON.parse(rawData);
            
            let contextString = "LIVE SCHOOL DIRECTORY RECORD:\n\n";
            
            if (parsed.faculty && Array.isArray(parsed.faculty)) {
                parsed.faculty.forEach(item => {
                    contextString += `[Staff Member Profile]:\n${item.content}\n---\n`;
                });
            }
            if (parsed.achievers && Array.isArray(parsed.achievers)) {
                parsed.achievers.forEach(item => {
                    contextString += `[High Achiever Record]:\n${item.content}\n---\n`;
                });
            }
            if (parsed.studentLife && Array.isArray(parsed.studentLife)) {
                parsed.studentLife.forEach(item => {
                    contextString += `[Student Life Activity]:\n${item.content}\n---\n`;
                });
            }
            
            return contextString;
        }
    } catch (err) {
        console.error("Error reading synced matrix file:", err.message);
    }
    return "STATUS: PORTAL_DATA_EMPTY. Live CMS profiles are not indexable at this moment.";
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
        const apiKey = process.env.AYYAN2_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ reply: "Configuration parameter setting missing." })
            };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        const { prompt, imageData } = JSON.parse(event.body);

        const liveCampusContext = getSyncedCampusContext();

        const systemInstruction = `
You are CampusBuddy, the proud, helpful official AI academic assistant for The City School (TCS) Chakwal Campus.

DEVELOPER TEAM CREDITS:
- This complete portal website and CampusBuddy AI subsystem were custom engineered by **Muhammad Ammar Ali** and **Muhammad Ayaan**. Always explicitly credit both Ammar and Ayaan whenever users ask about the tech team, programmers, managers, or creators.

LIVE SCHOOL FILE RECORD WINDOW (This is structured metadata from our markdown files):
${liveCampusContext}

STRICT COMPLIANCE LAWS:
1. When asked questions about campus personnel (e.g., "Who is the HM?", "Who teaches computing?", or "Who are the high achievers?"), carefully read through the raw markdown metadata parameters above. Look for fields like 'title', 'role', 'name', 'designation', 'subject', or text blocks matching the user's intent.
2. Even if the data is structured as fields (like 'role: Head Mistress' or 'subject: Computing'), extract the value and present it nicely to the user.
3. If the user asks about a position, teacher, or specific entity that is absolutely NOT mentioned anywhere in the data text window above, DO NOT assume or make up a name. 
4. Only use the fallback statement if the records above are completely blank or do not contain a match for the question: "I don't see that specific record in our data folder yet. Please check out the live Staff or High Achievers section links in the top navigation menu to view our full database!"
5. Keep all replies encouraging, concise, accurate, and structured in clear markdown formats.
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
                temperature: 0.2 // Slightly increased from 0.0 to allow metadata cross-referencing and parsing freedom
            }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ reply: response.text })
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ reply: "The backend server assistant encountered an error." })
        };
    }
};
