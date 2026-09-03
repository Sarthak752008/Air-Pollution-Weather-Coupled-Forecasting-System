# AeroSense Atmospheric Intelligence: Formulations & Indices

## 1. Overview
In Delhi NCR, air pollution episodes are governed by coupled chemical and physical dispersion mechanisms. Rather than relying on purely black-box statistical metrics, AeroSense computes **physically grounded atmospheric indices** to classify prevailing dispersion regimes and explain forecast dynamics.

---

## 2. Derived Meteorological Indices

### 2.1 Ventilation Index ($VI$)
* **Definition:** The rate of horizontal and vertical atmospheric dispersion.
* **Mathematical Formula:**
  $$VI = \text{WS}_{10m} \times \text{PBLH} \quad (\text{m}^2/\text{s})$$
  Where:
  - $\text{WS}_{10m}$: 10-meter surface wind speed ($\text{m/s}$).
  - $\text{PBLH}$: Planetary Boundary Layer Height ($\text{m}$).
* **Categorization Thresholds:**
  | Ventilation Band | Value ($\text{m}^2/\text{s}$) | Atmospheric Dispersion Impact |
  | :--- | :--- | :--- |
  | **Critical Stagnation** | $< 2,000$ | Pollutants trapped in ground layer; acute buildup. |
  | **Moderate Dispersion** | $2,000 - 6,000$ | Equilibrium between local emission and advection. |
  | **High Ventilation** | $> 6,000$ | Rapid advective and vertical dilution. |

---

### 2.2 Stagnation Index ($SI \in [0, 100]$)
* **Definition:** A normalized composite index measuring calm conditions and vertical compression preventing turbulent dispersion.
* **Mathematical Formula:**
  $$SI_{\text{base}} = \left( 1 - \frac{\min(\text{WS}, 8.0)}{8.0} \right) \times 50 + \left( 1 - \frac{\min(\text{PBLH}, 1500.0)}{1500.0} \right) \times 50$$
* **Precipitation Washout Dampening:**
  If precipitation $P \ge 0.5\,\text{mm/h}$, turbulent precipitation scavenging disrupts stagnation:
  $$SI = SI_{\text{base}} \times 0.2$$

---

### 2.3 Inversion Risk Score ($IRS \in [0, 100]$)
* **Definition:** Evaluates the likelihood and strength of a surface radiative thermal inversion capping particulate matter.
* **Factors Considered:**
  1. **Nocturnal Cooling Window ($W_t$):** Radiative inversions develop between sunset and sunrise ($20:00 - 08:00\ \text{IST}$).
  2. **Boundary Layer Compression ($S_{\text{pblh}}$):** Compression below $350\,\text{m}$ increases risk exponentially.
  3. **Wind Shear Absence ($S_{\text{ws}}$):** Surface wind $< 2.0\,\text{m/s}$ inhibits turbulent mixing that breaks inversions.
  4. **Moisture Content ($S_{\text{rh}}$):** Relative humidity $> 70\%$ promotes nocturnal condensation and fog/smog formation.
* **Formulation:**
  $$IRS = 0.40 \cdot S_{\text{pblh}} + 0.30 \cdot S_{\text{ws}} + 0.15 \cdot S_{\text{rh}} + 0.15 \cdot S_{\text{nocturnal}}$$

---

### 2.4 Wind Transport Indicator ($WTI \in [0, 100]$)
* **Definition:** Quantifies the alignment and efficiency of prevailing winds in advecting upstream biomass burning plumes (Punjab/Haryana agricultural fires) into Delhi NCR.
* **Corridor Geometry:** The agricultural burning centroid lies North-West ($285^\circ - 330^\circ$, vector center at $\theta_0 = 305^\circ$).
* **Mathematical Formulation:**
  $$\text{Alignment} = \max(0, \cos(\theta - 305^\circ))$$
  $$\text{Velocity Efficiency} = \min\left(1.0, \frac{\text{WS}}{6.0}\right)$$
  $$\text{Fire Intensity Multiplier} = \min\left(1.0, \frac{\text{FRP}_{\text{total}}}{500}\right)$$
  $$WTI = 100 \times (\text{Alignment} \times 0.50 + \text{Velocity Efficiency} \times 0.25 + \text{Fire Intensity Multiplier} \times 0.25)$$

---

## 3. Atmospheric Regime Classification

The engine classifies each time horizon into one of six mutually exclusive regimes:

1. **`RAIN_WASHOUT`**:
   - Condition: Precipitation $\ge 0.5\,\text{mm/h}$.
   - Explanation: Wet deposition scavenges airborne particulates; rapid clearing.
2. **`HIGH_VENTILATION`**:
   - Condition: $VI \ge 6,000\,\text{m}^2/\text{s}$ and $\text{WS} \ge 4.0\,\text{m/s}$.
   - Explanation: Vigorous atmospheric mixing and elevated boundary layer; dispersion favored.
3. **`STRONG_INVERSION`**:
   - Condition: $IRS \ge 65$ and $\text{PBLH} < 350\,\text{m}$ during nocturnal/morning hours.
   - Explanation: Surface radiative inversion layer caps emissions near ground level.
4. **`STAGNATION`**:
   - Condition: $SI \ge 60$ and $VI < 2,000\,\text{m}^2/\text{s}$.
   - Explanation: Calm winds and shallow boundary layer trap local vehicular and industrial emissions.
5. **`REGIONAL_TRANSPORT`**:
   - Condition: North-westerly wind ($280^\circ - 335^\circ$), $WTI \ge 45$, upstream fires detected.
   - Explanation: Direct advective transport corridor from agricultural fire clusters into Delhi NCR.
6. **`NORMAL`**:
   - Condition: Standard diurnal urban mixing conditions.
   - Explanation: Normal diurnal dispersion patterns without extreme stagnation or transport anomalies.
