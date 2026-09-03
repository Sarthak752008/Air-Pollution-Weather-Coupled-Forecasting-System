# AQI Methodology (Indian NAQI)

## Formula

The calculation of the Sub-Index ($I_p$) for a given pollutant concentration ($C_p$) uses linear interpolation:

$$I_p = \left[ \frac{I_{HI} - I_{LO}}{B_{HI} - B_{LO}} \right] \times (C_p - B_{LO}) + I_{LO}$$

Where:
- $I_p$ = AQI value for pollutant 'p'
- $C_p$ = Actual concentration of pollutant 'p'
- $B_{HI}$ = Breakpoint concentration greater than or equal to $C_p$
- $B_{LO}$ = Breakpoint concentration less than or equal to $C_p$
- $I_{HI}$ = AQI value corresponding to $B_{HI}$
- $I_{LO}$ = AQI value corresponding to $B_{LO}$

## 3-Pollutant Rule

According to CPCB guidelines, for the overall AQI to be calculated, data must be available for at least three pollutants. Furthermore, one of those three pollutants MUST be either PM2.5 or PM10. If these conditions are not met, the AQI is considered "Insufficient Data".

## Categories and Health Impacts

| AQI Category | Range | Possible Health Impacts |
| :--- | :--- | :--- |
| **Good** | 0-50 | Minimal impact |
| **Satisfactory** | 51-100 | Minor breathing discomfort to sensitive people |
| **Moderate** | 101-200 | Breathing discomfort to the people with lungs, asthma and heart diseases |
| **Poor** | 201-300 | Breathing discomfort to most people on prolonged exposure |
| **Very Poor** | 301-400 | Respiratory illness on prolonged exposure |
| **Severe** | >400 | Affects healthy people and seriously impacts those with existing diseases |

*Reference: Central Pollution Control Board (CPCB), India.*
