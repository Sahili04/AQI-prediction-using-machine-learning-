/**
 * API Client for Air Quality Prediction Backend
 */

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchModelInfo() {
  const res = await fetch(`${API_BASE}/model-info`);
  if (!res.ok) throw new Error('Failed to fetch model info');
  return res.json();
}

export async function fetchAvailableModels() {
  const res = await fetch(`${API_BASE}/available-models`);
  if (!res.ok) throw new Error('Failed to fetch available models');
  return res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function fetchFeatureImportance() {
  const res = await fetch(`${API_BASE}/feature-importance`);
  if (!res.ok) throw new Error('Failed to fetch feature importance');
  return res.json();
}

export async function fetchDatasetSummary() {
  const res = await fetch(`${API_BASE}/dataset-summary`);
  if (!res.ok) throw new Error('Failed to fetch dataset summary');
  return res.json();
}

export async function fetchEDAData() {
  const res = await fetch(`${API_BASE}/eda-data`);
  if (!res.ok) throw new Error('Failed to fetch EDA data');
  return res.json();
}

export async function fetchGradientDescentDemo() {
  const res = await fetch(`${API_BASE}/gradient-descent-demo`);
  if (!res.ok) throw new Error('Failed to fetch gradient descent data');
  return res.json();
}

export async function predictAQI(data) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Prediction request failed');
  }
  return res.json();
}

export async function predictBatch(formData) {
  const res = await fetch(`${API_BASE}/predict/batch`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Batch prediction failed');
  }
  return res.json();
}
