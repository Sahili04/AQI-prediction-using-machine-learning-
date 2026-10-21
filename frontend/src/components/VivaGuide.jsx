import React, { useState } from 'react';
import { 
  BookOpen, HelpCircle, CheckCircle2, ChevronDown, ChevronUp, 
  Lightbulb, Code, ShieldCheck, Scale, Award 
} from 'lucide-react';

const VIVA_QUESTIONS = [
  {
    q: '1. Why is Air Quality Index (AQI) prediction formulated as a Regression problem rather than a Classification problem?',
    a: 'AQI is fundamentally a continuous physical numerical quantity (e.g., 188.0, 245.5) derived from environmental pollutant concentrations. Formulating it as a regression problem preserves the continuous ordering, relative distance, and magnitude of pollution levels. Once the continuous AQI is predicted, we map it into discrete CPCB categories (Good, Satisfactory, Moderate, Poor, Very Poor, Severe) using standard regulatory breakpoints. Direct classification would discard critical ordinal distance and make subtle trends undetectable.'
  },
  {
    q: '2. What is Data Leakage in Machine Learning and how does this project prevent it?',
    a: 'Data Leakage occurs when information from outside the training dataset (such as test set mean, median, or variance) is accidentally used during model training or preprocessing. If a StandardScaler or SimpleImputer is fitted on the entire dataset before train/test splitting, the model indirectly learns the test set distribution, yielding unrealistically optimistic evaluation scores. In this project, we prevent data leakage by using scikit-learn Pipelines: transformers are fitted strictly on X_train only (`fit_transform`) and subsequently used only to transform X_test (`transform`).'
  },
  {
    q: '3. Why do Linear, Ridge, and Lasso regressions require Feature Scaling while Random Forest and Gradient Boosting do not?',
    a: 'Linear, Ridge, Lasso, and Gradient Descent algorithms are sensitive to feature scales. Ridge and Lasso penalize coefficients based on their magnitudes (L2: λ||w||², L1: λ||w||₁). If PM10 is in hundreds (0-500) while CO is in decimals (0-5), the regularization penalty would unfairly penalize features with larger numerical scale. Decision Trees and ensembles (Random Forest, Gradient Boosting) make split decisions based on ordering thresholds on individual features independently (e.g., "is PM2.5 > 60?"). Because monotonic transformations do not change the order of values, tree-based models are scale-invariant.'
  },
  {
    q: '4. What is the fundamental difference between Ridge Regression (L2) and Lasso Regression (L1)?',
    a: 'Ridge Regression adds an L2 penalty proportional to the sum of squared coefficients (λ Σ wⱼ²). It shrinks collinear and redundant weights smoothly toward zero but never sets them exactly to zero. Lasso Regression adds an L1 penalty proportional to the sum of absolute values (λ Σ |wⱼ|). Due to the diamond-shaped geometry of the L1 constraint in parameter space, Lasso drives coefficients of non-informative features strictly to zero, performing automatic embedded feature selection.'
  },
  {
    q: '5. How does Random Forest (Bagging) differ from Gradient Boosting (Boosting)?',
    a: 'Random Forest uses Bagging (Bootstrap Aggregation): it trains multiple deep, high-variance decision trees in parallel on random bootstrap samples with random feature subsets, then averages their predictions. This dramatically reduces model variance without increasing bias. In contrast, Gradient Boosting trains shallow, high-bias decision trees sequentially: each subsequent tree fits specifically to the pseudo-residuals (negative gradient of the loss function) of the preceding ensemble, systematically reducing bias.'
  },
  {
    q: '6. Why did Gradient Boosting / Random Forest outperform Linear Regression on this dataset?',
    a: 'Under the Indian CPCB standard, the true AQI is calculated using piecewise linear sub-index breakpoint equations across multiple pollutants, where the maximum sub-index dominates. Linear Regression assumes a single continuous global linear hyperplane (y = Xw + b), which cannot accurately capture piecewise non-linear thresholds and maximum operators. Decision trees inherently partition the feature space into hyper-rectangles, naturally matching the piecewise regulatory breakpoint logic.'
  },
  {
    q: '7. What is 5-Fold Cross Validation and why is it preferred over a single Hold-Out split?',
    a: 'A single train/test split (e.g. 80/20) can be biased by an exceptionally lucky or unlucky random split. In 5-Fold Cross Validation, the dataset is partitioned into 5 equal folds. The model is trained on 4 folds and tested on the remaining 1 fold, repeated 5 times so every sample is evaluated exactly once. Reporting the Mean CV Score and Standard Deviation (e.g., 0.9964 ± 0.001) guarantees that the model generalization is stable, reliable, and not an artifact of random sampling.'
  },
  {
    q: '8. Explain the mathematical formula and significance of R² (Coefficient of Determination).',
    a: 'R² = 1 - (SS_res / SS_tot), where SS_res = Σ(yᵢ - ŷᵢ)² is the sum of squared residual errors and SS_tot = Σ(yᵢ - ȳ)² is the total variance of the target variable around its mean. R² represents the proportion of target variance explained by the model. An R² of 0.9984 means the model explains 99.84% of the variability in ambient AQI, with only 0.16% unexplained residual variance.'
  },
  {
    q: '9. How do you detect and diagnose Overfitting in this project?',
    a: 'We evaluate the Generalization Gap: (Train R² - Test R²). If a model achieves Train R² = 0.999 but Test R² = 0.85, the significant performance drop indicates high variance and overfitting (memorization of training noise). In our final tuned models, the generalization gap is under 0.002 (Train R²: 0.999, Test R²: 0.998), confirming excellent out-of-sample generalization.'
  },
  {
    q: '10. Why is median imputation preferred over mean imputation for pollutant data?',
    a: 'Ambient air pollutant concentrations (such as PM2.5, PM10, and SO2) naturally follow skewed, log-normal distributions with extreme right-tail outlier events (such as dust storms, firecracker episodes, or winter thermal inversions). The arithmetic mean is heavily distorted by extreme outliers, whereas the median is a robust non-parametric measure of central tendency.'
  },
  {
    q: '11. How is prediction uncertainty legitimately reported for regression models?',
    a: 'Supervised regression models produce continuous point estimates, not discrete softmax probabilities. Inventing a fake "95% confidence" percentage for a regression point estimate is mathematically incorrect. Instead, legitimate uncertainty is represented by the 95% Prediction Interval: [ŷ - 1.96 × RSE, ŷ + 1.96 × RSE], where RSE is the Residual Standard Error (RMSE) measured on the held-out test dataset.'
  },
  {
    q: '12. What role does Gradient Descent play in linear regression?',
    a: 'While linear regression has an exact closed-form solution via the Normal Equation (w = (XᵀX)⁻¹Xᵀy), computing matrix inversion has O(n³) computational complexity, which becomes intractable for massive datasets with thousands of features. Gradient Descent provides an iterative first-order optimization method that scales efficiently to high dimensions by taking descent steps proportional to the negative gradient: w := w - α ∇w J.'
  }
];

export default function VivaGuide() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">ML Viva & Methodology Guide</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Viva Preparation
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Curated technical cheat sheet, mathematical formulations, and answers to common examiner viva questions.
            </p>
          </div>
        </div>
      </div>

      {/* Core Concepts Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-emerald-700">
            <Scale className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Bias-Variance Tradeoff</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Linear models have high bias (underfitting non-linear breakpoints). Unconstrained deep trees have high variance. Random Forest (Bagging) and Gradient Boosting (Boosting) achieve optimal balance with minimal generalization gap.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-blue-700">
            <ShieldCheck className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Data Leakage Prevention</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All preprocessing transformers (Median Imputer, StandardScaler) are encapsulated in scikit-learn <code>Pipeline</code> objects and fitted strictly on <code>X_train</code>, guaranteeing zero contamination of the test split.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-purple-700">
            <Award className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">CPCB NAQI Regulatory Standard</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Central Pollution Control Board (CPCB) divides ambient AQI into 6 categories: Good (0-50), Satisfactory (51-100), Moderate (101-200), Poor (201-300), Very Poor (301-400), Severe (401-500+).
          </p>
        </div>
      </div>

      {/* Accordion Questions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Frequently Asked Viva Questions & Answers</h2>
            <p className="text-xs text-slate-600 mt-0.5">Click any question to view the comprehensive academic answer</p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">12 Core Questions</span>
        </div>

        <div className="space-y-3">
          {VIVA_QUESTIONS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx} 
                className={`border rounded-lg transition-colors ${
                  isOpen ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full text-left p-4 flex items-center justify-between text-xs font-bold text-slate-900 cursor-pointer"
                >
                  <span className="pr-4">{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-700 leading-relaxed border-t border-slate-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
