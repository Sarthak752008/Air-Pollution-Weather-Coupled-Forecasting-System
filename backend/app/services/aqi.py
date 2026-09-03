from typing import Dict, Tuple, Optional, Any

# Breakpoints as given in the prompt
BREAKPOINTS = {
    'pm25': [(0,30,0,50), (30.1,60,51,100), (60.1,90,101,200), (90.1,120,201,300), (120.1,250,301,400), (250.1,500,401,500)],
    'pm10': [(0,50,0,50), (50.1,100,51,100), (100.1,250,101,200), (250.1,350,201,300), (350.1,430,301,400), (430.1,600,401,500)],
    'no2': [(0,40,0,50), (40.1,80,51,100), (80.1,180,101,200), (180.1,280,201,300), (280.1,400,301,400), (400.1,800,401,500)],
    'so2': [(0,40,0,50), (40.1,80,51,100), (80.1,380,101,200), (380.1,800,201,300), (800.1,1600,301,400), (1600.1,2000,401,500)],
    'co': [(0,1.0,0,50), (1.01,2.0,51,100), (2.01,10.0,101,200), (10.01,17.0,201,300), (17.01,34.0,301,400), (34.01,50.0,401,500)],
    'o3': [(0,50,0,50), (50.1,100,51,100), (100.1,168,101,200), (168.1,208,201,300), (208.1,748,301,400), (748.1,1000,401,500)],
    'nh3': [(0,200,0,50), (200.1,400,51,100), (400.1,800,101,200), (800.1,1200,201,300), (1200.1,1800,301,400), (1800.1,2400,401,500)],
    'pb': [(0,0.5,0,50), (0.51,1.0,51,100), (1.01,2.0,101,200), (2.01,3.0,201,300), (3.01,3.5,301,400), (3.51,5.0,401,500)]
}

def calculate_sub_index(pollutant: str, concentration: float) -> Optional[int]:
    if pollutant not in BREAKPOINTS or concentration is None:
        return None
    
    concentration = round(concentration, 2)
    bp = BREAKPOINTS[pollutant]
    
    for blo, bhi, ilo, ihi in bp:
        if blo <= concentration <= bhi:
            return round(((ihi - ilo) / (bhi - blo)) * (concentration - blo) + ilo)
            
    if concentration > bp[-1][1]:
        return 500
        
    return None

def get_aqi_category(aqi_value: int) -> Tuple[str, str]:
    if aqi_value <= 50:
        return "Good", "#00b050"
    elif aqi_value <= 100:
        return "Satisfactory", "#92d050"
    elif aqi_value <= 200:
        return "Moderate", "#ffff00"
    elif aqi_value <= 300:
        return "Poor", "#ff9900"
    elif aqi_value <= 400:
        return "Very Poor", "#ff0000"
    else:
        return "Severe", "#c00000"

def calculate_naqi(measurements: Dict[str, float]) -> Dict[str, Any]:
    sub_indices = {}
    for p, val in measurements.items():
        if val is not None:
            idx = calculate_sub_index(p, val)
            if idx is not None:
                sub_indices[p] = idx

    valid_pollutants = set(sub_indices.keys())
    
    if len(valid_pollutants) < 3 or not ('pm25' in valid_pollutants or 'pm10' in valid_pollutants):
        return {
            "aqi": None,
            "category": None,
            "color": None,
            "prominent_pollutant": None,
            "sub_indices": sub_indices,
            "status": "insufficient_data"
        }
        
    max_p = max(sub_indices, key=sub_indices.get)
    max_aqi = sub_indices[max_p]
    cat, col = get_aqi_category(max_aqi)
    
    return {
        "aqi": max_aqi,
        "category": cat,
        "color": col,
        "prominent_pollutant": max_p,
        "sub_indices": sub_indices,
        "status": "success"
    }
