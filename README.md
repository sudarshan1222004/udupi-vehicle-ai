# 🚖 AI-Driven Vehicle Matching & Dynamic Pricing System (for Udupi/Manipal)

An end-to-end mobility solution featuring a **Vite + React** frontend, a **FastAPI** backend, and a **Random Forest ML** model. This project predicts ETA and implements surge pricing for the **Udupi/Manipal** region, specifically developed for the **UNLOADIN** AI/ML Engineering Internship.

---

## 🏗️ Project Architecture & Workflow

The system is designed as a decoupled full-stack application to simulate a production-ready "live system".

### 1. AI/ML Backend (Python)

The backend handles the data science and core decision logic:

* 
**Data Pipeline (`generate_data.py`)**: Uses **Pandas** and **NumPy** to create a 10,000-sample mobility dataset with geo-coordinate boundaries specifically for the **Udupi-Manipal** region.


* 
**Model Training (`train_model.py`)**: Utilizes **Scikit-learn** to train a **Random Forest Regressor** to predict ETA based on trip distance, hour of the day, and vehicle type.


* **Ranking Engine (`ranking_engine.py`)**: The "Brain" of the app. It calculates dynamic surge pricing (1.45x) during Udupi rush hours (9–11 AM and 5–9 PM) and ranks vehicles based on user preferences: **Cheapest**, **Fastest**, or **Balanced**.


* 
**API Service (`main.py`)**: Dedicated FastAPI service running on **Port 8001** to serve the production React frontend.


* 
**Admin Console (`app.py`)**: A separate FastAPI service on **Port 8000** for manual logic testing and developer verification.



### 2. Validation & Quality Assurance

Professional testing is integrated to satisfy the "test inference performance" and logic accuracy requirements:

* 
**Logic Validation (`tests/test_logic.py`)**: A comprehensive test suite that validates the backend math, ensuring the ranking engine returns the correct top 3 vehicles and triggers surge pricing multipliers correctly.


* 
**Visual Evaluation (`evaluate_plots.py`)**: Generates visual proof of model intelligence:


* 
**Accuracy Scatter Plot**: Visualizes Actual vs. Predicted ETA.


* 
**Feature Importance**: Proves how `trip_distance` and `hour_of_day` drive the AI’s decisions.





### 3. Intelligent Frontend (Vite + React)

A premium, dark-themed responsive user interface:

* **Sidebar Controls**: Features pickup and drop-off inputs with a "Current Location" GPS trigger. All selected location names appear clearly in high-contrast white.
* 
**Interactive Map**: Built with **Leaflet**, allowing users to set points by clicking the map and rendering real-road routes via OSRM data.


* **Live Simulation**: Upon confirmation, a taxi marker physically animates toward the pickup point, accompanied by a dynamic **OTP generator** and a **Driver Tip** section.
* 
**Real-time Engine**: Fetches live data from the FastAPI server on Port 8001, displaying predicted ETA, fare, and surge status.



---

## 🛠️ Tech Stack

* 
**Frontend**: React.js (Vite), Leaflet.js, Tailwind CSS, Lucide Icons.


* 
**Backend**: Python 3.8+, FastAPI, Uvicorn.


* 
**Machine Learning**: Scikit-learn (Random Forest), Pandas, NumPy.


* 
**Geospatial**: OpenStreetMap (OSRM) for real-road routing.



---

## 📡 API Walkthrough

The system exposes a primary endpoint for ride quotes:

### **Endpoint**: `POST /predict_ride`

**Description**: Returns ranked vehicle options with AI-predicted ETA, distance, and dynamic pricing.

**Sample Request**:

```json
{
  "start_lat": 13.3409,
  "start_lon": 74.7421,
  "end_lat": 13.3500,
  "end_lon": 74.7500,
  "hour": 18,
  "preference": "balanced"
}

```

**Sample Response**:

```json
[
  {
    "vehicle": "Auto",
    "fare": 65,
    "eta": 9,
    "distance_km": 5.2,
    "demand": "High"
  },
  {
    "vehicle": "Bike",
    "fare": 42,
    "eta": 6,
    "distance_km": 5.2,
    "demand": "High"
  },
  {
    "vehicle": "Sedan",
    "fare": 135,
    "eta": 7,
    "distance_km": 5.2,
    "demand": "High"
  }
]

```

---

## 🖥️ UI Walkthrough

### **Phase 1: Backend Admin Console Verification**

1. Run `python backend/app.py` in your terminal.
2. Click the local URL generated (usually `http://127.0.0.1:8000`) to open the web-based Admin Console.
3. Use the HTML form to manually input coordinates and verify that the ML model returns the correct JSON quote and ranking logic.

### **Phase 2: Production Frontend Experience**

1. **Selection**: Click two points on the map or use the search bar to set Pickup and Drop-off locations(use arrow icon to select current location and pickup location).
2. **AI Inference**: The system automatically communicates with the FastAPI backend on Port 8001 to calculate the best route and prices.
3. **Selection**: Choose your preferred vehicle from the ranked list based on your 'Fastest' or 'Cheapest' preference.
4. **Confirmation**: Click 'Request' to trigger the driver movement simulation, the secure OTP display, and the driver tip interface.

---

## 🚦 Execution Guide

### Backend & Logic Setup

```bash
# 1. Create and Activate Virtual Environment
python -m venv .venv

# On Windows:
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Data & Model Preparation
python backend/generate_data.py
python backend/train_model.py
python backend/ranking_engine.py

# 4. Evaluation & Testing
python backend/evaluate_plots.py
python backend/tests/test_logic.py

# 5. API Testing  
python backend/app.py

```

### Frontend Execution

```bash
#in terminal 1 
python backend/app.py

# Open a new terminal and navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start and open the development server
npm run dev

```

---
