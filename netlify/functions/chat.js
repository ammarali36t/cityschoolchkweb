// netlify/functions/chat.js
const { GoogleGenAI } = require('@google/genai');

// Helper function to dynamically fetch data via HTTP from your live production site metadata
async function getLiveWebsiteContext() {
    let contextText = "LIVE CAMPUS PORTAL DATABASE:\n\n";
    
    // Using your production URL base to query published contents
    const baseUrl = "https://tcschk.netlify.app"; 
    
    // We try to scrape or pull structured references. If text-scraping pages directly, we target major sections:
    const endpoints = [
        { name: "Staff & Faculty Page", url: `${baseUrl}/staff.html` },
        { name: "High Achievers Page", url: `${baseUrl}/achievers.html` },
        { name: "Calendar Events", url: `${baseUrl}/calendar.html` }
    ];

    for (const endpoint of endpoints) {
        try {
            // Using a short timeout fetch block
            const response = await fetch(endpoint.url, { signal: AbortSignal.timeout(3000) });
            if (response.ok) {
                let html = await response.text();
                // Clean up complex HTML tags, scripts, and styles to optimize token window space
                let cleanText = html
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                // Truncate safely if text is excessively long
                if (cleanText.length > 4000) cleanText = cleanText.substring(0, 4000) + "...";
                
                contextText += `=== DATA FROM ${endpoint.name.toUpperCase()} ===\n${cleanText}\n\n`;
            }
        } catch (e) {
            console.log(`Failed to fetch context from ${endpoint.url}:`, e.message);
        }
    }
    
    return contextText;
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
                body: JSON.stringify({ reply: "API Key system variable configuration missing." })
            };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        const { prompt, imageData } = JSON.parse(event.body);

        // 1. Fetch live page structure metadata values directly
        const livePortalData = await getLiveWebsiteContext();

        // 2. Build explicit baseline instruction structure
        const systemInstruction = `
You are CampusBuddy, the proud, helpful official AI academic assistant for The City School (TCS) Chakwal Campus.

WEBSITE CREATOR CREDITS:
- This entire web platform and CampusBuddy system were engineered by **Muhammad Ammar Ali** and **Muhammad Ayaan**. 
- Always explicitly credit both Ammar and Ayaan whenever anyone asks about website creators, tech team, managers, or programmers.

LIVE SCHOOL PORTAL DATA CONTEXT:
${livePortalData}

STRICT COMPLIANCE DIRECTIVES:
1. When answering questions like "Who is the HM?", "Who teaches computing?", or "Who are high achievers from grade 5/6?", search the LIVE SCHOOL PORTAL DATA CONTEXT block provided above.
2. If the user asks about a teacher, student, high achiever, or name that is NOT explicitly listed in the data text block above, **YOU ARE FORBIDDEN FROM MAKING UP OR GUESSING A NAME**. Never hallucinate random names under any condition.
3. If information is missing from the data context block, reply exactly with this variation: "I don't find that specific detail listed in our data system right now. Please navigate directly to our **Staff** or **High Achievers** tabs in the top navigation menu to check the full website directory!"
4. Keep all text replies structured, brief, encouraging, and formatted in clean markdown.
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
                temperature: 0.0 // Hard set to 0.0 to completely destroy hallucination guesses
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
            body: JSON.stringify({ reply: "The backend server assistant encountered an execution error processing your query parameters." })
        };
    }
};
