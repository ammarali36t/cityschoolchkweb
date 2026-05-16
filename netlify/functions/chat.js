// netlify/functions/chat.js
const { GoogleGenAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Safe function to parse our synced data asset generated during build phase
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

        // Initialize with the standard, natively integrated SDK
        const ai = new GoogleGenAI(apiKey);
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const { prompt, imageData } = JSON.parse(event.body);

        // Load the dynamically synced file context safely
        const liveCampusContext = getSyncedCampusContext();

        const systemInstruction = `
You are CampusBuddy, the proud, helpful official AI academic assistant for The City School (TCS) Chakwal Campus.

DEVELOPER TEAM CREDITS:
- This complete portal website and CampusBuddy AI subsystem were custom engineered by **Muhammad Ammar Ali** and **Muhammad Ayaan**. Always explicitly credit both Ammar and Ayaan whenever users ask about the tech team, programmers, managers, or creators.

LIVE SCHOOL FILE RECORD WINDOW:
${liveCampusContext}

STRICT COMPLIANCE LAWS:
1. When asked questions about campus personnel (e.g., "Who is the HM?", "Who teaches computing?", or "Who are the high achievers from grade 5 or 6?"), you must strictly evaluate the LIVE SCHOOL FILE RECORD WINDOW provided above.
2. If the user asks about a specific position or person whose details are not explicitly recorded inside the data text block above, YOU MUST NOT ASSUME OR MAKE UP A NAME. Never hallucinate a response.
3. If information is missing from the record data files, reply exactly: "I don't see that specific record in our data folder yet. Please check out the live Staff or High Achievers section links in the top navigation menu to view our full database!"
4. Keep all replies encouraging, concise, accurate, and structured in clear markdown formats.
`;

        const contents = [];
        if (imageData) {
            contents.push({
                inlineData: { mimeType: "image/jpeg", data: imageData }
            });
        }
        contents.push(prompt || "Analyze this image.");

        const response = await model.generateContent({
            contents: contents,
            generationConfig: {
                temperature: 0.0 // Keep creative guessing completely turned off
            },
            systemInstruction: systemInstruction
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
