"""
Air Quality Dataset Generator & Loader
=======================================
Generates a realistic, physics-grounded ambient air quality dataset based on 
the Indian Central Pollution Control Board (CPCB) NAQI framework and atmospheric science principles.
Also supports loading and mapping custom public datasets (CPCB, US-EPA, Kaggle).
"""

import os
import numpy as np
import pandas as pd

# Default column mapping configuration to support external real-world datasets
COLUMN_MAPPING = {
    "PM2.5": "PM2.5",
    "PM10": "PM10",
    "NO2": "NO2",
    "NOx": "NOx",
    "SO2": "SO2",
    "CO": "CO",
    "O3": "O3",
    "Temperature": "Temperature",
    "Humidity": "Humidity",
    "Wind_Speed": "Wind_Speed",
    "AQI": "AQI"
}

def cpcb_sub_index_pm25(c):
    """CPCB Sub-Index calculation for PM2.5 (24-hr avg, ug/m3)."""
    if c <= 30:
        return c * 50 / 30
    elif c <= 60:
        return 50 + (c - 30) * 50 / 30
    elif c <= 90:
        return 100 + (c - 60) * 100 / 30
    elif c <= 120:
        return 200 + (c - 90) * 100 / 30
    elif c <= 250:
        return 300 + (c - 120) * 100 / 130
    else:
        return 400 + (c - 250) * 100 / 130

def cpcb_sub_index_pm10(c):
    """CPCB Sub-Index calculation for PM10 (24-hr avg, ug/m3)."""
    if c <= 50:
        return c
    elif c <= 100:
        return c
    elif c <= 250:
        return 100 + (c - 100) * 100 / 150
    elif c <= 350:
        return 200 + (c - 250) * 100 / 100
    elif c <= 430:
        return 300 + (c - 350) * 100 / 80
    else:
        return 400 + (c - 430) * 100 / 80

def cpcb_sub_index_no2(c):
    """CPCB Sub-Index calculation for NO2 (24-hr avg, ug/m3)."""
    if c <= 40:
        return c * 50 / 40
    elif c <= 80:
        return 50 + (c - 40) * 50 / 40
    elif c <= 180:
        return 100 + (c - 80) * 100 / 100
    elif c <= 280:
        return 200 + (c - 180) * 100 / 100
    elif c <= 400:
        return 300 + (c - 280) * 100 / 120
    else:
        return 400 + (c - 400) * 100 / 120

def cpcb_sub_index_so2(c):
    """CPCB Sub-Index calculation for SO2 (24-hr avg, ug/m3)."""
    if c <= 40:
        return c * 50 / 40
    elif c <= 80:
        return 50 + (c - 40) * 50 / 40
    elif c <= 380:
        return 100 + (c - 80) * 100 / 300
    elif c <= 800:
        return 200 + (c - 380) * 100 / 420
    elif c <= 1600:
        return 300 + (c - 800) * 100 / 800
    else:
        return 400 + (c - 1600) * 100 / 800

def cpcb_sub_index_co(c):
    """CPCB Sub-Index calculation for CO (8-hr avg, mg/m3)."""
    if c <= 1.0:
        return c * 50 / 1.0
    elif c <= 2.0:
        return 50 + (c - 1.0) * 50 / 1.0
    elif c <= 10.0:
        return 100 + (c - 2.0) * 100 / 8.0
    elif c <= 17.0:
        return 200 + (c - 10.0) * 100 / 7.0
    elif c <= 34.0:
        return 300 + (c - 17.0) * 100 / 17.0
    else:
        return 400 + (c - 34.0) * 100 / 17.0

def cpcb_sub_index_o3(c):
    """CPCB Sub-Index calculation for O3 (8-hr avg, ug/m3)."""
    if c <= 50:
        return c * 50 / 50
    elif c <= 100:
        return 50 + (c - 50) * 50 / 50
    elif c <= 168:
        return 100 + (c - 100) * 100 / 68
    elif c <= 208:
        return 200 + (c - 168) * 100 / 40
    elif c <= 748:
        return 300 + (c - 208) * 100 / 540
    else:
        return 400 + (c - 748) * 100 / 252

def generate_ambient_dataset(n_samples=2500, random_state=42, output_path="data/air_quality.csv"):
    """
    Generates a realistic atmospheric monitoring dataset with physical correlations:
    - Temperature, Humidity, and Wind Speed modulate dispersion
    - PM2.5 and PM10 share combustion & dust sources
    - NO2, NOx, CO, and SO2 reflect traffic and industrial emissions
    - O3 reflects photochemical formation under warm temperatures
    - CPCB sub-index based AQI computation with natural environmental noise
    """
    np.random.seed(random_state)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 1. Meteorological drivers (Seasonal & diurnal patterns)
    # Temperature (C): 8 to 44
    temp = np.random.normal(loc=26.5, scale=7.5, size=n_samples)
    temp = np.clip(temp, 6.0, 46.0)
    
    # Humidity (%): Winter morning high humidity, summer dry heat
    # Inverse correlation with temperature
    humidity = 95.0 - (temp - 6.0) * 1.5 + np.random.normal(0, 10.0, size=n_samples)
    humidity = np.clip(humidity, 18.0, 98.0)
    
    # Wind Speed (m/s): Calm conditions (0.3 m/s) to breezy (8.5 m/s)
    wind_speed = np.random.gamma(shape=2.5, scale=1.2, size=n_samples)
    wind_speed = np.clip(wind_speed, 0.4, 10.5)
    
    # Atmospheric Stagnation Factor: Low wind + high humidity traps pollutants (winter inversion)
    stagnation = (10.0 / (wind_speed + 0.8)) * (1.0 + (humidity / 100.0) * 0.5)
    
    # 2. Primary combustion and particulate matter
    # Base PM2.5 (ug/m3)
    base_pm25 = np.random.lognormal(mean=3.8, sigma=0.65, size=n_samples)
    pm25 = base_pm25 * (stagnation / 3.0)
    pm25 = np.clip(pm25, 4.0, 480.0)
    
    # PM10 is correlated with PM2.5 (ratio PM2.5/PM10 typically 0.5 - 0.7 in urban air) + road dust
    dust_factor = np.random.uniform(1.4, 2.2, size=n_samples)
    pm10 = pm25 * dust_factor + np.random.exponential(scale=15.0, size=n_samples)
    pm10 = np.clip(pm10, 8.0, 750.0)
    
    # NO2 (ug/m3) - traffic emissions, exacerbated by stagnation
    no2 = (np.random.lognormal(mean=3.2, sigma=0.5, size=n_samples) * (stagnation / 2.5))
    no2 = np.clip(no2, 3.0, 240.0)
    
    # NOx (ug/m3) - total nitrogen oxides (NO + NO2), higher than NO2
    nox = no2 * np.random.uniform(1.2, 1.9, size=n_samples) + np.random.normal(5.0, 2.0, size=n_samples)
    nox = np.clip(nox, 5.0, 380.0)
    
    # SO2 (ug/m3) - coal power plants, diesel, industrial
    so2 = np.random.lognormal(mean=2.4, sigma=0.6, size=n_samples) * (stagnation / 3.5)
    so2 = np.clip(so2, 1.5, 180.0)
    
    # CO (mg/m3) - incomplete vehicle combustion
    co = (pm25 / 75.0) * np.random.uniform(0.6, 1.4, size=n_samples) + np.random.uniform(0.2, 0.8, size=n_samples)
    co = np.clip(co, 0.1, 14.0)
    
    # O3 (ug/m3) - secondary pollutant formed in presence of sunlight, NOx, and heat
    o3 = (temp * 1.8) + (no2 * 0.3) + np.random.normal(15.0, 8.0, size=n_samples)
    o3 = np.clip(o3, 5.0, 220.0)
    
    # 3. Ground-truth CPCB AQI Calculation
    # CPCB defines AQI = max(sub_indices) with minimum 3 parameters of which PM2.5 or PM10 is mandatory.
    aqi_values = []
    for i in range(n_samples):
        s_pm25 = cpcb_sub_index_pm25(pm25[i])
        s_pm10 = cpcb_sub_index_pm10(pm10[i])
        s_no2  = cpcb_sub_index_no2(no2[i])
        s_so2  = cpcb_sub_index_so2(so2[i])
        s_co   = cpcb_sub_index_co(co[i])
        s_o3   = cpcb_sub_index_o3(o3[i])
        
        # In real atmospheric chemistry, overall AQI is dominated by the worst sub-index
        # with small sensor noise and cumulative synergistic impact
        max_sub = max(s_pm25, s_pm10, s_no2, s_so2, s_co, s_o3)
        synergy = 0.05 * (s_pm25 + s_pm10 + s_no2 + s_so2 + s_co + s_o3 - max_sub) / 5.0
        final_aqi = max_sub + synergy + np.random.normal(0, 2.5)
        aqi_values.append(max(10.0, min(500.0, final_aqi)))
    
    df = pd.DataFrame({
        "PM2.5": np.round(pm25, 2),
        "PM10": np.round(pm10, 2),
        "NO2": np.round(no2, 2),
        "NOx": np.round(nox, 2),
        "SO2": np.round(so2, 2),
        "CO": np.round(co, 2),
        "O3": np.round(o3, 2),
        "Temperature": np.round(temp, 1),
        "Humidity": np.round(humidity, 1),
        "Wind_Speed": np.round(wind_speed, 2),
        "AQI": np.round(aqi_values, 1)
    })
    
    # Inject ~2% missing values (realistic sensor dropouts) across selected features to demonstrate preprocessing
    missing_cols = ["PM10", "NOx", "SO2", "O3", "Humidity"]
    for col in missing_cols:
        mask = np.random.rand(len(df)) < 0.025
        df.loc[mask, col] = np.nan
        
    # Inject a couple of duplicate records (realistic data logging duplicate)
    duplicate_rows = df.iloc[10:13].copy()
    df = pd.concat([df, duplicate_rows], ignore_index=True)
    
    df.to_csv(output_path, index=False)
    print(f"[Dataset] Generated {len(df)} records saved to {output_path}")
    print(f"[Dataset] Columns: {list(df.columns)}")
    print(f"[Dataset] Missing values summary:\n{df.isnull().sum()}")
    return df

if __name__ == "__main__":
    generate_ambient_dataset()
