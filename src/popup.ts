// Function to save the API key
document.getElementById('saveKey')?.addEventListener('click', () => {
    const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value;
    chrome.storage.local.set({ apiKey }, () => {
        alert('API key saved successfully!');
    });
});

// Function to prefill the input if API key is already saved
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get('apiKey', (data: { apiKey: string }) => {
        if (data.apiKey) {
            (document.getElementById('apiKey') as HTMLInputElement).value = data.apiKey;
        }
    });
});