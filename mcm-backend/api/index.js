import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure Supabase environment variables are set
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Root route
app.get("/", (req, res) => {
  res.send("MCM Backend is running!");
});

// API route to upload homework
app.post("/api/upload/homework", upload.single("file"), async (req, res) => {
  try {
    const { class_id, term, week } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded!" });
    }

    const filePath = `homework/${class_id}/${term}/${week}/${file.originalname}`;
    const { data, error } = await supabase.storage
      .from("homework")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    const fileUrl = `${supabaseUrl}/storage/v1/object/public/homework/${filePath}`;

    // Insert into homework table
    const { data: dbData, error: dbError } = await supabase
      .from("homework")
      .insert([{ class_id, term, week, file_url: fileUrl }]);

    if (dbError) throw dbError;

    res.json({ message: "Homework uploaded successfully!", fileUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route to upload resources
app.post("/api/upload/resource", upload.single("file"), async (req, res) => {
  try {
    const { class_id, topic } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded!" });
    }

    const filePath = `resources/${class_id}/${topic}/${file.originalname}`;
    const { data, error } = await supabase.storage
      .from("resources")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    const fileUrl = `${supabaseUrl}/storage/v1/object/public/resources/${filePath}`;

    // Insert into resources table
    const { data: dbData, error: dbError } = await supabase
      .from("resources")
      .insert([{ class_id, topic, file_url: fileUrl }]);

    if (dbError) throw dbError;

    res.json({ message: "Resource uploaded successfully!", fileUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
