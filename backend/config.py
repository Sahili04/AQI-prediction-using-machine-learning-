"""
Backend Configuration: CPCB NAQI Categories & Project Settings
==============================================================
Standard: Indian National Air Quality Index (Central Pollution Control Board - CPCB)
Ministry of Environment, Forest and Climate Change (MoEFCC), Govt. of India.
"""

from typing import List, Dict, Any

# CPCB NAQI Standard Breakpoints and Categories
AQI_CATEGORIES = [
    {
        "min": 0,
        "max": 50,
        "name": "Good",
        "color": "#16a34a",          # Green
        "bgColor": "#dcfce7",
        "borderColor": "#86efac",
        "badge": "bg-green-100 text-green-800 border-green-300",
        "impact": "Minimal impact on health. Ideal ambient conditions for all age groups."
    },
    {
        "min": 51,
        "max": 100,
        "name": "Satisfactory",
        "color": "#65a30d",          # Light Green / Lime
        "bgColor": "#ecfccb",
        "borderColor": "#bef264",
        "badge": "bg-lime-100 text-lime-800 border-lime-300",
        "impact": "Minor breathing discomfort to sensitive individuals (asthma, children, elderly)."
    },
    {
        "min": 101,
        "max": 200,
        "name": "Moderate",
        "color": "#ca8a04",          # Yellow / Amber
        "bgColor": "#fef9c3",
        "borderColor": "#fde047",
        "badge": "bg-yellow-100 text-yellow-800 border-yellow-300",
        "impact": "Breathing discomfort to people with lung disease like asthma, and discomfort to people with heart diseases."
    },
    {
        "min": 201,
        "max": 300,
        "name": "Poor",
        "color": "#ea580c",          # Orange
        "bgColor": "#ffedd5",
        "borderColor": "#fdba74",
        "badge": "bg-orange-100 text-orange-800 border-orange-300",
        "impact": "Breathing discomfort to most people on prolonged exposure. May cause respiratory illness."
    },
    {
        "min": 301,
        "max": 400,
        "name": "Very Poor",
        "color": "#dc2626",          # Red
        "bgColor": "#fee2e2",
        "borderColor": "#fca5a5",
        "badge": "bg-red-100 text-red-800 border-red-300",
        "impact": "Respiratory illness on prolonged exposure. Severe effect on people with existing pulmonary/cardiac illness."
    },
    {
        "min": 401,
        "max": 9999,
        "name": "Severe",
        "color": "#7f1d1d",          # Maroon / Dark Red
        "bgColor": "#fecaca",
        "borderColor": "#f87171",
        "badge": "bg-red-200 text-red-900 border-red-400",
        "impact": "Healthy people also experience severe respiratory effects; extreme distress for people with disease. Avoid all outdoor activity."
    }
]

def get_aqi_category_info(aqi_val: float) -> Dict[str, Any]:
    """Determines CPCB category, color, and health impact for a given AQI."""
    rounded_aqi = round(aqi_val)
    for cat in AQI_CATEGORIES:
        if cat["min"] <= rounded_aqi <= cat["max"]:
            return cat
    # Fallback to Severe if > 500
    return AQI_CATEGORIES[-1]

# Feature definitions and units
FEATURE_METADATA = {
    "PM2.5": {"unit": "µg/m³", "min": 0.0, "max": 600.0, "default": 45.0, "desc": "Fine Particulate Matter (diameter <= 2.5 µm)"},
    "PM10": {"unit": "µg/m³", "min": 0.0, "max": 900.0, "default": 85.0, "desc": "Coarse Particulate Matter (diameter <= 10 µm)"},
    "NO2": {"unit": "µg/m³", "min": 0.0, "max": 300.0, "default": 35.0, "desc": "Nitrogen Dioxide from vehicular traffic"},
    "NOx": {"unit": "ppb", "min": 0.0, "max": 400.0, "default": 55.0, "desc": "Total Nitrogen Oxides"},
    "SO2": {"unit": "µg/m³", "min": 0.0, "max": 250.0, "default": 18.0, "desc": "Sulphur Dioxide from thermal plants / industry"},
    "CO": {"unit": "mg/m³", "min": 0.0, "max": 25.0, "default": 1.2, "desc": "Carbon Monoxide from incomplete combustion"},
    "O3": {"unit": "µg/m³", "min": 0.0, "max": 300.0, "default": 40.0, "desc": "Surface Ozone formed photochemically"},
    "Temperature": {"unit": "°C", "min": -10.0, "max": 55.0, "default": 27.0, "desc": "Ambient Ambient Dry-Bulb Temperature"},
    "Humidity": {"unit": "%", "min": 5.0, "max": 100.0, "default": 60.0, "desc": "Relative Humidity"},
    "Wind_Speed": {"unit": "m/s", "min": 0.1, "max": 25.0, "default": 3.2, "desc": "Surface Wind Velocity (promotes dispersion)"}
}
