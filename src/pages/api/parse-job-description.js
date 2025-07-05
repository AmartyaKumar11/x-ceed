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

      // Check if Python service is available
      try {
        const healthResponse = await fetch("http://localhost:8008/", {
          method: "GET",
          timeout: 5000
        });
      } catch (healthError) {
        return res.status(503).json({ 
          error: "Python backend service not available. Please start the job description service on port 8008.",
          details: "Run 'npm run job-desc-service' to start the Python backend."
        });
      }

      const response = await fetch("http://localhost:8008/parse-job-description", {
        method: "POST",
        body: formData,
        headers: formData.getHeaders(),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        return res.status(500).json({ 
          error: "Failed to parse backend response",
          details: "The Python service returned invalid JSON"
        });
      }

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.error || "Python service error",
          details: data.details || `HTTP ${response.status}`
        });
      }

      res.status(response.status).json(data);
    } catch (proxyErr) {
      console.error("Proxy error:", proxyErr);
      res.status(500).json({ 
        error: "Connection to Python service failed",
        details: proxyErr.message,
        suggestion: "Ensure the Python backend service is running on port 8008"
      });
    }
  });
} 