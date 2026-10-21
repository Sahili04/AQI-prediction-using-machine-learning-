import React, { useState } from 'react';
import { Sliders, Award, Info, BarChart2, CheckCircle2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Cell 
} from 'recharts';

export default function FeatureImportance({ metrics }) {
  const [selectedModel, setSelectedModel] = useState('Gradient Boosting');

  const featureImportanceData = metrics?.feature_importance || {};
  const currentList = featureImportanceData[selectedModel] || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Feature Importance Analysis</h1>
            <p className="text-xs text-slate-500 mt-1">
              Gini impurity reduction & split gain extracted natively from trained tree-based ensemble models.
            </p>
          </div>

          {/* Model Switcher */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {Object.keys(featureImportanceData).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModel(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  selectedModel === m
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Horizontal Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {selectedModel} Relative Feature Importances
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">Calculated from total Mean Squared Error reduction across all decision tree splits</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              100% Normalized
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[...currentList].reverse()} 
                layout="vertical" 
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 11, fill: '#0f172a', fontWeight: 'bold' }} />
                <Tooltip 
                  formatter={(val) => [`${val}%`, 'Relative Importance']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                  {currentList.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#059669' : index === 1 ? '#0d9488' : '#3b82f6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Ranking Table & Explanations (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Feature Ranking Table</h2>

          <div className="divide-y divide-slate-100">
            {currentList.map((item, idx) => (
              <div key={item.feature} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    idx === 0 ? 'bg-emerald-600 text-white' : idx < 3 ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900">{item.feature}</span>
                </div>
                <div className="flex items-center space-x-3 font-mono">
                  <span className="text-slate-400 text-[11px]">Score: {item.importance.toFixed(4)}</span>
                  <span className="font-bold text-slate-800">{item.percentage.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1.5">
            <span className="font-bold text-slate-900 block flex items-center">
              <Info className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Scientific Environmental Rationale:
            </span>
            <p className="leading-relaxed text-[11px]">
              <strong>PM2.5 and PM10</strong> dominate feature importance (&gt;90%) because ambient AQI in India is determined by the maximum pollutant sub-index. In typical urban atmospheres, fine and coarse particulate matters almost always generate the highest sub-indices.
            </p>
            <p className="leading-relaxed text-[11px]">
              Gaseous pollutants (<strong>NO2, SO2, CO, O3</strong>) provide secondary adjustments during specific industrial or photochemical peak events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
