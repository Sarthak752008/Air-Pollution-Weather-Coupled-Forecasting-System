import os
import sys

# Ensure backend dir is in path if running standalone
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.models.station import Station
from app.core.database import SessionLocal

STATIONS_DATA = [
    # Delhi NCT
    ("anand_vihar", "Anand Vihar", "Delhi", "Delhi", "DPCC", "Commercial", 28.6468, 77.3160),
    ("alipur", "Alipur", "Delhi", "Delhi", "DPCC", "Rural", 28.8153, 77.1530),
    ("ashok_vihar", "Ashok Vihar", "Delhi", "Delhi", "DPCC", "Residential", 28.6954, 77.1817),
    ("aya_nagar", "Aya Nagar", "Delhi", "Delhi", "IMD", "Peri-urban", 28.4707, 77.1099),
    ("bawana", "Bawana", "Delhi", "Delhi", "DPCC", "Industrial", 28.7762, 77.0511),
    ("crri_mathura_road", "CRRI Mathura Road", "Delhi", "Delhi", "CPCB", "Traffic", 28.5512, 77.2736),
    ("dtu", "DTU", "Delhi", "Delhi", "CPCB", "Institutional", 28.7501, 77.1113),
    ("dwarka_sec8", "Dwarka Sector 8", "Delhi", "Delhi", "DPCC", "Residential", 28.5710, 77.0667),
    ("east_arjun_nagar", "East Arjun Nagar", "Delhi", "Delhi", "CPCB", "Institutional", 28.6559, 77.2849),
    ("ihbas", "IHBAS Dilshad Garden", "Delhi", "Delhi", "CPCB", "Institutional", 28.6811, 77.3153),
    ("ito", "ITO", "Delhi", "Delhi", "CPCB", "Traffic", 28.6286, 77.2410),
    ("jahangirpuri", "Jahangirpuri", "Delhi", "Delhi", "DPCC", "Industrial", 28.7328, 77.1706),
    ("jln_stadium", "JLN Stadium", "Delhi", "Delhi", "DPCC", "Urban", 28.5802, 77.2338),
    ("lodhi_road", "Lodhi Road", "Delhi", "Delhi", "IMD", "Residential", 28.5918, 77.2273),
    ("major_dhyan_chand", "Major Dhyan Chand Stadium", "Delhi", "Delhi", "DPCC", "Commercial", 28.6113, 77.2377),
    ("mandir_marg", "Mandir Marg", "Delhi", "Delhi", "DPCC", "Residential", 28.6365, 77.2011),
    ("mundka", "Mundka", "Delhi", "Delhi", "DPCC", "Industrial", 28.6847, 77.0766),
    ("najafgarh", "Najafgarh", "Delhi", "Delhi", "DPCC", "Semi-rural", 28.6090, 76.9798),
    ("narela", "Narela", "Delhi", "Delhi", "DPCC", "Industrial", 28.8527, 77.0925),
    ("nehru_nagar", "Nehru Nagar", "Delhi", "Delhi", "DPCC", "Residential", 28.5679, 77.2505),
    ("north_campus_du", "North Campus DU", "Delhi", "Delhi", "IMD", "Institutional", 28.6940, 77.2159),
    ("nsut_dwarka", "NSUT Dwarka", "Delhi", "Delhi", "CPCB", "Institutional", 28.6003, 77.0335),
    ("okhla_phase2", "Okhla Phase 2", "Delhi", "Delhi", "DPCC", "Industrial", 28.5308, 77.2716),
    ("patparganj", "Patparganj", "Delhi", "Delhi", "DPCC", "Industrial", 28.6238, 77.2872),
    ("punjabi_bagh", "Punjabe Bagh", "Delhi", "Delhi", "DPCC", "Residential", 28.6740, 77.1310),
    ("pusa_dpcc", "Pusa DPCC", "Delhi", "Delhi", "DPCC", "Agricultural", 28.6396, 77.1462),
    ("pusa_imd", "Pusa IMD", "Delhi", "Delhi", "IMD", "Agricultural", 28.6340, 77.1578),
    ("rk_puram", "RK Puram", "Delhi", "Delhi", "DPCC", "Residential", 28.5633, 77.1869),
    ("rohini", "Rohini", "Delhi", "Delhi", "DPCC", "Residential", 28.7325, 77.1199),
    ("shadipur", "Shadipur", "Delhi", "Delhi", "CPCB", "Industrial", 28.6515, 77.1581),
    ("sirifort", "Sirifort", "Delhi", "Delhi", "CPCB", "Residential", 28.5504, 77.2159),
    ("wazirpur", "Wazirpur", "Delhi", "Delhi", "DPCC", "Industrial", 28.6997, 77.1654),
    
    # NCR stations
    ("noida_sec62", "Noida Sector 62", "Noida", "Uttar Pradesh", "UPPCB", "Institutional", 28.6245, 77.3648),
    ("noida_sec125", "Noida Sector 125", "Noida", "Uttar Pradesh", "UPPCB", "Institutional", 28.5447, 77.3331),
    ("greater_noida", "Greater Noida", "Greater Noida", "Uttar Pradesh", "UPPCB", "Institutional", 28.4727, 77.4890),
    ("ghaziabad_vasundhara", "Vasundhara Ghaziabad", "Ghaziabad", "Uttar Pradesh", "UPPCB", "Residential", 28.6603, 77.3573),
    ("ghaziabad_indirapuram", "Indirapuram Ghaziabad", "Ghaziabad", "Uttar Pradesh", "UPPCB", "Residential", 28.6465, 77.3705),
    ("gurugram_vikas_sadan", "Vikas Sadan Gurugram", "Gurugram", "Haryana", "HSPCB", "Commercial", 28.4501, 77.0264),
    ("gurugram_sec51", "Sector 51 Gurugram", "Gurugram", "Haryana", "HSPCB", "Residential", 28.4275, 77.0818),
    ("faridabad_sec16a", "Sector 16A Faridabad", "Faridabad", "Haryana", "HSPCB", "Commercial", 28.4088, 77.3178),
]

def seed_stations(db: Session):
    # Check if we already have stations
    if db.query(Station).first():
        print("Stations already seeded.")
        return

    print("Seeding stations...")
    for data in STATIONS_DATA:
        station = Station(
            id=data[0],
            name=data[1],
            city=data[2],
            state=data[3],
            operating_agency=data[4],
            zone_type=data[5],
            latitude=data[6],
            longitude=data[7]
        )
        db.add(station)
        
    db.commit()
    print("Stations seeded successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_stations(db)
    finally:
        db.close()
