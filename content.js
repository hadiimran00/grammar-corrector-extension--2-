console.log("✅ content.js ready");

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  // handshake
  if (req.ping) {
    sendResponse({ pong: true });
    return true;
  }

  if (req.action !== "replaceSelectedText") return;

  const fixedText = req.fixedText;

  // Special handling for WhatsApp Web (run this FIRST)
  const waInput = document.querySelector('[contenteditable="true"][data-tab="10"][role="textbox"]');
  if (waInput) {
    console.log("⚡ Detected WhatsApp input box");

    // Clear old text
    waInput.innerHTML = "";

    // Select all text inside the box
    const range = document.createRange();
    range.selectNodeContents(waInput);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // Try WhatsApp's preferred method
    const execSuccess = document.execCommand("insertText", false, fixedText);

    // Fallback if execCommand fails
    if (!execSuccess) {
      waInput.innerText = fixedText;
    }

    // Dispatch input event so WhatsApp re-renders the box
    waInput.dispatchEvent(new InputEvent("input", { bubbles: true }));

    sendResponse({ success: true, replaced: "whatsapp" });
    return true;
  }

  const active = document.activeElement;

  // Case 1: Rich text editors
  if (active && active.isContentEditable) {
    active.innerHTML = "";
    const span = document.createElement("span");
    span.innerText = fixedText;
    active.appendChild(span);
    active.dispatchEvent(new InputEvent("input", { bubbles: true }));
    sendResponse({ success: true });
    return true;
  }

  // Case 2: Inputs & textareas
  if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) {
    active.value = fixedText;
    active.dispatchEvent(new Event("input", { bubbles: true }));
    sendResponse({ success: true });
    return true;
  }

  // Case 3: Selection fallback
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(fixedText));
    sendResponse({ success: true });
    return true;
  }

  sendResponse({ success: false, error: "No valid target" });
  return true;
});