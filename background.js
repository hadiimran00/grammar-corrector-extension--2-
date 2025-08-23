// background.js

// Create the context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "fixGrammar",
    title: "Fix Grammar with Gemini",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  (async () => {
    try {
      const selectedText = info.selectionText;

      // Call your Vercel middleware API
      const response = await fetch("https://grammar-corrector-extension-2.vercel.app/api/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText })
      });

      const result = await response.json();
      const fixed = result?.corrected?.trim();

      console.log("Grammar API result:", result);

      if (!fixed) {
        console.warn("No corrected text returned.");
        return;
      }

      // Try sending to content.js
      chrome.tabs.sendMessage(tab.id, {
        action: "replaceSelectedText",
        fixedText: fixed
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Content script not available, injecting manually...");

          // Inject content.js if it’s not ready
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
          }, () => {
            // Retry after injection
            chrome.tabs.sendMessage(tab.id, {
              action: "replaceSelectedText",
              fixedText: fixed
            });
          });
        }
      });

    } catch (err) {
      console.error("Error calling grammar API:", err);
    }
  })();
});
