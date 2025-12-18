import uvicorn
import numpy as np
import os
from fastapi import FastAPI, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

# Import the logic from ranking_engine.py
from ranking_engine import get_vehicle_recommendations

app = FastAPI(title="Udupi AI - Smart Ride Console")

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PREMIUM UI/UX TEMPLATE ---
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Udupi AI | Admin Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: #f8fafc; }
        .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); }
        input, select { background: #1e293b !important; border: 1px solid #334155 !important; color: white !important; }
        input:focus { border-color: #3b82f6 !important; ring: 2px #3b82f6; }
        ::-webkit-inner-spin-button { opacity: 1; } /* Ensure arrows are visible */
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
    <div class="container max-w-4xl glass rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        <div class="md:w-1/3 bg-blue-600 p-8 flex flex-col justify-between text-white">
            <div>
                <h1 class="text-3xl font-bold mb-2">Smart Ride AI</h1>
                <p class="text-blue-100 text-sm">Udupi-Manipal Regional Engine v2.0</p>
            </div>
            <div class="space-y-4 text-xs opacity-80">
                <p>● Random Forest ETA Model</p>
                <p>● 1.45x Surge Pricing Logic</p>
                <p>● Multi-Vehicle Ranking</p>
            </div>
        </div>

        <div class="md:w-2/3 p-8 bg-slate-900/50">
            <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
                <span class="w-2 h-6 bg-blue-500 rounded-full"></span>
                Inference Manual Console
            </h2>

            <form method="post" action="/test" class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-slate-400">Pickup Latitude</label>
                        <input type="number" step="0.0001" name="start_lat" value="13.3516" class="p-3 rounded-xl outline-none transition-all">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-slate-400">Pickup Longitude</label>
                        <input type="number" step="0.0001" name="start_lon" value="74.7421" class="p-3 rounded-xl outline-none transition-all">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-slate-400">Drop Latitude</label>
                        <input type="number" step="0.0001" name="end_lat" value="13.3441" class="p-3 rounded-xl outline-none transition-all">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-slate-400">Drop Longitude</label>
                        <input type="number" step="0.0001" name="end_lon" value="74.7860" class="p-3 rounded-xl outline-none transition-all">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-slate-400">Operating Hour (6-23)</label>
                        <input type="number" name="hour" value="10" min="6" max="23" class="p-3 rounded-xl outline-none transition-all">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-slate-400">Ranking Strategy</label>
                        <select name="preference" class="p-3 rounded-xl outline-none">
                            <option value="balanced">Balanced</option>
                            <option value="cheap">Cheapest</option>
                            <option value="fast">Fastest</option>
                        </select>
                    </div>
                </div>
                <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20">
                    Run AI Analysis
                </button>
            </form>

            {% RESULTS_SECTION %}
        </div>
    </div>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
async def home():
    return HTML_TEMPLATE.replace("{% RESULTS_SECTION %}", "")

@app.post("/test", response_class=HTMLResponse)
async def test_logic(
    start_lat: float = Form(...), start_lon: float = Form(...), 
    end_lat: float = Form(...), end_lon: float = Form(...), 
    hour: int = Form(...), preference: str = Form(...)
):
    # ML Distance Calculation [cite: 9]
    dist = round(np.sqrt((end_lat - start_lat)**2 + (end_lon - start_lon)**2) * 111, 2)
    
    # Run the Ranking Engine [cite: 18, 23]
    recommendations = get_vehicle_recommendations(start_lat, start_lon, end_lat, end_lon, hour, preference)
    results = recommendations.to_dict(orient="records") if hasattr(recommendations, 'to_dict') else recommendations
    
    res_html = f'''
    <div class="mt-8 pt-8 border-t border-slate-800">
        <div class="flex justify-between items-center mb-4">
            <span class="text-slate-400 text-sm font-medium">Trip Distance</span>
            <span class="text-blue-400 font-bold">{dist} km</span>
        </div>
        <div class="space-y-3">
    '''
    for ride in results:
        # Dynamic Surge Indicator [cite: 16]
        is_surge = ride.get('demand') == 'High'
        surge_html = '<span class="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md border border-red-500/30">SURGE 1.45x</span>' if is_surge else ''
        
        res_html += f'''
            <div class="flex justify-between items-center p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
                <div>
                    <div class="font-bold flex items-center gap-2">{ride["vehicle"]} {surge_html}</div>
                    <div class="text-xs text-slate-500">Predicted ETA: {ride["eta"]} mins</div>
                </div>
                <div class="text-xl font-black text-emerald-400">₹{ride["fare"]}</div>
            </div>'''
    res_html += "</div></div>"
    return HTML_TEMPLATE.replace("{% RESULTS_SECTION %}", res_html)

@app.post("/predict_ride")
def get_quote(start_lat: float, start_lon: float, end_lat: float, end_lon: float, hour: int, preference: str = "balanced"):
    try:
        dist = round(np.sqrt((end_lat - start_lat)**2 + (end_lon - start_lon)**2) * 111, 2) [cite: 9]
        recommendations = get_vehicle_recommendations(start_lat, start_lon, end_lat, end_lon, hour, preference) [cite: 18, 23]
        results = recommendations.to_dict(orient="records") if hasattr(recommendations, 'to_dict') else recommendations
        for r in results:
            r['distance'] = dist
        return results
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)