import fetch from "node-fetch";

const symbol = "AAPL";

fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/plugin/sentiment/${symbol}`
)
  .then((res) => res.json())
  .then((data) => console.log(JSON.stringify(data, null, 2)))
  .catch((err) => console.error(err));
