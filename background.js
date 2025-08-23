const response = await fetch("https://your-app.vercel.app/api/grammar", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: selectedText })
});

const result = await response.json();
const fixed = result?.corrected;
