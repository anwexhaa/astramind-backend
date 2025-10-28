import fetch from "node-fetch";

const symbol = "AAPL";

fetch(`http://localhost:3001/plugin/sentiment/${symbol}`)
  .then((res) => res.json())
  .then((data) => console.log(JSON.stringify(data, null, 2)))
  .catch((err) => console.error(err));
