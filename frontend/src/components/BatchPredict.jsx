import React, { useState } from 'react';
import { UploadCloud, FileText, Download, CheckCircle, RefreshCw, AlertCircle, Layers } from 'lucide-react';
import { predictBatch } from '../services/api';

const SAMPLE_CSV_CONTENT = `PM2.5,PM10,NO2,SO2,CO,O3,Temperature,Humidity,Wind_Speed
22.4,45.2,14.5,7.1,0.5,31.2,22.0,52.0,4.1
58.3,102.1,28.4,11.2,0.8,44.0,27.5,60.0,3.2
112.5,190.4,65.2,28.0,1.8,62.0,31.0,45.0,2.1
245.0,380.5,115.0,45.0,3.6,55.0,14.0,82.0,1.1
310.2,460.0,140.2,52.0,4.2,48.0,9.5,91.0,0.8
15.0,28.0,10.0,5.0,0.3,25.0,20.0,50.0,5.2
88.0,145.0,42.0,18.0,1.2,38.0,29.0,64.0,2.8
185.0,295.0,92.0,38.0,2.5,70.0,33.0,42.0,1.5
`;

export default function BatchPredict({ availableModels }) {
  const [file, setFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [batchResults, setBatchResults] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const loadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv' });
    const sampleFile = new File([blob], 'sample_air_quality_batch.csv', { type: 'text/csv' });
    setFile(sampleFile);
    setError(null);
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or load a CSV file first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedModel) {
        formData.append('model_name', selectedModel);
      }

      const res = await predictBatch(formData);
      setBatchResults(res);
    } catch (err) {
      setError(err.message || 'Failed to process batch CSV.');
    } finally {
      setLoading(false);
    }
  };

  const exportResultsToCSV = () => {
    if (!batchResults || !batchResults.predictions) return;
    const headers = ['Row_ID', 'Predicted_AQI', 'Category', 'PM2.5', 'PM10', 'Temperature', 'Wind_Speed'];
    const rows = batchResults.predictions.map((p) => [
      p.row_id,
      p.predicted_aqi,
      p.category,
      p.pm25,
      p.pm10,
      p.temp,
      p.wind
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predicted_aqi_batch_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Batch Air Quality Prediction</h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload an environmental monitoring CSV file to batch predict AQI across hundreds of records simultaneously via <code>POST /predict/batch</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
              >
                <option value="">Best Model: Gradient Boosting (Tuned)</option>
                {availableModels?.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center transition-colors">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                {file ? file.name : 'Choose a CSV file to upload'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Columns: PM2.5, PM10, NO2, SO2, CO, O3, Temperature, Humidity, Wind_Speed</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="batch-file-input"
              />
              <label
                htmlFor="batch-file-input"
                className="mt-3 inline-block px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer transition-colors"
              >
                Browse Files
              </label>
            </div>

            {/* Load Sample Data Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">Need test data?</span>
              <button
                type="button"
                onClick={loadSampleCSV}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
              >
                Load 8-Record Sample CSV
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running Batch Pipeline...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>PROCESS BATCH PREDICTIONS</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Area (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Batch Results</h2>
              {batchResults && (
                <p className="text-xs text-slate-600 mt-0.5">
                  Processed {batchResults.total_processed} rows with {batchResults.model_used}. Mean AQI: <strong>{batchResults.mean_predicted_aqi}</strong>
                </p>
              )}
            </div>

            {batchResults && (
              <button
                onClick={exportResultsToCSV}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-300"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>

          {batchResults ? (
            <div className="space-y-4">
              {/* Category Counts Breakdown */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(batchResults.category_counts).map(([cat, count]) => (
                  <span key={cat} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    {cat}: <strong>{count}</strong>
                  </span>
                ))}
              </div>

              {/* Predictions Table */}
              <div className="overflow-x-auto max-h-[420px] scrollbar-thin border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Predicted AQI</th>
                      <th className="py-2 px-3">CPCB Category</th>
                      <th className="py-2 px-3">PM2.5</th>
                      <th className="py-2 px-3">PM10</th>
                      <th className="py-2 px-3">Temp</th>
                      <th className="py-2 px-3">Wind</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchResults.predictions.map((r) => (
                      <tr key={r.row_id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-400">{r.row_id}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{r.predicted_aqi}</td>
                        <td className="py-2 px-3">
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold text-white"
                            style={{ backgroundColor: r.category_color }}
                          >
                            {r.category}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono">{r.pm25}</td>
                        <td className="py-2 px-3 font-mono">{r.pm10}</td>
                        <td className="py-2 px-3 font-mono">{r.temp}°C</td>
                        <td className="py-2 px-3 font-mono">{r.wind} m/s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No Batch Processed</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                Upload a CSV file or click "Load 8-Record Sample CSV" and click Process Batch.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
