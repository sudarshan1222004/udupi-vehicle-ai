# 🚖 Udupi AI-Driven Vehicle Matching & Dynamic Pricing System

An end-to-end mobility solution featuring a **Vite + React** frontend, a **FastAPI** backend, and a **Random Forest ML** model. [cite_start]This project predicts ETA and implements surge pricing for the **Udupi/Manipal** region, specifically developed for the **UNLOADIN** AI/ML Engineering Internship.[cite: 1, 23].

---

## 🏗️ Project Architecture & Workflow

[cite_start]The system is designed as a decoupled full-stack application to simulate a production-ready "live system".

### 1. AI/ML Backend (Python)
The backend handles the data science and core decision logic:
* [cite_start]**Data Pipeline (`generate_data.py`)**: Uses **Pandas** and **Numpy** to create a 10,000-sample mobility dataset. [cite_start]It uses geo-coordinate boundaries specifically for **Udupi -manipal region*[cite: 2, 11].
* [cite_start]**Model Training (`train_model.py`)**: Utilizes **Scikit-learn** to train a **Random Forest Regressor** to predict ETA based on trip distance,hour of the day, vehicle type, and temporal features[cite: 10, 16, 17].
* **Ranking Engine (`ranking_engine.py`)**: The "Brain" of the app. [cite_start]It calculates dynamic surge pricing (1.45x) during Udupi rush hours (9–11 AM and 5–9 PM) [cite: 11] and ranks vehicles based on user preferences: **Cheapest**, **Fastest**, or **Balanced**.
* [cite_start]**API Service (`app.py`)**: Built with **FastAPI** to serve real-time model inference and communicate with the frontend.



### 2. Validation & Quality Assurance
[cite_start]Professional testing is integrated to satisfy the "test inference performance" requirement:
* [cite_start]**Logic Testing (`tests/test_logic.py`)**: Validates the backend math, ensuring the ranking engine returns the correct top 3 vehicles and triggers surge pricing correctly.
* **Visual Evaluation (`evaluate_plots.py`)**: Generates visual proof of model intelligence:
    * **Accuracy Scatter Plot**: Shows Actual vs. Predicted ETA.
    * **Feature Importance**: Proves how `trip_distance` and `hour_of_day` drive the AI’s decisions.



### 3. Intelligent Frontend (Vite + React)
A modern, responsive user interface located in the `/frontend` directory:
* **Location Interaction**: Components like `LocationSearch.jsx` allow users to select pickup and drop points via coordinates or use the arrow marker to select their current location.
* **Real-time Predictions**: Displays live vehicle recommendations fetched from the FastAPI backend, showing ETA, Fare, and trip distance .

---

## 🚦 Getting Started

### Backend Execution (Run in Order from root folder)
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

# 5. Start the FastAPI Server
python backend/app.py