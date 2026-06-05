import React from 'react';
import { UploadCloud, File, X, CheckCircle } from 'lucide-react';

export default function ReportViewer() {
  const [file, setFile] = React.useState(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setIsUploading(true);

    // Simulate API upload & analysis
    setTimeout(() => {
      setIsUploading(false);
      setResult({
        title: "Complete Blood Count (CBC)",
        summary: "Your report indicates normal levels across most markers. However, your hemoglobin is slightly below the optimal range, which might explain any recent fatigue.",
        details: [
          "Hemoglobin: 11.5 g/dL (Reference: 12.0 - 15.5 g/dL)",
          "WBC: 6.2 x 10^9/L (Reference: 4.5 - 11.0 x 10^9/L) - Normal",
          "Platelets: 250 x 10^9/L (Reference: 150 - 450 x 10^9/L) - Normal"
        ]
      });
    }, 2500);
  };

  return (
    <div className="rounded-2xl p-6 w-full max-w-2xl mx-auto mt-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', transition: 'background 0.3s, border-color 0.3s' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)', transition: 'color 0.3s' }}>Medical Report Simplifier</h2>

      {!result ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
          style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-subtle)' }}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <UploadCloud className="h-12 w-12" style={{ color: 'var(--brand)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Drag & drop your report here</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Supports PDF, PNG, JPG up to 10MB</p>

            <input
              type="file"
              id="report-upload"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.png,.jpg,.jpeg"
            />

            <label htmlFor="report-upload" className="btn-secondary mt-2 cursor-pointer">
              Browse Files
            </label>
          </div>

          {file && (
            <div className="mt-6 flex items-center justify-between p-3 rounded-lg shadow-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 overflow-hidden">
                <File className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--text-dim)' }} />
                <span className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{file.name}</span>
              </div>
              <button onClick={() => setFile(null)} className="hover:text-red-500" style={{ color: 'var(--text-dim)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {file && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <span className="animate-pulse">Analyzing Report...</span>
              ) : (
                'Simplify Report'
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-4" style={{ color: 'var(--green)' }}>
            <CheckCircle className="h-6 w-6" style={{ color: 'var(--green)' }} />
            <h3 className="text-xl font-bold" style={{ color: 'var(--green)' }}>Analysis Complete</h3>
          </div>

          <div className="rounded-xl p-5 shadow-sm space-y-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div>
              <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>Document Type</h4>
              <p style={{ color: 'var(--text-secondary)' }}>{result.title}</p>
            </div>
            <div>
              <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>Plain Language Summary</h4>
              <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>
            </div>
            <div>
              <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>Key Markers</h4>
              <ul className="list-disc pl-5 mt-2 space-y-1" style={{ color: 'var(--text-secondary)' }}>
                {result.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </div>
          </div>

          <button onClick={() => { setResult(null); setFile(null) }} className="btn-secondary w-full mt-6">
            Upload Another Report
          </button>
        </div>
      )}
    </div>
  );
}
