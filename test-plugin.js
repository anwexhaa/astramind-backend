import fetch from "node-fetch";

const symbol = "AAPL"; // try TSLA or MSFT too

fetch(`http://localhost:3001/plugin/stock/${symbol}`)
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
