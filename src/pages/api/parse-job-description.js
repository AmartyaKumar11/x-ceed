export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const formidable = require("formidable");
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "File upload error" });
    }
    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Use the correct property depending on formidable version
    const filePath = file.filepath || file.path;
    const fileName = file.originalFilename || file.name;

    if (!filePath) {
      return res.status(500).json({ error: "File path not found in upload" });
    }

    try {
      const fs = require("fs");
      const fetch = require("node-fetch");
      const FormData = require("form-data");
      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath), fileName);

      const response = await fetch("http://localhost:8008/parse-job-description", {
        method: "POST",
        body: formData,
        headers: formData.getHeaders(),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        return res.status(500).json({ error: "Failed to parse backend response" });
      }

      res.status(response.status).json(data);
    } catch (proxyErr) {
      res.status(500).json({ error: "Proxy error: " + proxyErr.message });
    }
  });
} 