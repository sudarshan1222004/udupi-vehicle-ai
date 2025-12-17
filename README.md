# 🚖 Udupi AI-Driven Vehicle Matching & Dynamic Pricing System

An end-to-end mobility solution featuring a **Vite + React** frontend, a **FastAPI** backend, and a **Random Forest ML** model. This project predicts ETA and implements surge pricing for the **Udupi/Manipal** region, specifically developed for the **UNLOADIN** AI/ML Engineering Internship.

---

## 🏗️ Project Architecture & Workflow

The system is designed as a decoupled full-stack application to simulate a production-ready "live system".

### 1. AI/ML Backend (Python)
The backend handles the data science and core decision logic:
* **Data Pipeline (`generate_data.py`)**: Uses **Pandas** and **NumPy** to create a 10,000-sample mobility dataset with geo-coordinate boundaries specifically for the **Udupi-Manipal** region.
* **Model Training (`train_model.py`)**: Utilizes **Scikit-learn** to train a **Random Forest Regressor** to predict ETA based on trip distance, hour of the day, vehicle type, and temporal features.
* **Ranking Engine (`ranking_engine.py`)**: The "Brain" of the app. It calculates dynamic surge pricing (1.45x) during Udupi rush hours (9–11 AM and 5–9 PM) and ranks vehicles based on user preferences: **Cheapest**, **Fastest**, or **Balanced**.
* **API Service (`main.py`)**: Dedicated FastAPI service running on **Port 8001** to serve the production React frontend.
* **Admin Console (`app.py`)**: A separate FastAPI service on **Port 8000** for manual logic testing and developer verification.

### 2. Validation & Quality Assurance
Professional testing is integrated to satisfy the "test inference performance" and logic accuracy requirements:
* **Logic Validation (`tests/test_logic.py`)**: A comprehensive test suite that validates the backend math, ensuring the ranking engine returns the correct top 3 vehicles and triggers surge pricing multipliers correctly.
* **Visual Evaluation (`evaluate_plots.py`)**: Generates visual proof of model intelligence:
    * **Accuracy Scatter Plot**: Visualizes Actual vs. Predicted ETA.
    * **Feature Importance**: Proves how `trip_distance` and `hour_of_day` drive the AI’s decisions.

### 3. Intelligent Frontend (Vite + React)
A premium, dark-themed responsive user interface featuring a modern "Glassmorphism" aesthetic:
* **Sidebar Controls**: Features pickup and drop-off inputs with a "Current Location" GPS trigger. All selected location names appear in high-contrast white for clarity.
* **Interactive Map**: Built with **Leaflet**, allowing users to set points by clicking the map. It renders a real-road "Blue Line" route using OSRM data.
* **Live Simulation**: Upon confirmation, a taxi marker physically animates toward the pickup point, accompanied by a dynamic **OTP generator** and a **Driver Tip** section.
* **Real-time Engine**: Fetches live data from the FastAPI server on Port 8001, displaying predicted ETA, fare, and surge status.

---

## 🚦 Execution Guide

### Backend & Logic Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# 1. Generate the mobility dataset
python backend/generate_data.py

# 2. Train the Random Forest Model
python backend/train_model.py

# 3. Generate Accuracy Plots
python backend/evaluate_plots.py

# 4. Run Logic Validation Tests
python backend/tests/test_logic.py

# 5. Start the Production API (Port 8001)
python backend/main.py
-----------------------------------------------------------------------
Frontend execution

# Navigate to backend folder & run
python main.py

# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev