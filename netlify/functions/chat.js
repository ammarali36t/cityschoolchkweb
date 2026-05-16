// netlify/functions/chat.js
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

// Helper function to dynamically pull your raw repository data folders 
function getLocalCampusData() {
    let contextData = "CAMPUS DATA DIRECTORY FILES:\n\n";
    
    // Map out the folders from your repository layout
    const collections = [
        { name: "FACULTY & STAFF", folderName: "faculty" },
        { name: "HIGH ACHIEVERS", folderName: "achievers" },
        { name: "GALLERY AND MEDIA", folderName: "gallery" },
        { name: "STUDENT LIFE HIGHLIGHTS", folderName: "student-life" }
    ];

    collections.forEach(collection => {
        // Evaluate the absolute process root where Netlify checks out your git files
        const dataPath = path.resolve(process.cwd(), 'content', collection.folderName);
        
        if (fs.existsSync(dataPath)) {
            try {
                const files = fs.readdirSync(dataPath);
                contextData += `=== COLLECTION: ${collection.name} ===\n`;
                
                files.forEach(file => {
                    if (file.endsWith('.md') || file.endsWith('.json') || file.endsWith('.yml')) {
                        const filePath = path.join(dataPath, file);
                        const fileContent = fs.readFileSync(filePath, 'utf8');
                        contextData += `[File: ${file}]\n${fileContent}\n`;
                    }
                });
                contextData += `\n`;
            } catch (err) {
                console.error(`Error processing ${collection.folderName}:`, err.message);
            }
        }
    });

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
        const apiKey = process.env.AYYAN2_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ reply: "API Key variable missing." })
            };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        const { prompt, imageData } = JSON.parse(event.body);

        // 1. Gather files directly from your workspace folder tracks
        const campusContext = getLocalCampusData();

        // 2. Build explicit instructions layout
        const systemInstruction = `
You are CampusBuddy, the friendly, helpful official AI academic assistant for The City School (TCS) Chakwal Campus.

DEVELOPER TEAM CREDITS:
- This portal and CampusBuddy AI platform were custom developed by **Muhammad Ammar Ali** and **Muhammad Ayaan**. Always credit both developers explicitly when asked about the tech team, programmers, or creators.

LIVE SCHOOL FILE RECORD WINDOW:
${campusContext}

STRICT EXECUTION LAWS:
1. When asked about names (e.g., who the HM is, who teaches computing, high achievers from specific grades), search the LIVE SCHOOL FILE RECORD WINDOW above.
2. If a specific teacher name or role cannot be found in the text files provided above, **YOU ARE FORBIDDEN FROM MAKING UP OR GUESSING A NAME**. Never hallucinate names.
3. If information is missing from the record files, reply exactly: "I don't see that specific entry in our staff folders yet. You can look through our live **Staff** or **High Achievers** tabs on the website menu above to find our complete directory list!"
4. Keep answers brief, accurate, encouraging, and formatted with clean Markdown.
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
                temperature: 0.0 // Set to zero to prevent fake name generation
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
