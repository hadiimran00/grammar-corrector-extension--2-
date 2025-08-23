console.log("Content script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);

  if (request.action === "replaceSelectedText") {
    const fixedText = request.fixedText;
    const active = document.activeElement;

    // Format helper (paragraphs + line breaks preserved)
    function formatTextToHTML(text) {
      return text
        // Split into paragraphs by 2+ newlines
        .split(/\n\s*\n+/)
        .map(paragraph =>
          paragraph
            .split("\n")
            .map(line => line.trim())
            .join("<br>")
        )
        .map(p => `<p>${p}</p>`)
        .join("");
    }

    const formattedHTML = formatTextToHTML(fixedText);

    // ✅ CASE 1: Rich text editors (WhatsApp, Messenger, LinkedIn, Gmail, Notion, etc.)
    if (active && active.isContentEditable) {
      console.log("Replacing inside contentEditable element (rich text editor).");

      // Replace content with plain text span (to avoid weird <br><div> issues)
      active.innerHTML = "";
      const span = document.createElement("span");
      span.innerText = fixedText;
      active.appendChild(span);

      // Trigger React/Lexical update so app detects change
      const event = new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: fixedText
      });
      active.dispatchEvent(event);

      sendResponse({ success: true });
      return;
    }

    // ✅ CASE 2: Textareas / input fields
    if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) {
      console.log("Replacing inside textarea/input.");
      active.value = fixedText;

      // Fire event so frameworks (React/Vue/etc.) detect change
      const event = new Event("input", { bubbles: true });
      active.dispatchEvent(event);

      sendResponse({ success: true });
      return;
    }

    // ✅ CASE 3: Fallback → replace text at current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      console.log("Fallback: replacing selection directly.");
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = formattedHTML;
      const frag = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        frag.appendChild(tempDiv.firstChild);
      }
      range.insertNode(frag);

      sendResponse({ success: true });
      return;
    }

    // ❌ If nothing matched
    sendResponse({ success: false, error: "No valid target for replacement" });
  }
});
