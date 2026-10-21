import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import PredictAQI from './components/PredictAQI';
import BatchPredict from './components/BatchPredict';
import DatasetAnalysis from './components/DatasetAnalysis';

import { fetchHealth, fetchMetrics, fetchModelInfo, fetchAvailableModels } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiOnline, setApiOnline] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const health = await fetchHealth();
        setApiOnline(health.status === 'healthy');

        const [mRes, infoRes, modelsRes] = await Promise.all([
          fetchMetrics().catch(() => null),
          fetchModelInfo().catch(() => null),
          fetchAvailableModels().catch(() => ({ models: [] }))
        ]);

        setMetrics(mRes);
        setModelInfo(infoRes);
        setAvailableModels(modelsRes.models || []);
      } catch (err) {
        console.error('API connection initialization error:', err);
        setApiOnline(false);
      } finally {
        setLoading(false);
      }
    }
    init();

    // Periodic health heartbeat
    const interval = setInterval(async () => {
      try {
        const h = await fetchHealth();
        setApiOnline(h.status === 'healthy');
      } catch {
        setApiOnline(false);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} apiOnline={apiOnline} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            metrics={metrics} 
            modelInfo={modelInfo} 
          />
        )}

        {activeTab === 'predict' && (
          <PredictAQI availableModels={availableModels} />
        )}

        {activeTab === 'batch' && (
          <BatchPredict availableModels={availableModels} />
        )}

        {activeTab === 'eda' && (
          <DatasetAnalysis />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-bold text-slate-800">AIR QUALITY PREDICTION USING MACHINE LEARNING</span>
            <span className="mx-2">•</span>
            <span>B.Tech Artificial Intelligence & Data Science</span>
          </div>

          <div className="flex items-center space-x-4">
            <span>Indian CPCB NAQI Standard</span>
            <span>•</span>
            <span>FastAPI + scikit-learn + React</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
