console.log("Content script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);

  if (request.action === "replaceSelectedText") {
    const fixedText = request.fixedText;
    const active = document.activeElement;

    // Format for HTML editors
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
    // Wrap paragraphs with <p> for consistent spacing
    .map(p => `<p>${p}</p>`)
    .join("");
}

const formattedHTML = formatTextToHTML(fixedText);



    // CASE 1: WhatsApp / Messenger / LinkedIn (Lexical/Draft.js editors)
    if (active && active.isContentEditable && active.dataset.lexicalEditor !== undefined) {
      console.log("Replacing inside Lexical editor (WhatsApp/Messenger/LinkedIn).");

      active.innerHTML = "";
      const span = document.createElement("span");
      span.innerText = fixedText;
      active.appendChild(span);

      // Trigger React/Lexical update
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

    // CASE 2: Standard contentEditable (Gmail, Outlook, Notion, etc.)
    if (active && active.isContentEditable) {
      console.log("Replacing inside standard contentEditable element.");
      active.innerHTML = formattedHTML;
      sendResponse({ success: true });
      return;
    }

    // CASE 3: Textarea / input
    if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) {
      console.log("Replacing inside textarea/input.");
      active.value = fixedText;

      // Dispatch input event so frameworks detect change
      const event = new Event("input", { bubbles: true });
      active.dispatchEvent(event);

      sendResponse({ success: true });
      return;
    }

    // CASE 4: Fallback → replace via selection (rare case)
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

    sendResponse({ success: false, error: "No valid target for replacement" });
  }
});
