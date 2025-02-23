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
        setTimeout(() => setMessage(""), 3000);
        return;
    }

    setUploading(true);
    setMessage("");

    const fileType = file.type.split("/")[0];
    let uploadFile = file;

    if (fileType !== "image") {
        uploadFile = await compressFile(file);
    }

    const filePath = `${userId}/${uploadFile.name}`;

    const { error } = await supabase.storage.from("uploads").upload(filePath, uploadFile);

    if (error) {
        console.error("Upload error:", error);
        setMessage("❌ File upload failed!");
    } else {
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
            refreshFiles();
            setFile(null);
            setTitle("");
            setDescription("");
            document.getElementById("fileInput").value = "";
        }
    }
    setUploading(false);

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

      {message && <p className="status-message">{message}</p>}
    </div>
  );
};

export default FileUploader;
