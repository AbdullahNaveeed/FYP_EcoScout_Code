import React, { useState } from 'react';
import './index.css'; 
import axios from 'axios';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Activity,
  Loader2
} from 'lucide-react';

const API_URL = "http://localhost:8000/detect";

const App = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // --- HANDLERS ---
  
  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === "Failed") {
        setError("No license plate detected in this image.");
      } else {
        const detection = response.data;
        setResult(detection);
        setHistory(prev => [detection, ...prev]);
        setActiveTab('results'); // Switch to results view automatically
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white fixed h-full flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Car className="text-emerald-400" />
            Eco<span className="text-emerald-400">Scout</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">FYP Phase 2: LPD System</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={UploadCloud} 
            label="Upload Media" 
            active={activeTab === 'upload'} 
            onClick={() => setActiveTab('upload')} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Detection Results" 
            active={activeTab === 'results'} 
            onClick={() => setActiveTab('results')} 
          />
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard Stats" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 flex-1 p-8">
        <header className="mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === 'upload' && 'Upload Evidence'}
            {activeTab === 'results' && 'Detection Analysis'}
            {activeTab === 'dashboard' && 'System Overview'}
          </h2>
        </header>

        {/* VIEW: UPLOAD */}
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 min-h-[300px]">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-64 rounded shadow" />
                ) : (
                  <>
                    <UploadCloud size={48} className="text-slate-400 mb-4" />
                    <p className="text-slate-500">Select an image to detect License Plate</p>
                  </>
                )}
                
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect}
                  className="mt-4 block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-emerald-50 file:text-emerald-700
                    hover:file:bg-emerald-100"
                />
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} /> {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className={`mt-6 w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-all ${
                  loading || !file 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                {loading ? "Processing via YOLO & OCR..." : "Detect License Plate"}
              </button>
            </div>
          </div>
        )}

        {/* VIEW: RESULTS */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* LATEST RESULT CARD */}
            {result && (
              <div className="bg-white p-6 rounded-xl shadow border border-emerald-100">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Activity className="text-emerald-500" /> Latest Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <img src={result.preview_image} alt="Annotated Result" className="w-full h-auto object-contain" />
                  </div>
                  <div className="space-y-4">
                    <ResultRow label="License Plate" value={result.plate_number} isMain />
                    <ResultRow label="Confidence" value={`${(result.confidence * 100).toFixed(1)}%`} />
                    <ResultRow label="Timestamp" value={result.timestamp} />
                    <ResultRow label="Status" value="Vehicle Identified" />
                    
                    <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200 text-sm text-slate-500">
                      <p><strong>Note:</strong> Detection provided by YOLOv8 model combined with customized EasyOCR preprocessing.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-left text-sm text-slate-600">
                 <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                   <tr>
                     <th className="px-6 py-4">Plate Number</th>
                     <th className="px-6 py-4">Confidence</th>
                     <th className="px-6 py-4">Timestamp</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {history.map((item, idx) => (
                     <tr key={idx} className="hover:bg-slate-50">
                       <td className="px-6 py-4 font-mono font-bold text-emerald-700">{item.plate_number}</td>
                       <td className="px-6 py-4">{(item.confidence * 100).toFixed(1)}%</td>
                       <td className="px-6 py-4 flex items-center gap-2">
                         <Clock size={14} /> {item.timestamp}
                       </td>
                     </tr>
                   ))}
                   {history.length === 0 && (
                     <tr>
                       <td colSpan="3" className="px-6 py-8 text-center text-slate-400">No detection history available.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- SUB COMPONENTS ---

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={18} /> {label}
  </button>
);

const ResultRow = ({ label, value, isMain }) => (
  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
    <span className="text-slate-500 text-sm">{label}</span>
    <span className={`font-medium ${isMain ? 'text-2xl text-emerald-600 font-bold tracking-wider font-mono' : 'text-slate-800'}`}>
      {value}
    </span>
  </div>
);

export default App;