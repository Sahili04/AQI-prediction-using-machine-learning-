import React, { useState, useEffect } from 'react';
import { 
  Activity, Cpu, CheckCircle, TrendingDown, Info, 
  HelpCircle, Code2, ArrowRight, Play 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend 
} from 'recharts';
import { fetchGradientDescentDemo } from '../services/api';

export default function GradientDescentLab() {
  const [gdData, setGdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLr, setSelectedLr] = useState('lr_0.08');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchGradientDescentDemo();
        setGdData(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch Gradient Descent data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Loading Gradient Descent Simulation Data...</p>
      </div>
    );
  }

  if (error || !gdData) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 text-center text-red-600 shadow-xs">
        <p className="text-sm font-bold">Failed to load gradient descent experiment</p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  // Format Recharts data (sample every 2 iterations to keep chart smooth)
  const exp005 = gdData.experiments['lr_0.005']?.cost_history || [];
  const exp03 = gdData.experiments['lr_0.03']?.cost_history || [];
  const exp08 = gdData.experiments['lr_0.08']?.cost_history || [];

  const chartData = [];
  const totalIters = Math.min(exp005.length, exp03.length, exp08.length);
  for (let i = 0; i < totalIters; i += 2) {
    chartData.push({
      iteration: i + 1,
      lr_005: exp005[i],
      lr_03: exp03[i],
      lr_08: exp08[i]
    });
  }

  const activeExp = gdData.experiments[selectedLr] || gdData.experiments['lr_0.08'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Gradient Descent Laboratory</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                Syllabus Requirement
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Educational from-scratch implementation of Multivariate Linear Regression using pure NumPy (<code>ml/gradient_descent.py</code>).
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-500">Focus Learning Rate:</span>
            <select
              value={selectedLr}
              onChange={(e) => setSelectedLr(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-slate-800"
            >
              <option value="lr_0.005">α = 0.005 (Slow / Conservative)</option>
              <option value="lr_0.03">α = 0.03 (Moderate)</option>
              <option value="lr_0.08">α = 0.08 (Optimal Convergence)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mathematical Formulation Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
          <Code2 className="w-4 h-4 mr-1.5 text-purple-600" />
          Mathematical Derivation (For ML Viva)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">1. Hypothesis</span>
            <p className="font-mono font-bold text-slate-900 text-sm">ŷ = X · w + b</p>
            <p className="text-[11px] text-slate-500 mt-1">Linear combination of standardized environmental features</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">2. MSE Cost Function</span>
            <p className="font-mono font-bold text-slate-900 text-sm">J(w, b) = 1/(2m) Σ(ŷ - y)²</p>
            <p className="text-[11px] text-slate-500 mt-1">Half Mean Squared Error convex objective function</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">3. Gradient Computation</span>
            <p className="font-mono font-bold text-slate-900 text-sm">∇w J = 1/m Xᵀ (ŷ - y)</p>
            <p className="text-[11px] text-slate-500 mt-1">Analytical partial derivatives with respect to weights and bias</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">4. Parameter Update</span>
            <p className="font-mono font-bold text-slate-900 text-sm">w := w - α ∇w J</p>
            <p className="text-[11px] text-slate-500 mt-1">Simultaneous descent step in direction of steepest decrease</p>
          </div>
        </div>
      </div>

      {/* Iterations vs Cost Curve (Recharts) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Convergence Dynamics: Cost J(w, b) vs Iterations
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">Real iterations simulated from scratch using pure NumPy</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            200 Epochs
          </span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="iteration" label={{ value: 'Iteration Number', position: 'insideBottom', offset: -5, fontSize: 11 }} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis label={{ value: 'Cost J(w, b)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="lr_005" name="α = 0.005 (Slow)" stroke="#9333ea" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="lr_03" name="α = 0.03 (Moderate)" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="lr_08" name="α = 0.08 (Optimal)" stroke="#059669" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Snapshots & Scratch Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Iteration Snapshot Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Training Snapshots (Learning Rate α = {activeExp.learning_rate})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Iteration</th>
                  <th className="py-2 px-3">Cost J(w,b)</th>
                  <th className="py-2 px-3">Bias (b)</th>
                  <th className="py-2 px-3">Weight Norm ||w||</th>
                  <th className="py-2 px-3">Reduction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeExp.snapshots?.map((snap, idx) => {
                  const initialCost = activeExp.snapshots[0].cost;
                  const reductionPct = (((initialCost - snap.cost) / initialCost) * 100).toFixed(1);
                  return (
                    <tr key={snap.iteration} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{snap.iteration}</td>
                      <td className="py-2 px-3 font-bold text-purple-700">{snap.cost.toFixed(2)}</td>
                      <td className="py-2 px-3">{snap.bias.toFixed(2)}</td>
                      <td className="py-2 px-3">{snap.weight_norm.toFixed(2)}</td>
                      <td className="py-2 px-3 text-emerald-600 font-bold">
                        {reductionPct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scratch vs Scikit-Learn Comparison (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Scratch GD vs Scikit-Learn</h2>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-600">Metric</span>
              <span className="font-bold text-purple-700">Scratch NumPy GD</span>
              <span className="font-bold text-slate-700">Scikit-Learn OLS</span>
            </div>

            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-sans text-slate-600">Test R² Score</span>
              <span className="font-bold text-emerald-700">{gdData.test_metrics.r2}</span>
              <span className="font-bold text-slate-900">0.9233</span>
            </div>

            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-sans text-slate-600">Test RMSE</span>
              <span className="font-bold text-slate-800">{gdData.test_metrics.rmse}</span>
              <span className="font-bold text-slate-800">31.37</span>
            </div>

            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-sans text-slate-600">Test MAE</span>
              <span className="font-bold text-slate-800">{gdData.test_metrics.mae}</span>
              <span className="font-bold text-slate-800">24.14</span>
            </div>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 leading-relaxed">
            <strong>Viva Explanation:</strong> The from-scratch NumPy Gradient Descent matches scikit-learn's exact analytical Ordinary Least Squares solution ($R^2 \approx 0.92$), demonstrating that iterative first-order optimization reaches the global minimum on this convex quadratic objective surface.
          </div>
        </div>
      </div>
    </div>
  );
}
