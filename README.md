---

#🚀 AI-Driven Ride-Hailing PlatformAn intelligent, full-stack application simulating a real-world mobility system with AI-based pricing, ETA prediction, and real-time routing.

**Submission for UNLOADIN AI/ML Engineering Internship.**

---

##✨ Project Highlights (Why it's Smart)This platform simulates a real-world ride-hailing service with intelligent features:

* **Smart Pricing & ETA:** Predicts trip duration (ETA) and calculates dynamic prices using a trained **Random Forest AI model**. Prices surge (1.4x) during peak traffic hours (9-11 AM and 5-8 PM).
* **Real-Time Mapping:** Uses **Leaflet Maps** and **OSRM** (Open Source Routing Machine) to calculate and display the **actual road path** between locations (the Blue Line).
* **Fault Tolerance:** Automatically switches to a simple straight-line distance fallback if the external OSRM routing server is unavailable.
* **Full Ride Simulation:** Simulates driver assignment, real-time vehicle movement to the pickup point, and OTP generation for the final booking flow.

---

##🛠️ Tech Stack| Component | Key Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React.js, Vite, Leaflet Maps, Axios | User Interface, Map Visualization |
| **Backend API** | **FastAPI** (Python), Uvicorn | High-speed API for pricing and ETA prediction |
| **AI/ML** | Scikit-Learn (Random Forest), Pandas | Model training and serving |
| **Data** | Synthetic Dataset (Udupi City) | Data source for training the Random Forest model |

---

##⚙️ Setup and Run InstructionsFollow these steps to get both the Backend API (the Brain) and the Frontend App (the Interface) running.

###1. Backend Setup (API Server)The backend handles the pricing logic and AI predictions.

1. **Navigate to the Root Directory:**
```bash
cd udupi-vehicle-ai

```


2. **Activate Virtual Environment (Crucial Step):**
```bash
.\venv\Scripts\activate

```


3. **Install Python Dependencies:**
```bash
pip install -r requirements.txt

```


4. **Train the AI Model (Run these only once):**
```bash
# Generate Synthetic Data
python generate_data.py

# Train the Model and save eta_model.pkl
python train_model.py 

```


5. **Start the API Server:**
```bash
# Run Uvicorn from the ROOT directory
uvicorn backend.main:app --reload

```


*The server will start at `http://127.0.0.1:8000`. Keep this terminal window open.*

###2. Frontend Setup (User Interface)The frontend hosts the map and the booking panel.

1. **Open a NEW Terminal** and navigate to the frontend folder:
```bash
cd frontend

```


2. **Install Node Dependencies:**
```bash
npm install

```


3. **Start the Web Application:**
```bash
npm run dev

```


*Open the link shown (e.g., `http://localhost:5173`) to launch the app.*

---

##🗺️ How to Use the Application| Step | Action | Result |
| --- | --- | --- |
| **1. Set Locations** | Click anywhere on the map to set the Pickup (Green) and Drop (Red) points. | The application draws the blue route path and calls the backend for pricing. |
| **2. Choose Ride** | View the list of predicted options (Bike, Auto, Sedan, etc.) with the dynamic price and ETA. | Select your preferred vehicle option. |
| **3. Book Ride** | Click the "Book" button. | The system simulates a driver being found, displays the driver's vehicle moving to your location, and shows an OTP upon arrival. |

---

##📊 Model Performance| Metric | Value | Interpretation |
| --- | --- | --- |
| **Algorithm** | Random Forest Regressor | High-accuracy, non-linear prediction model. |
| **R2 Score** | > 0.90 | Over 90% of the variance in trip time is explained by the model's features. |
| **MAE** | < 2.0 minutes | The predicted trip time is typically off by less than 2 minutes. |