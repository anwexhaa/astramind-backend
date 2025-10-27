// test.js
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

const pdfPath = process.argv[2] || "./sample.pdf";

if (!fs.existsSync(pdfPath)) {
  console.error("PDF file not found:", pdfPath);
  process.exit(1);
}

const form = new FormData();
form.append("file", fs.createReadStream(pdfPath)); // matches backend's upload.single("file")

const URL = "http://localhost:3001/analyze";

(async () => {
  try {
    const response = await axios.post(URL, form, { headers: form.getHeaders() });
    console.log("Response from server:", response.data);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
})();
