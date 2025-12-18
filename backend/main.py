##api for front end (react)
import uvicorn
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ranking_engine import get_vehicle_recommendations

app = FastAPI(title="Udupi Smart Ride - Production API")

# --- CORS CONFIGURATION ---
# Allows your React frontend (localhost:5173) to talk to the AI model
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict_ride")
def predict_ride(start_lat: float, start_lon: float, end_lat: float, end_lon: float, hour: int, preference: str = "balanced"):
    """
    Production endpoint for React Frontend.
    Provides ETA, Dynamic Pricing, and Ranking.
    """
    try:
        # 1. Distance Calculation (Udupi-Manipal Bounds)
        dist = round(np.sqrt((end_lat - start_lat)**2 + (end_lon - start_lon)**2) * 111, 2)
        
        # 2. Get recommendations from the ML Ranking Engine
        recommendations = get_vehicle_recommendations(start_lat, start_lon, end_lat, end_lon, hour, preference)
        
        # 3. Format for Frontend JSON
        results = recommendations.to_dict(orient="records") if hasattr(recommendations, 'to_dict') else recommendations
        for r in results:
            r['distance'] = dist
            
        return results
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Running on 8001 to avoid Port 8000 conflicts
    uvicorn.run(app, host="127.0.0.1", port=8001)