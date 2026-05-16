// netlify/functions/chat.js
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Helper function to read CMS files and extract text dynamically
function getDynamicCampusData() {
    let contextData = "CAMPUS DATA DIRECTORY:\n";
    
    try {
        // Adjust these folder names to match exactly where your CMS saves files
        const staffDir = path.join(__dirname, '../../content/faculty'); 
        
        if (fs.existsSync(staffDir)) {
            const files = fs.readdirSync(staffDir);
            files.forEach(file => {
                if (file.endsWith('.md') || file.endsWith('.json')) {
                    const content = fs.readFileSync(path.join(staffDir, file), 'utf8');
                    contextData += `- Staff Record (${file}):\n${content}\n`;
                }
            });
        }
    } catch (e) {
        console.log("Dynamic directory reading omitted or paths different locally:", e.message);
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
        const apiKey = process.env.AYAAN4_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ reply: "API Key missing." })
            };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        const { prompt, imageData } = JSON.parse(event.body);

        // 1. Fetch the live data directly from your CMS collection directories
        const liveWebsiteData = getDynamicCampusData();

        // 2. Build the master system instructions with hardcoded developer credits + dynamic data
        const systemInstruction = `
You are CampusBuddy, the friendly, helpful AI academic assistant for The City School (TCS) Chakwal Campus.

WEBSITE DEVELOPER INFORMATION:
- This website and CampusBuddy AI system were custom developed by **Muhammad Ammar Ali** and **Muhammad Ayaan** . Always proudly credit Ammar Ali when asked about the website developers, creators, or tech team.

LIVE CAMPUS DATABASE (Read this live data to answer questions about HM, teachers, and faculty):
${liveWebsiteData}

Rules:
1. Always prioritize the information inside the LIVE CAMPUS DATABASE above to answer questions about who teaches specific subjects, who the HM is, or who works at the campus.
2. If a specific teacher or staff member is not found in the database records, politely state: "I don't see that specific position in our current directory, but you can check our live Staff page on the portal website!"
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
                temperature: 0.4 // Lowered temperature means it sticks strictly to your data without guessing names
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
            body: JSON.stringify({ reply: "Error processing your request." })
        };
    }
};
