chrome.runtime.onMessage.addListener((request: { action: string; text: string }, sender, sendResponse) => {
    if (request.action === "analyzeText") {
        chrome.storage.local.get('apiKey', (data: { apiKey: string }) => {
            if (!data.apiKey) {
                sendResponse({ error: "API key not found" });
                return;
            }

            // Add LLM prompt here
            const prompt = `## Task Overview\n\n` +
                `In the following task, you'll be asked to identify instances of language deletions from a text. ` +
                `There are four specific types of deletions, each described below. Your goal is to recognize these ` +
                `types of deletions in a sentence and, if found, point them out along with any missing information ` +
                `that might be relevant.\n\n` +
                `### Types of Deletions\n\n` +
                `1. **Simple Deletion:**\n` +
                `   - This occurs when a sentence leaves out important information that could provide clarity. ` +
                `Look for sentences where key details (such as “who,” “what,” “how,” “where,” or “why”) are missing.\n` +
                `   - **Example:**\n` +
                `     - **Sentence:** “I'm frustrated.”\n` +
                `     - **Missing information:** What is causing the frustration?\n` +
                `     - **Question to ask:** “Frustrated about what?”\n\n` +
                `2. **Comparative Deletion:**\n` +
                `   - This happens when a comparison is made but what it is being compared to is not stated. ` +
                `You'll find words like “better,” “worse,” “more,” “less,” “faster,” or “slower,” but without stating ` +
                `what it's being compared to.\n` +
                `   - **Example:**\n` +
                `     - **Sentence:** “She is smarter.”\n` +
                `     - **Missing information:** Smarter than whom?\n` +
                `     - **Question to ask:** “Smarter than whom, or compared to what?”\n\n` +
                `3. **Lack of Referential Index:**\n` +
                `   - A lack of referential index occurs when the sentence includes a vague reference, like “they,” ` +
                `“it,” or “everyone,” without specifying who or what is being referred to. The sentence lacks clarity ` +
                `because the subject is not defined.\n` +
                `   - **Example:**\n` +
                `     - **Sentence:** “They say it's wrong.”\n` +
                `     - **Missing information:** Who are “they”? What is “it” referring to?\n` +
                `     - **Question to ask:** “Who specifically says this?” or “What exactly is 'it'?”\n\n` +
                `4. **Unspecified Verbs:**\n` +
                `   - This occurs when a verb used in a sentence does not explain exactly how the action is being done. ` +
                `Look for verbs that are vague and need more specificity.\n` +
                `   - **Example:**\n` +
                `     - **Sentence:** “She improved.”\n` +
                `     - **Missing information:** How did she improve? What specific action did she take to improve?\n` +
                `     - **Question to ask:** “How specifically did she improve?”\n\n` +
                `## Task\n\n` +
                `For each sentence you analyze, identify the type of deletion (if any) and provide a clarifying question ` +
                `that could help recover the missing information.\n\n` +
                `### Example Analysis\n\n` +
                `- **Input Sentence:** “I'm doing better.”\n` +
                `  - **Deletion Type:** Comparative Deletion\n` +
                `  - **Clarifying Question:** “Better than what or whom?”\n\n` +
                `- **Input Sentence:** “They don't care about my opinion.”\n` +
                `  - **Deletion Type:** Lack of Referential Index\n` +
                `  - **Clarifying Question:** “Who specifically doesn't care?”\n\n` +
                ` Task test: ` +
                `${request.text}`;

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
                console.log('API Response:', data);
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