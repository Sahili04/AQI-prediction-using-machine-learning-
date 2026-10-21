import React, { useState } from 'react';
import { 
  Wind, AlertCircle, CheckCircle2, Sliders, RefreshCw, Info, HelpCircle, 
  Thermometer, Droplets, ArrowUpRight, Gauge, ChevronDown, Check
} from 'lucide-react';
import { predictAQI } from '../services/api';

const PRESETS = [
  {
    name: 'Clean Hill Station (Good)',
    data: {
      pm25: 18.0,
      pm10: 32.0,
      no2: 12.0,
      nox: 18.0,
      so2: 6.0,
      co: 0.4,
      o3: 28.0,
      temperature: 18.0,
      humidity: 55.0,
      wind_speed: 4.8
    }
  },
  {
    name: 'Suburban Moderate Day',
    data: {
      pm25: 68.0,
      pm10: 115.0,
      no2: 32.0,
      nox: 48.0,
      so2: 14.0,
      co: 0.9,
      o3: 42.0,
      temperature: 28.0,
      humidity: 62.0,
      wind_speed: 3.0
    }
  },
  {
    name: 'Urban Traffic & Industrial (Poor)',
    data: {
      pm25: 145.0,
      pm10: 240.0,
      no2: 85.0,
      nox: 130.0,
      so2: 35.0,
      co: 2.2,
      o3: 75.0,
      temperature: 34.0,
      humidity: 48.0,
      wind_speed: 1.8
    }
  },
  {
    name: 'Winter Smog Episode (Very Poor / Severe)',
    data: {
      pm25: 320.0,
      pm10: 480.0,
      no2: 140.0,
      nox: 210.0,
      so2: 55.0,
      co: 4.5,
      o3: 50.0,
      temperature: 11.0,
      humidity: 88.0,
      wind_speed: 0.8
    }
  }
];

export default function PredictAQI({ availableModels }) {
  const [formData, setFormData] = useState({
    pm25: 85.0,
    pm10: 140.0,
    no2: 35.0,
    nox: 55.0,
    so2: 12.0,
    co: 0.8,
    o3: 45.0,
    temperature: 28.0,
    humidity: 65.0,
    wind_speed: 3.2,
    model_name: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [result, setResult] = useState(null);

  const validate = () => {
    const errs = {};
    if (formData.pm25 < 0) errs.pm25 = 'PM2.5 cannot be negative';
    if (formData.pm10 < 0) errs.pm10 = 'PM10 cannot be negative';
    if (formData.no2 < 0) errs.no2 = 'NO2 cannot be negative';
    if (formData.so2 < 0) errs.so2 = 'SO2 cannot be negative';
    if (formData.co < 0) errs.co = 'CO cannot be negative';
    if (formData.o3 < 0) errs.o3 = 'O3 cannot be negative';
    if (formData.wind_speed < 0) errs.wind_speed = 'Wind speed cannot be negative';
    if (formData.humidity < 0 || formData.humidity > 100) errs.humidity = 'Humidity must be between 0% and 100%';
    if (formData.temperature < -30 || formData.temperature > 65) errs.temperature = 'Temperature out of realistic bounds (-30°C to 65°C)';

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (field, value) => {
    const numVal = parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(numVal) ? value : numVal
    }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const applyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      ...preset.data
    }));
    setValidationErrors({});
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        pm25: Number(formData.pm25),
        pm10: Number(formData.pm10),
        no2: Number(formData.no2),
        nox: Number(formData.nox),
        so2: Number(formData.so2),
        co: Number(formData.co),
        o3: Number(formData.o3),
        temperature: Number(formData.temperature),
        humidity: Number(formData.humidity),
        wind_speed: Number(formData.wind_speed),
        model_name: formData.model_name || undefined
      };

      const res = await predictAQI(payload);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to generate prediction from backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Predict Air Quality Index (AQI)</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter ambient meteorological and pollutant concentrations. The backend pipeline runs preprocessing, invokes the selected ML model, and computes CPCB categories.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Presets:</span>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors border border-slate-200"
              >
                {p.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Model Selector */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Select Regression Model</span>
                <span className="text-[11px] font-normal text-slate-500">Defaults to best performing (Gradient Boosting)</span>
              </label>
              <select
                value={formData.model_name}
                onChange={(e) => handleInputChange('model_name', e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Best Model: Gradient Boosting (Tuned) [Recommended]</option>
                {availableModels?.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Pollutants Section */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center">
                <Wind className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Chemical & Particulate Pollutants
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PM2.5 */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1">
                    <span>PM2.5 (Fine Particulate)</span>
                    <span className="font-bold text-slate-900">{formData.pm25} µg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="450"
                    step="0.5"
                    value={formData.pm25}
                    onChange={(e) => handleInputChange('pm25', e.target.value)}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">0 (Clean)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.pm25}
                      onChange={(e) => handleInputChange('pm25', e.target.value)}
                      className="w-20 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5"
                    />
                    <span className="text-[10px] text-slate-400">450 (Severe)</span>
                  </div>
                  {validationErrors.pm25 && <p className="text-[11px] text-red-600 mt-1">{validationErrors.pm25}</p>}
                </div>

                {/* PM10 */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1">
                    <span>PM10 (Coarse Dust)</span>
                    <span className="font-bold text-slate-900">{formData.pm10} µg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="650"
                    step="1"
                    value={formData.pm10}
                    onChange={(e) => handleInputChange('pm10', e.target.value)}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">0</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.pm10}
                      onChange={(e) => handleInputChange('pm10', e.target.value)}
                      className="w-20 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5"
                    />
                    <span className="text-[10px] text-slate-400">650</span>
                  </div>
                  {validationErrors.pm10 && <p className="text-[11px] text-red-600 mt-1">{validationErrors.pm10}</p>}
                </div>

                {/* NO2 */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1">
                    <span>NO2 (Nitrogen Dioxide)</span>
                    <span className="font-bold text-slate-900">{formData.no2} µg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="250"
                    step="0.5"
                    value={formData.no2}
                    onChange={(e) => handleInputChange('no2', e.target.value)}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">0</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.no2}
                      onChange={(e) => handleInputChange('no2', e.target.value)}
                      className="w-20 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5"
                    />
                    <span className="text-[10px] text-slate-400">250</span>
                  </div>
                  {validationErrors.no2 && <p className="text-[11px] text-red-600 mt-1">{validationErrors.no2}</p>}
                </div>

                {/* SO2 */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1">
                    <span>SO2 (Sulphur Dioxide)</span>
                    <span className="font-bold text-slate-900">{formData.so2} µg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="0.5"
                    value={formData.so2}
                    onChange={(e) => handleInputChange('so2', e.target.value)}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">0</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.so2}
                      onChange={(e) => handleInputChange('so2', e.target.value)}
                      className="w-20 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5"
                    />
                    <span className="text-[10px] text-slate-400">180</span>
                  </div>
                  {validationErrors.so2 && <p className="text-[11px] text-red-600 mt-1">{validationErrors.so2}</p>}
                </div>

                {/* CO */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1">
                    <span>CO (Carbon Monoxide)</span>
                    <span className="font-bold text-slate-900">{formData.co} mg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.1"
                    value={formData.co}
                    onChange={(e) => handleInputChange('co', e.target.value)}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">0</span>
                    <input
                      type="number"
                      step="0.05"
                      value={formData.co}
                      onChange={(e) => handleInputChange('co', e.target.value)}
                      className="w-20 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5"
                    />
                    <span className="text-[10px] text-slate-400">12</span>
                  </div>
                  {validationErrors.co && <p className="text-[11px] text-red-600 mt-1">{validationErrors.co}</p>}
                </div>

                {/* O3 */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1">
                    <span>O3 (Ozone)</span>
                    <span className="font-bold text-slate-900">{formData.o3} µg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="220"
                    step="0.5"
                    value={formData.o3}
                    onChange={(e) => handleInputChange('o3', e.target.value)}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">0</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.o3}
                      onChange={(e) => handleInputChange('o3', e.target.value)}
                      className="w-20 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5"
                    />
                    <span className="text-[10px] text-slate-400">220</span>
                  </div>
                  {validationErrors.o3 && <p className="text-[11px] text-red-600 mt-1">{validationErrors.o3}</p>}
                </div>
              </div>
            </div>

            {/* Meteorological Factors */}
            <div className="pt-2 border-t border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center">
                <Thermometer className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Meteorological Drivers
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Temperature */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1">
                    <span>Temperature</span>
                    <span className="font-bold text-slate-900">{formData.temperature} °C</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="0.5"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">5°C</span>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.temperature}
                      onChange={(e) => handleInputChange('temperature', e.target.value)}
                      className="w-16 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5"
                    />
                    <span className="text-[10px] text-slate-400">50°C</span>
                  </div>
                  {validationErrors.temperature && <p className="text-[11px] text-red-600 mt-1">{validationErrors.temperature}</p>}
                </div>

                {/* Humidity */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1">
                    <span>Humidity</span>
                    <span className="font-bold text-slate-900">{formData.humidity} %</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={formData.humidity}
                    onChange={(e) => handleInputChange('humidity', e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">10%</span>
                    <input
                      type="number"
                      step="1"
                      value={formData.humidity}
                      onChange={(e) => handleInputChange('humidity', e.target.value)}
                      className="w-16 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5"
                    />
                    <span className="text-[10px] text-slate-400">100%</span>
                  </div>
                  {validationErrors.humidity && <p className="text-[11px] text-red-600 mt-1">{validationErrors.humidity}</p>}
                </div>

                {/* Wind Speed */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-1">
                    <span>Wind Speed</span>
                    <span className="font-bold text-slate-900">{formData.wind_speed} m/s</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="12.0"
                    step="0.1"
                    value={formData.wind_speed}
                    onChange={(e) => handleInputChange('wind_speed', e.target.value)}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">0.2</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.wind_speed}
                      onChange={(e) => handleInputChange('wind_speed', e.target.value)}
                      className="w-16 text-xs text-right border border-slate-200 rounded px-1.5 py-0.5"
                    />
                    <span className="text-[10px] text-slate-400">12.0</span>
                  </div>
                  {validationErrors.wind_speed && <p className="text-[11px] text-red-600 mt-1">{validationErrors.wind_speed}</p>}
                </div>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Predict Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-colors shadow-xs flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing through ML Model...</span>
                </>
              ) : (
                <>
                  <Wind className="w-4 h-4" />
                  <span>PREDICT AQI</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Result Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {result ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Prediction Output</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${result.badge_style}`}>
                  {result.category}
                </span>
              </div>

              {/* Main AQI Display */}
              <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Predicted Air Quality Index</span>
                <div className="mt-1 flex items-baseline justify-center space-x-2">
                  <span 
                    className="text-5xl font-black tracking-tight"
                    style={{ color: result.category_color }}
                  >
                    {result.predicted_aqi}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">AQI</span>
                </div>
                <div className="mt-2 inline-flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: result.category_color }}></span>
                  <span>CPCB Category: <strong>{result.category}</strong></span>
                </div>
              </div>

              {/* Health Impact Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs font-bold text-slate-700 block mb-1">Health Advisory (CPCB):</span>
                <p className="text-xs text-slate-600 leading-relaxed">{result.health_impact}</p>
              </div>

              {/* Statistical Uncertainty / Prediction Interval */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">95% Prediction Interval:</span>
                  <span className="font-mono font-bold text-slate-900">
                    [{result.uncertainty.confidence_interval_95[0]} - {result.uncertainty.confidence_interval_95[1]}]
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {result.uncertainty.interpretation}
                </p>
                <div className="pt-1 text-[10px] text-slate-400 flex items-center">
                  <Info className="w-3 h-3 mr-1" />
                  <span>Calculated from held-out test Residual Standard Error (RSE: {result.uncertainty.residual_standard_error} pts).</span>
                </div>
              </div>

              {/* Model & Source Meta */}
              <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                <p><strong>Model Used:</strong> {result.model_used}</p>
                <p className="italic text-[11px] text-slate-400">{result.explanation}</p>
              </div>

              {/* Input Summary Table */}
              <details className="text-xs text-slate-600 pt-2 border-t border-slate-100">
                <summary className="font-semibold cursor-pointer text-slate-700 hover:text-slate-900">
                  View Submitted Parameters
                </summary>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 font-mono text-[11px]">
                  {Object.entries(result.input_summary).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-0.5 border-b border-slate-50">
                      <span className="text-slate-500">{k}:</span>
                      <span className="font-semibold text-slate-800">{v}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 shadow-xs flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Gauge className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Prediction Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1.5">
                Adjust the environmental sliders on the left or click a Preset, then click <strong>PREDICT AQI</strong>.
              </p>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-left text-[11px] text-slate-500 space-y-1">
                <p>✓ Strictly communicates with <code>POST /predict</code> API</p>
                <p>✓ Preprocessing is applied before inference</p>
                <p>✓ Legitimate 95% uncertainty interval included</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
