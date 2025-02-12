import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import JSZip from "jszip";

const FileUploader = ({ userId, refreshFiles }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const compressFile = async (file) => {
    const zip = new JSZip();
    zip.file(file.name, file);
    const compressedBlob = await zip.generateAsync({ type: "blob" });
    return new File([compressedBlob], `${file.name}.zip`, { type: "application/zip" });
  };

  const handleUpload = async () => {
    if (!file) {
        setMessage("❌ Please select a file");
        setTimeout(() => setMessage(""), 3000); // Hide message after 2 seconds
        return;
    }

    setUploading(true);
    setMessage(""); // Clear previous messages

    const fileType = file.type.split("/")[0]; // Get file category (image, video, text, etc.)
    let uploadFile = file;

    // Compress non-image files
    if (fileType !== "image") {
        uploadFile = await compressFile(file);
    }

    const filePath = `${userId}/${uploadFile.name}`;

    // Upload file to Supabase Storage
    const { error } = await supabase.storage.from("uploads").upload(filePath, uploadFile);

    if (error) {
        console.error("Upload error:", error);
        setMessage("❌ File upload failed!");
    } else {
        // Save file metadata in the database
        const { error: dbError } = await supabase.from("files").insert([
            {
                user_id: userId,
                title,
                description,
                file_url: filePath, // Store file path, not public URL
            },
        ]);

        if (dbError) {
            console.error("Database error:", dbError);
            setMessage("❌ Metadata saving failed!");
        } else {
            setMessage("✅ File uploaded successfully!");

            // Refresh file list after upload
            refreshFiles();

            // Reset input fields
            setFile(null);
            setTitle("");
            setDescription("");

            // Reset file input field visually
            document.getElementById("fileInput").value = "";
        }
    }
    setUploading(false);

    // Auto-hide message after 3 seconds
    setTimeout(() => setMessage(""), 2000);
};

  return (
    <div className="upload-container">
      <h2 className="upload-heading">Upload New File</h2>
      <input id="fileInput" type="file" onChange={handleFileChange} className="file-input" />
      <input 
        type="text" 
        placeholder="Enter file title" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        className="input-field"
      />
      <textarea 
        placeholder="Enter file description" 
        value={description} 
        onChange={(e) => setDescription(e.target.value)} 
        className="textarea-field"
      />
      <button onClick={handleUpload} disabled={uploading} className="upload-btn">
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {/* Display success or error message */}
      {message && <p className="status-message">{message}</p>}
    </div>
  );
};

export default FileUploader;
