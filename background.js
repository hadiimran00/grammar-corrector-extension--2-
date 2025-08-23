chrome.contextMenus.onClicked.addListener((info, tab) => {
  (async () => {
    try {
      const response = await fetch("https://grammar-corrector-extension-2.vercel.app/api/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: info.selectionText })
      });

      const result = await response.json();
      const fixed = result?.corrected;

      if (!fixed) return;

      chrome.tabs.sendMessage(tab.id, {
        action: "replaceSelectedText",
        fixedText: fixed
      });
    } catch (err) {
      console.error("Error calling grammar API:", err);
    }
  })();
});
