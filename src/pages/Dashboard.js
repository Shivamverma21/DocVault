import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import FileUploader from "../components/FileUploader";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchFiles(data.user.id);
      } else {
        navigate("/");
      }
    };
    getUser();
  }, [navigate]);

  const fetchFiles = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase.from("files").select("*").eq("user_id", userId);

    if (!error) {
      const filesWithUrls = data.map((file) => ({
        ...file,
        publicUrl: supabase.storage.from("uploads").getPublicUrl(file.file_url).data.publicUrl,
      }));
      setFiles(filesWithUrls);
    } else {
      console.error("Error fetching files:", error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (fileId, filePath) => {
    setMessage(""); // Clear previous messages

    const { error: storageError } = await supabase.storage.from("uploads").remove([filePath]);
    if (storageError) {
        setMessage("❌ Failed to delete file from storage.");
        return;
    }

    const { error: dbError } = await supabase.from("files").delete().eq("id", fileId);
    if (dbError) {
        setMessage("❌ Failed to delete file metadata.");
        return;
    }

    fetchFiles(user.id);
    setMessage("✅ File deleted successfully!");
};

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert("File link copied to clipboard!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return <div className="loader">Loading...</div>;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-top">
            <h2>Dashboard</h2>
            <p>Welcome, {user.email}</p>
        </div>    
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </aside>

      <main className="content">
        <FileUploader userId={user.id} refreshFiles={() => fetchFiles(user.id)} />

        <h2>Your Uploaded Files</h2>
        {loading ? (
          <div className="loader">Loading files...</div>
        ) : files.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          <div className="file-grid">
            {files.map((file) => (
              <div className="file-card" key={file.id}>
                <h3>{file.title}</h3>
                <p>{file.description}</p>
                <a href={file.publicUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                  View File
                </a>
                <div className="file-actions">
                  <button onClick={() => handleCopyLink(file.publicUrl)}>Copy Link</button>
                  <button onClick={() => handleDelete(file.id, file.file_url)} className="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
