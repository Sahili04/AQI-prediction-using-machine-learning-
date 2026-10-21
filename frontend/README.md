# 🖥️ Air Quality Prediction - React Frontend Dashboard

This directory houses the client-side single page application (SPA) for the Air Quality Index (AQI) Machine Learning Prediction System.

Built with **React 19**, **Vite**, **Tailwind CSS v4**, **Recharts**, and **Lucide React**.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build
```

The frontend runs by default at `http://localhost:5173`. Ensure the FastAPI backend is running concurrently at `http://127.0.0.1:8000`.

---

## 🏗️ Component Catalog

All user interface components reside inside `src/components/`:

- **`Navbar.jsx`**: Global navigation header with API heartbeat status indicator and tab selectors.
- **`Dashboard.jsx`**: Project hero banner, model KPI metric cards, Indian CPCB standards table, and machine learning pipeline architecture overview.
- **`PredictAQI.jsx`**: Interactive real-time prediction dashboard with environmental parameter sliders, scenario presets, CPCB color badges, and 95% statistical prediction intervals.
- **`BatchPredict.jsx`**: Drag-and-drop CSV batch uploader, client-side validation, bulk inference trigger, and category distribution charts.
- **`DatasetAnalysis.jsx`**: Exploratory Data Analysis (EDA) explorer displaying pollutant correlation matrices, descriptive statistics, and dynamic scatter plots.
- **`ModelComparison.jsx`**: Benchmark visualization comparing 5 regression algorithms across MAE, MSE, RMSE, R², 5-Fold Cross Validation, and Hyperparameter Tuning.
- **`FeatureImportance.jsx`**: Gini split gain and impurity reduction bar charts extracted from trained tree ensembles.
- **`GradientDescentLab.jsx`**: Interactive educational lab illustrating NumPy from-scratch gradient descent cost reduction curves and parameter convergence.
- **`VivaGuide.jsx`**: College viva voce question bank and technical defense cheat sheet for academic presentations.

---

## 🔗 Backend API Integration

All HTTP requests communicate with the FastAPI backend via `src/services/api.js`:
- `fetchHealth()`: Verifies backend connectivity (`GET /health`)
- `fetchModelInfo()`: Fetches model metadata and feature specifications (`GET /model-info`)
- `fetchMetrics()`: Retrieves cross-validation and benchmark comparisons (`GET /metrics`)
- `fetchEDAData()`: Fetches dataset statistics and correlation matrices (`GET /eda-data`)
- `predictAQI(payload)`: Submits single sample for inference (`POST /predict`)
- `predictBatch(file, modelName)`: Submits CSV for bulk vectorized inference (`POST /predict/batch`)
