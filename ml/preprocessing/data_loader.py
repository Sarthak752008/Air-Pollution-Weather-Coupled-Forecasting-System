import pandas as pd
from sqlalchemy import create_engine

def load_observations(db_url: str = 'sqlite:///data/aerosense.db', station_id: str = None) -> pd.DataFrame:
    """Load observation data from SQLite, return as time-indexed DataFrame."""
    engine = create_engine(db_url)
    query = 'SELECT * FROM observations'
    if station_id:
        query += f" WHERE station_id = '{station_id}'"
    query += ' ORDER BY timestamp'
    df = pd.read_sql(query, engine, parse_dates=['timestamp'])
    if not df.empty:
        df = df.set_index('timestamp')
    return df

def load_stations(db_url: str = 'sqlite:///data/aerosense.db') -> pd.DataFrame:
    """Load station metadata."""
    engine = create_engine(db_url)
    return pd.read_sql('SELECT * FROM stations', engine)
