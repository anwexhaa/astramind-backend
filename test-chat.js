// test-chat.js
import fetch from "node-fetch";

const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`
, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "Compare the most recent reports and tell me which looks stronger for investment."
  })
});

console.log(await response.text());
