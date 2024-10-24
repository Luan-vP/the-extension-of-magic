chrome.runtime.onMessage.addListener((request: { action: string; text: string }, sender, sendResponse) => {
    if (request.action === "analyzeText") {
        chrome.storage.local.get('apiKey', (data: { apiKey: string }) => {
            if (!data.apiKey) {
                sendResponse({ error: "API key not found" });
                return;
            }

            // Add LLM prompt here
            const prompt = `Analyze the following text for linguistic distortions (Simple Deletions, Comparative Deletions, Lack of Referential Index, Unspecified Verbs). 
                            Provide the text fragment, distortion type, and a clarifying question.\n\n${request.text}`;

            fetch('https://api.openai.com/v1/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.apiKey}`
                },
                body: JSON.stringify({
                    model: "text-davinci-003",
                    prompt,
                    max_tokens: 500
                })
            })
            .then(response => response.json())
            .then(data => {
                const distortions = parseDistortions(data.choices[0].text);
                sendResponse({ distortions });
            });
        });

        return true;  // Keeps the connection open for async response
    }
});

// Helper function to parse LLM's response
function parseDistortions(responseText: string): Array<{ text: string; type: string; question: string }> {
    const distortions: Array<{ text: string; type: string; question: string }> = [];
    const lines = responseText.split("\n");

    lines.forEach(line => {
        const [text, type, question] = line.split(" - ");
        if (text && type && question) {
            distortions.push({ text: text.trim(), type: type.trim(), question: question.trim() });
        }
    });

    return distortions;
}