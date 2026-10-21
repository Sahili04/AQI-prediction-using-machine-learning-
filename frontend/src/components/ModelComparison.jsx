import React from 'react';
import { 
  BarChart3, Award, CheckCircle, TrendingUp, AlertTriangle, 
  HelpCircle, ArrowDown, ArrowUp, Sliders, ShieldCheck 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Cell, Legend 
} from 'recharts';

export default function ModelComparison({ metrics }) {
  if (!metrics) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs">
        <p className="text-xs font-semibold">Loading model evaluation metrics...</p>
      </div>
    );
  }

  const comparisonTable = metrics.comparison_table || [];
  const tuningData = metrics.tuning_comparison || {};
  const bestModelName = metrics.best_model_name;

  // Chart data for R2 comparison
  const r2ChartData = comparisonTable.map((m) => ({
    name: m.model,
    r2: m.r2,
    cv_r2: m.cv_r2_mean,
    is_best: m.is_best
  }));

  // Chart data for RMSE comparison (lower is better)
  const rmseChartData = comparisonTable.map((m) => ({
    name: m.model,
    rmse: m.rmse,
    mae: m.mae,
    is_best: m.is_best
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Machine Learning Model Comparison</h1>
            <p className="text-xs text-slate-500 mt-1">
              Rigorous comparative evaluation across 5 regression models with 5-Fold Cross Validation and Overfitting Analysis.
            </p>
          </div>
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Optimal Model: {bestModelName}</span>
          </div>
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Evaluation Metrics on Held-Out Test Set (20% Split)</h2>
            <p className="text-xs text-slate-600 mt-0.5">Higher R² is better • Lower MAE/MSE/RMSE are better</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            5-Fold Cross-Validated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Regression Model</th>
                <th className="py-2.5 px-3">MAE (pts)</th>
                <th className="py-2.5 px-3">MSE (pts²)</th>
                <th className="py-2.5 px-3">RMSE (pts)</th>
                <th className="py-2.5 px-3">Test R² Score</th>
                <th className="py-2.5 px-3">5-Fold CV R² (Mean ± Std)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {comparisonTable.map((row) => (
                <tr key={row.model} className={row.is_best ? 'bg-emerald-50/60 font-medium' : 'hover:bg-slate-50'}>
                  <td className="py-3 px-3 font-sans font-bold text-slate-900 flex items-center">
                    {row.model}
                    {row.is_best && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                        BEST
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">{row.mae.toFixed(2)}</td>
                  <td className="py-3 px-3">{row.mse.toFixed(2)}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{row.rmse.toFixed(2)}</td>
                  <td className="py-3 px-3 font-bold text-emerald-700">{row.r2.toFixed(4)}</td>
                  <td className="py-3 px-3">
                    {row.cv_r2_mean.toFixed(4)} <span className="text-[11px] text-slate-400">± {row.cv_r2_std.toFixed(4)}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    {row.is_best ? (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-700">
                        <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Selected
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Baseline</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* R2 Score Comparison Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">R² Coefficient of Determination (Higher is Better)</h2>
            <p className="text-xs text-slate-600 mt-0.5">Test R² vs 5-Fold Cross Validation Mean R²</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r2ChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" interval={0} />
                <YAxis domain={[0.85, 1.0]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="r2" name="Test Set R²" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cv_r2" name="5-Fold CV Mean R²" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RMSE Comparison Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Root Mean Squared Error (Lower is Better)</h2>
            <p className="text-xs text-slate-600 mt-0.5">Average deviation in continuous AQI index points</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rmseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="rmse" name="RMSE (pts)" fill="#ea580c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mae" name="MAE (pts)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Overfitting vs Underfitting Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Overfitting & Underfitting Diagnosis</h2>
            <p className="text-xs text-slate-600 mt-0.5">Comparing Training R² vs Testing R² to evaluate generalization variance</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Generalization Gap
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Train R²</th>
                <th className="py-2.5 px-3">Test R²</th>
                <th className="py-2.5 px-3">Generalization Gap (Train - Test)</th>
                <th className="py-2.5 px-3">Diagnostic Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {Object.entries(metrics.models || {}).map(([name, data]) => {
                const gap = data.overfitting_analysis.generalization_gap_r2;
                const status = data.overfitting_analysis.status;
                const isOverfit = gap > 0.08;
                return (
                  <tr key={name} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{name}</td>
                    <td className="py-2.5 px-3">{data.train_metrics.r2.toFixed(4)}</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-700">{data.test_metrics.r2.toFixed(4)}</td>
                    <td className="py-2.5 px-3">{gap > 0 ? `+${gap.toFixed(4)}` : gap.toFixed(4)}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isOverfit 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hyperparameter Tuning Results (GridSearchCV) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Hyperparameter Tuning (GridSearchCV) Results</h2>
          <p className="text-xs text-slate-600 mt-0.5">Performance improvement before vs after systematic cross-validated grid search</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(tuningData).map(([algo, info]) => (
            <div key={algo} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{algo}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  GridSearch Tuned
                </span>
              </div>

              {/* Best Params Badge List */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">Optimal Parameters:</span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {Object.entries(info.best_params || {}).map(([p, v]) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      {p}: <strong>{String(v)}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Before vs After comparison */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">BEFORE TUNING</span>
                  <p className="font-mono text-slate-700">
                    RMSE: <strong>{info.before_tuning.rmse}</strong> | R²: {info.before_tuning.r2}
                  </p>
                </div>
                <div>
                  <span className="text-emerald-600 block text-[10px] font-semibold">AFTER TUNING</span>
                  <p className="font-mono text-emerald-800 font-bold">
                    RMSE: <strong>{info.after_tuning.rmse}</strong> | R²: {info.after_tuning.r2}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
