type Distortion = {
    text: string;
    type: string;
    question: string;
};

let typingTimeout: ReturnType<typeof setTimeout> | null = null;
const typingDelay = 2000; // 2-second delay before sending text for analysis

// Function to highlight distortions in the text
function highlightDistortions(distortions: Distortion[]) {
    distortions.forEach(distortion => {
        const range = document.createRange();
        const startNode = document.body.querySelector(`p:contains("${distortion.text}")`);  // Simplified, improve selector as needed
        if (startNode) {
            range.selectNodeContents(startNode);

            const span = document.createElement('span');
            span.style.backgroundColor = getDistortionColor(distortion.type);
            span.title = distortion.question;
            span.textContent = distortion.text;

            range.deleteContents();
            range.insertNode(span);
        }
    });
}

// Function to get color based on distortion type
function getDistortionColor(type: string): string {
    switch (type) {
        case 'Simple Deletion': return 'yellow';
        case 'Comparative Deletion': return 'orange';
        case 'Lack of Referential Index': return 'lightblue';
        case 'Unspecified Verb': return 'lightgreen';
        default: return 'gray';
    }
}

// Function to send the text to the background script for analysis
function analyzeText(text: string) {
    chrome.runtime.sendMessage({ action: "analyzeText", text }, (response) => {
        if (response.distortions) {
            highlightDistortions(response.distortions);
        }
    });
}

// Function to detect when the user stops typing
function handleTyping() {
    const paragraphs = document.querySelectorAll('p');
    const text = Array.from(paragraphs).map(p => p.textContent).join("\n");

    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    // Set a timeout to analyze the text after the user stops typing for 2 seconds
    typingTimeout = setTimeout(() => {
        analyzeText(text);
    }, typingDelay);
}

// Attach event listeners to monitor typing activity
document.addEventListener('input', handleTyping);