import React from 'react';
import { Activity, Wind, Database, Layers } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiOnline }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'predict', label: 'Predict AQI', icon: Wind },
    { id: 'batch', label: 'Batch Predict', icon: Layers },
    { id: 'eda', label: 'Dataset & EDA', icon: Database },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Academic Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">AirQuality.ML</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                  B.Tech AI & DS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Predicting AQI using Environmental Parameters</p>
            </div>
          </div>

          {/* Backend Status indicator */}
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">API Status:</span>
            {apiOnline ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                FastAPI Connected
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                Connecting to backend...
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto scrollbar-none py-1 border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
