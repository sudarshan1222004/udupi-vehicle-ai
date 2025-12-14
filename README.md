```markdown
# AI-Driven Vehicle Matching and Pricing System

An intelligent ride-hailing platform featuring AI-based ETA prediction, dynamic pricing, and real-time routing.
Submission for UNLOADIN AI/ML Engineering Internship.

---

## Project Overview
This full-stack application simulates a real-world mobility market. It matches users with vehicles based on:
1. AI ETA Prediction: A Random Forest model (trained on 5,000+ synthetic rides) predicts trip duration based on traffic and time of day.
2. Dynamic Pricing: Implements surge pricing logic (1.4x multiplier) during rush hours (9-11 AM and 5-8 PM).
3. Smart Routing: Uses OSRM (Open Source Routing Machine) to calculate real road paths and distances.
4. Vehicle Ranking: Automatically ranks options (Auto, Bike, Car) by price and estimated time.
5. Fault Tolerance: Includes a fallback mechanism to switch to straight-line distance if the routing server is busy.

---

## Tech Stack
- Frontend: React.js, Vite, Leaflet Maps, Axios
- Backend: FastAPI (Python), Uvicorn
- Machine Learning: Scikit-Learn (Random Forest), Pandas, NumPy
- Data Source: Synthetic dataset simulating Udupi city traffic patterns.

---

## Setup and Run Instructions

### 1. Backend Setup (The AI Brain)
Open a terminal in the backend folder:
```bash
cd backend
pip install -r requirements.txt

# Step A: Generate Synthetic Data and Train Model
python generate_data.py
python train_model.py

# Step B: Start the API Server
uvicorn main:app --reload

```

The server will start at https://www.google.com/search?q=http://127.0.0.1:8000

###2. Running TestsTo verify data integrity and model performance:

```bash
# In backend terminal
python test_project.py
python evaluate_model.py

```

###3. Frontend Setup (The User App)Open a new terminal in the frontend folder:

```bash
cd frontend
npm install
npm run dev

```

Open the link shown (e.g., http://localhost:5173) to launch the app.

---

##How to Use1. Select Locations: Click on the map to set Pickup (Green) and Drop (Red) points.
2. View Route: The app calculates the actual road path (Blue Line). (Note: If the public OSRM server is busy, it automatically falls back to a straight-line path and alerts the user.)
3. Choose Vehicle: View AI-predicted prices and ETAs for Auto, Bike, or Car.
4. Book Ride: Click "Book". The system simulates a driver finding you and arriving with an OTP.

---

##Model Performance* Algorithm: Random Forest Regressor
* Metrics: R2 Score > 0.90, MAE < 2.0 mins.
* Artifacts: Trained model saved as eta_model.pkl.

---

Author: Sudarshan

```

```
