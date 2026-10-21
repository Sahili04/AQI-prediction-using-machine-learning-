import React, { useState, useEffect } from 'react';
import { 
  Database, AlertCircle, BarChart2, TrendingUp, Info, 
  Layers, CheckCircle, PieChart as PieIcon, ArrowUpDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ScatterChart, Scatter, Cell 
} from 'recharts';
import { fetchEDAData } from '../services/api';

export default function DatasetAnalysis() {
  const [eda, setEda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScatterFeature, setSelectedScatterFeature] = useState('pm25');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchEDAData();
        setEda(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch EDA data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Loading Exploratory Data Analysis & Statistics...</p>
      </div>
    );
  }

  if (error || !eda) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 text-center text-red-600 shadow-xs">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
        <p className="text-sm font-bold">Failed to load dataset analysis</p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  // Format AQI distribution for BarChart
  const aqiDistData = Object.entries(eda.aqi_category_distribution || {}).map(([cat, count]) => {
    let color = '#16a34a';
    if (cat.includes('Satisfactory')) color = '#65a30d';
    if (cat.includes('Moderate')) color = '#ca8a04';
    if (cat.includes('Poor') && !cat.includes('Very')) color = '#ea580c';
    if (cat.includes('Very Poor')) color = '#dc2626';
    if (cat.includes('Severe')) color = '#7f1d1d';
    return { name: cat, count, color };
  });

  // Prepare Correlation list against AQI
  const aqiCorrelations = eda.correlation_matrix?.AQI
    ? Object.entries(eda.correlation_matrix.AQI)
        .filter(([k]) => k !== 'AQI')
        .map(([feature, corr]) => ({ feature, corr }))
        .sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr))
    : [];

  const scatterKeys = [
    { id: 'pm25', label: 'PM2.5 (Fine Particles)' },
    { id: 'pm10', label: 'PM10 (Coarse Dust)' },
    { id: 'no2', label: 'NO2 (Nitrogen Dioxide)' },
    { id: 'so2', label: 'SO2 (Sulphur Dioxide)' },
    { id: 'co', label: 'CO (Carbon Monoxide)' },
    { id: 'o3', label: 'O3 (Surface Ozone)' },
    { id: 'wind', label: 'Wind Speed (Dispersion)' },
    { id: 'humidity', label: 'Humidity (%)' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dataset Analysis & Exploratory Data Analysis (EDA)</h1>
            <p className="text-xs text-slate-500 mt-1">
              Descriptive statistics, Pearson correlation, missing value analysis, and pollutant relationships derived directly from <code>data/air_quality.csv</code>.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300">
            Source: data/air_quality.csv
          </span>
        </div>
      </div>

      {/* Dataset Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Raw Records</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{eda.total_records}</p>
          <span className="text-[11px] text-slate-500">From ambient logging</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cleaned Rows</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{eda.cleaned_records}</p>
          <span className="text-[11px] text-slate-500">Duplicates removed</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Input Features</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{eda.features.length}</p>
          <span className="text-[11px] text-slate-500">Continuous predictors</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Variable</span>
          <p className="text-2xl font-black text-blue-600 mt-1">AQI</p>
          <span className="text-[11px] text-slate-500">Supervised Regression</span>
        </div>
      </div>

      {/* AQI Distribution & Missing Values Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AQI Distribution Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Distribution of AQI by CPCB Categories</h2>
              <p className="text-xs text-slate-600 mt-0.5">Sample count across NAQI severity bands</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              NAQI Framework
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aqiDistData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  angle={-15} 
                  textAnchor="end" 
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val) => [`${val} samples`, 'Count']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {aqiDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Missing Values Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Missing Values Analysis</h2>
            <span className="text-[11px] text-slate-400">Imputed via Median in Pipeline</span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(eda.missing_analysis || {}).map(([feat, count]) => {
              const pct = ((count / eda.total_records) * 100).toFixed(1);
              return (
                <div key={feat} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-700">{feat}</span>
                    <span className="text-slate-500 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${count > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.max(count > 0 ? pct * 10 : 100, 2)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <strong>Viva Note:</strong> Median strategy is used rather than mean because environmental pollutants exhibit right-skewed distributions with natural extreme outlier events.
          </p>
        </div>
      </div>

      {/* Correlation Section & Association vs Causation */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pearson Correlation with Target AQI</h2>
          <p className="text-xs text-slate-600 mt-0.5">Quantifies linear association between each predictor and AQI</p>
        </div>

        {/* Academic Caution Alert */}
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Important ML Concept (Association vs Causation):</strong> A high Pearson correlation coefficient ($r$) indicates statistical co-movement and mutual association, but does <em>not</em> establish direct physical causation. For example, high humidity is correlated with high AQI because winter boundary layer inversions trap pollutants, not because water vapor itself creates particulate matter.
          </div>
        </div>

        {/* Correlation Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {aqiCorrelations.map(({ feature, corr }) => {
            const isPos = corr >= 0;
            const barWidth = `${Math.abs(corr) * 100}%`;
            return (
              <div key={feature} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">{feature}</span>
                  <span className={`text-xs font-mono font-bold ${corr >= 0.7 ? 'text-emerald-700' : corr < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {corr.toFixed(3)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isPos ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: barWidth }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Scatter Plot: Feature vs AQI */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pollutant vs AQI Relationship Scatter Plot</h2>
            <p className="text-xs text-slate-600 mt-0.5">Plotting authentic ambient samples from <code>air_quality.csv</code></p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Select Feature:</span>
            <select
              value={selectedScatterFeature}
              onChange={(e) => setSelectedScatterFeature(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium"
            >
              {scatterKeys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                dataKey={selectedScatterFeature} 
                name={selectedScatterFeature.toUpperCase()} 
                tick={{ fontSize: 11, fill: '#64748b' }} 
              />
              <YAxis 
                type="number" 
                dataKey="aqi" 
                name="AQI" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Scatter name="Samples" data={eda.scatter_samples} fill="#059669" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Descriptive Statistics Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Feature Descriptive Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Feature</th>
                <th className="py-2.5 px-3">Mean</th>
                <th className="py-2.5 px-3">Std Dev</th>
                <th className="py-2.5 px-3">Min</th>
                <th className="py-2.5 px-3">25%</th>
                <th className="py-2.5 px-3">Median (50%)</th>
                <th className="py-2.5 px-3">75%</th>
                <th className="py-2.5 px-3">Max</th>
                <th className="py-2.5 px-3">Skewness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {Object.entries(eda.feature_stats || {}).map(([f, s]) => (
                <tr key={f} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-sans font-bold text-slate-800">{f}</td>
                  <td className="py-2 px-3">{s.mean}</td>
                  <td className="py-2 px-3">{s.std}</td>
                  <td className="py-2 px-3">{s.min}</td>
                  <td className="py-2 px-3 text-slate-500">{s.q25}</td>
                  <td className="py-2 px-3 font-bold text-emerald-700">{s.median}</td>
                  <td className="py-2 px-3 text-slate-500">{s.q75}</td>
                  <td className="py-2 px-3">{s.max}</td>
                  <td className="py-2 px-3">{s.skew}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
