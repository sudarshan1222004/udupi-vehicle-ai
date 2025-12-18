# 🚖 AI-Driven Vehicle Matching & Dynamic Pricing System (for Udupi/Manipal)

[cite_start]An end-to-end mobility solution featuring a **Vite + React** frontend, a **FastAPI** backend, and a **Random Forest ML** model[cite: 3, 21]. [cite_start]This project predicts ETA and implements surge pricing for the **Udupi/Manipal** region, specifically developed for the **UNLOADIN** AI/ML Engineering Internship[cite: 4, 10, 23].

---

## 🏗️ Project Architecture & Workflow

[cite_start]The system is designed as a decoupled full-stack application to simulate a production-ready "live system"[cite: 21, 23].

### 1. AI/ML Backend (Python)
[cite_start]The backend handles the data science and core decision logic[cite: 11, 21]:
* [cite_start]**Data Pipeline (`generate_data.py`)**: Uses **Pandas** and **NumPy** to create a 10,000-sample mobility dataset with geo-coordinate boundaries specifically for the **Udupi-Manipal** region[cite: 8, 9, 42].
* [cite_start]**Model Training (`train_model.py`)**: Utilizes **Scikit-learn** to train a **Random Forest Regressor** to predict ETA based on trip distance, hour of the day, and vehicle type[cite: 12, 13, 17, 42].
* **Ranking Engine (`ranking_engine.py`)**: The "Brain" of the app. [cite_start]It calculates dynamic surge pricing (1.45x) during Udupi rush hours (9–11 AM and 5–9 PM) [cite: 16, 17] [cite_start]and ranks vehicles based on user preferences: **Cheapest**, **Fastest**, or **Balanced**[cite: 18, 19].
* [cite_start]**API Service (`main.py`)**: Dedicated FastAPI service running on **Port 8001** to serve the production React frontend[cite: 21, 23].
* [cite_start]**Admin Console (`app.py`)**: A separate FastAPI service on **Port 8000** for manual logic testing and developer verification[cite: 43].

### 2. Validation & Quality Assurance
[cite_start]Professional testing is integrated to satisfy the "test inference performance" and logic accuracy requirements[cite: 33, 34]:
* [cite_start]**Logic Validation (`tests/test_logic.py`)**: A comprehensive test suite that validates the backend math, ensuring the ranking engine returns the correct top 3 vehicles and triggers surge pricing multipliers correctly[cite: 33, 38].
* [cite_start]**Visual Evaluation (`evaluate_plots.py`)**: Generates visual proof of model intelligence[cite: 31, 40]:
    * [cite_start]**Accuracy Scatter Plot**: Visualizes Actual vs. Predicted ETA[cite: 31, 36].
    * [cite_start]**Feature Importance**: Proves how `trip_distance` and `hour_of_day` drive the AI’s decisions[cite: 10, 31, 40].

### 3. Intelligent Frontend (Vite + React)
[cite_start]A premium, dark-themed responsive user interface[cite: 26, 39]:
* **Sidebar Controls**: Features pickup and drop-off inputs with a "Current Location" GPS trigger. All selected location names appear clearly.
* [cite_start]**Interactive Map**: Built with **Leaflet**, allowing users to set points by clicking the map[cite: 24]. [cite_start]It renders a real-road "Blue Line" route using OSRM data[cite: 25].
* **Live Simulation**: Upon confirmation, a taxi marker physically animates toward the pickup point, accompanied by a dynamic **OTP generator** and a **Driver Tip** section.
* [cite_start]**Real-time Engine**: Fetches live data from the FastAPI server on Port 8001, displaying predicted ETA, fare, and surge status[cite: 23, 30].

---

## 🛠️ Tech Stack
* [cite_start]**Frontend**: React.js (Vite), Leaflet.js, Tailwind CSS, Lucide Icons[cite: 42, 43].
* [cite_start]**Backend**: Python 3.8+, FastAPI, Uvicorn[cite: 42, 43].
* [cite_start]**Machine Learning**: Scikit-learn (Random Forest), Pandas, NumPy[cite: 42].
* [cite_start]**Geospatial**: OpenStreetMap (OSRM) for real-road routing[cite: 7, 24].

---

## 📡 API Walkthrough
[cite_start]The system exposes a primary endpoint for ride quotes[cite: 21, 23]:

### **Endpoint**: `POST /predict_ride`
[cite_start]**Description**: Returns ranked vehicle options with AI-predicted ETA and dynamic pricing[cite: 18, 23].

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
---
**Sample Response**:
[
  {
    "vehicle": "Auto",
    "fare": 65,
    "eta": 9,
    "demand": "High"
  },
  {
    "vehicle": "Bike",
    "fare": 42,
    "eta": 6,
    "demand": "High"
  }
]
---
🖥️ UI Walkthrough
Selection: Click two points on the map or use the search bar to set Pickup and Drop-off locations.

AI Inference: The system automatically communicates with the FastAPI backend to calculate the best route and prices.

Selection: Choose your preferred vehicle (Bike, Auto, Sedan) from the ranked list.

Confirmation: Click 'Request' to see the driver simulation, the secure OTP, and the driver tip interface.

## 🚦 Execution Guide

### Backend & Logic Setup
```bash

#Create and Activate Virtual Environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# 1. Generate the dataset
python backend/generate_data.py

# 2. Train the Random Forest Model
python backend/train_model.py

# 3. Process Ranking Engine Logic (Verify AI Scoring)
python backend/ranking_engine.py

# 4. Generate Accuracy Plots (MAE/R2)
python backend/evaluate_plots.py

# 5. Run Logic Validation Tests
python backend/tests/test_logic.py

# 6. Start the Production API (Port 8001)
python backend/app.py
-----------------------------------------------------------------------

###Frontend execution :

# Navigate to backend folder & run
python main.py

# Navigate to frontend folder in another terminal 
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev