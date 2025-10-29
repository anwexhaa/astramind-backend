import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";

const form = new FormData();
form.append("file", fs.createReadStream("C:/Users/Anwesha Das/Downloads/sample-local-pdf.pdf"));

fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analyze`
, { method: "POST", body: form })
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
