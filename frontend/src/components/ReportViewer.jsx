import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const ReportViewer = ({ reports = [] }) => {
  const [selectedReport, setSelectedReport] = useState(null);

  // Mock reports for demo if none provided
  const mockReports = [
    {
      id: 1,
      filename: "blood_test_2024.pdf",
      uploadedAt: "2024-11-15",
      summary: `## Blood Test Report Summary

**Date:** November 15, 2024

### Key Findings:
- **Hemoglobin:** 13.5 g/dL (Normal)
- **White Blood Cells:** 7.2 K/uL (Normal)
- **Platelets:** 250 K/uL (Normal)
- **Glucose (Fasting):** 95 mg/dL (Normal)

### Recommendations:
- Maintain regular exercise routine
- Continue balanced diet with adequate iron intake
- Schedule follow-up test in 6 months

### Next Steps:
- Consult with your healthcare provider for personalized guidance
- Maintain lifestyle changes
- Report any unusual symptoms immediately`,
    },
    {
      id: 2,
      filename: "chest_xray_2024.pdf",
      uploadedAt: "2024-10-22",
      summary: `## Chest X-Ray Report Summary

**Date:** October 22, 2024

### Key Findings:
- **Heart Size:** Normal
- **Lung Fields:** Clear, no infiltrates
- **Mediastinum:** Normal
- **Conclusion:** No acute findings

### Interpretation:
The chest X-ray appears normal with no signs of acute respiratory disease or cardiac abnormalities.

### Recommendations:
- Continue regular health monitoring
- Maintain good respiratory health
- Schedule follow-up if symptoms develop`,
    },
  ];

  const displayReports = reports.length > 0 ? reports : mockReports;

  return (
    <div className="w-full">
      {/* Report History List */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📄 Report History
        </h3>

        {displayReports.length === 0 ? (
          <p className="text-gray-600 text-center py-6">
            No reports uploaded yet. Upload your first medical report to get
            started!
          </p>
        ) : (
          <div className="space-y-2">
            {displayReports.map((report) => (
              <button
                key={report.id}
                onClick={() =>
                  setSelectedReport(
                    selectedReport?.id === report.id ? null : report,
                  )
                }
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedReport?.id === report.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-gray-50 hover:border-blue-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">
                      📎 {report.filename}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Uploaded:{" "}
                      {new Date(report.uploadedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-lg">
                    {selectedReport?.id === report.id ? "▼" : "▶"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Report Details - Markdown Viewer */}
      {selectedReport && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-gray-800">
              Report: {selectedReport.filename}
            </h4>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedReport.summary}
              </ReactMarkdown>
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              ⚠️ <strong>Medical Disclaimer:</strong> This simplified summary is
              for informational purposes only. Always consult with your
              healthcare provider for professional medical advice and
              interpretation of your reports.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
