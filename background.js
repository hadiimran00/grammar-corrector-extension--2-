// background.js

// Create the context menu when extension installs
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "fixGrammar",
    title: "Fix Grammar with Gemini",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
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

    // Send message directly (content.js already injected from manifest.json)
    chrome.tabs.sendMessage(tab.id, {
      action: "replaceSelectedText",
      fixedText: fixed
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending to content.js:", chrome.runtime.lastError.message);
      }
    });

  } catch (err) {
    console.error("Error calling grammar API:", err);
  }
});
