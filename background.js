// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "fixGrammar",
    title: "Fix Grammar with Gemini",
    contexts: ["selection"]
  });
});

// Helper: send message reliably with retries
function sendMessageWithRetry(tabId, msg, retries = 5) {
  return new Promise((resolve, reject) => {
    function attempt(n) {
      chrome.tabs.sendMessage(tabId, msg, (res) => {
        if (chrome.runtime.lastError || !res) {
          if (n > 0) {
            console.warn("Retrying message, attempts left:", n);
            setTimeout(() => attempt(n - 1), 200); // wait 200ms then retry
          } else {
            reject(chrome.runtime.lastError);
          }
        } else {
          resolve(res);
        }
      });
    }
    attempt(retries);
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    const selectedText = info.selectionText;
    if (!selectedText) return;

    if (!/^https?:|^file:/.test(tab.url)) {
      console.warn("Skipping unsupported page:", tab.url);
      return;
    }

    // Call API
    const response = await fetch("https://grammar-corrector-extension-2.vercel.app/api/grammar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: selectedText })
    });

    const result = await response.json();
    const fixed = result?.corrected?.trim();
    if (!fixed) return;

    // Try ping → if fails, inject content.js
    chrome.tabs.sendMessage(tab.id, { ping: true }, async (res) => {
      if (chrome.runtime.lastError || !res?.pong) {
        console.warn("Injecting content.js...");
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });

        // Now retry with handshake and replacement
        await sendMessageWithRetry(tab.id, {
          action: "replaceSelectedText",
          fixedText: fixed,
          originalText: selectedText
        });
      } else {
        // Content script is alive, send replacement
        await sendMessageWithRetry(tab.id, {
          action: "replaceSelectedText",
          fixedText: fixed,
          originalText: selectedText
        });
      }
    });
  } catch (err) {
    console.error("Error in background.js:", err);
  }
});