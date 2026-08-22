# Sahakar Gig Platform: Cooperative Workforce & Services Infrastructure
### Smart India Hackathon 2026 — Problem Statement ID: SIH26089
**Organization:** Ministry of Cooperation  
**Department:** National Council for Cooperative Training (NCCT)  
**Category:** Software | **Theme:** Smart Automation  

---

## 📌 Executive Summary

Labour Cooperative Federations and Primary Labour Cooperative Societies possess a vast pool of skilled, certified workers (plumbers, electricians, carpenters, painters, caregivers, gardeners, cleaners, appliance technicians). However, they lack a dedicated digital infrastructure, leaving workers underutilized while commercial platforms extract high commissions and prioritize blind proximity dispatch.

**Sahakar Gig Platform** is a **cooperative-owned digital service marketplace and workforce management system**. It shifts the paradigm from private commission extraction to **collective workforce management, fair opportunity distribution, transparent earnings (configurable 95% worker payout), worker social security/insurance, and AI-driven predictive demand forecasting**.

---

## 🏛️ Ecosystem Hierarchy

```
                    MINISTRY OF COOPERATION / NCCT
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          FEDERATION ADMINISTRATOR      PLATFORM ADMINISTRATOR
         (State/National Federation)   (System Governance & Audits)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
 COOPERATIVE SOCIETY 1    COOPERATIVE SOCIETY 2
 (Central Metro - SOC-001)(Eastern Suburban - SOC-002)
        │
   ┌────┴─────────────────────────────┐
   ▼                                  ▼
REGISTERED & VERIFIED WORKERS     WORKER WELFARE & INSURANCE
 (Plumbers, Electricians, etc.)   (Health, Accidental Shield)
   │                                  │
   └────────────────┬─────────────────┘
                    ▼
         FAIR WORK ALLOCATION ENGINE
  (Skill + Cert + Availability + Distance + Workload + Fairness + Reliability)
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
  HOUSEHOLDS               INSTITUTIONS
(Problem-First UI)      (Hospitals, Clinics, Schools)
```

---

## ⚙️ Key Technical Innovations

### 1. Fair Work Allocation Engine
Unlike private gig apps that blindly dispatch the nearest worker, our algorithm prevents worker fatigue and spreads livelihood opportunities evenly:

$$\text{Matching Score} = (25 \cdot S) + (15 \cdot C) + (20 \cdot A) + (15 \cdot D) + (15 \cdot W) + (10 \cdot F) + (5 \cdot R)$$

- **$S$ (Skill Match - 25 pts)**: Verified primary vs secondary skill.
- **$C$ (Certification - 15 pts)**: Active qualification badge.
- **$A$ (Availability - 20 pts)**: Currently online and on-duty.
- **$D$ (Distance - 15 pts)**: Proximity within regional service radius.
- **$W$ (Workload Balancing - 15 pts)**: Penalizes overloaded workers (>4 active jobs); rewards underutilized workers.
- **$F$ (Cooperative Fairness - 10 pts)**: Historical opportunity & earnings parity.
- **$R$ (Reliability & Ratings - 5 pts)**: Punctuality and verified customer reviews.

#### 💡 The 5-Plumber Benchmark Scenario:
- **Worker A** (1.0 km away, Master Plumber, 8 active jobs): Penalized for high workload (0/15 workload pts) $\rightarrow$ Score: **77.0 / 100**.
- **Worker B** (1.4 km away, Certified Plumber, 2 active jobs): Balanced workload (14/15 workload pts) $\rightarrow$ Score: **91.8 / 100** $\rightarrow$ **★ RECOMMENDED WINNER**.
- **Worker C** (0.8 km away, Closest, Offline): Excluded due to unavailable duty status $\rightarrow$ Score: **0 / 100**.
- **Worker D** (2.5 km away, 0 active jobs): Underutilized priority $\rightarrow$ Score: **86.0 / 100** (Rank 2).
- **Worker E** (1.9 km away, 3 active jobs): Balanced $\rightarrow$ Score: **83.0 / 100** (Rank 3).

---

### 2. Problem-First Natural Language Intent Classifier
Customers can describe their problem naturally without knowing technical trade classifications:
- *"I have a leaking kitchen tap"* $\rightarrow$ **Plumbing (Leakage & Pipe Repair)**
- *"Ceiling fan is making strange grinding noise"* $\rightarrow$ **Electrical / Appliance Repair**
- *"Elderly family member needs daytime care"* $\rightarrow$ **Caregiving & Attendant**

---

### 3. Transparent Wage & Configurable Contribution Model
- **95% Net Direct Worker Wage**: Credited directly to the worker's earnings ledger.
- **4% Society Operations & Tooling**: Maintains local cooperative staff and software dispatch.
- **1% Labour Welfare & Insurance Fund**: Allocation for worker social security (`INS-DEMO-001`).
- *Note: Demo contribution model — values are configurable and are not presented as statutory rates.*

---

### 4. Smart Automation: Python Scikit-Learn Demand Forecasting & Workforce Reallocation
- Predictive machine learning model (`RandomForestRegressor` with date, trade, district, and 7/14-day rolling lag temporal features; $R^2 = 0.912$, $\text{MAE} = 1.15$).
- Automatically calculates workforce deficits (e.g. *North District: 24 expected jobs vs 15 available = 9 shortage*).
- Issues structured recommendations: *"Mobilize 4–6 certified plumbers from East District reserve roster"*.
- Interactive Leaflet + OpenStreetMap geo-spatial clusters.

---

### 5. Multilingual & PWA Support
- Real-time dynamic language toggling between **English** and **Hindi (हिन्दी)** with persistent storage.
- Progressive Web App (PWA) manifest and Service Worker for mobile responsiveness.

---

## 👥 Demo Personas & Quick Login Credentials

All passwords are: `password123`

| Persona | Email / Identifier | Role | Key Capabilities to Test |
|---|---|---|---|
| **Customer Demo 01 (Household)** | `customer01@demo.coop` | Customer | Problem search, live job tracking, OTP verification, UPI payment, invoice print, rating, grievances |
| **Customer Demo 02 (Institution)** | `customer02@demo.coop` | Customer | Facility booking for healthcare clinics, schools, and community centres |
| **Worker Demo 01 (Worker B)** | `worker01@demo.coop` | Worker | Online/offline duty toggle, incoming offers, 5-stage progress (Accepted $\rightarrow$ On Way $\rightarrow$ Arrive $\rightarrow$ In Progress $\rightarrow$ Complete with OTP), earnings ledger, welfare |
| **Worker Demo 02 (Worker A)** | `worker02@demo.coop` | Worker | Overloaded worker profile (8 jobs, fatigue prevention demonstration) |
| **Society Admin 01** | `society01.admin@demo.coop` | Society Admin | Worker verification queue, workload balancer (underutilized/balanced/overloaded), dispute resolution board |
| **Federation Admin 01** | `federation.admin@demo.coop` | Federation Admin | Macro multi-society comparison, predictive demand forecasting, shortage reallocator, Leaflet demand map |
| **Platform Admin 01** | `platform.admin@demo.coop` | Platform Admin | Master services catalogue, society directory, immutable audit trail |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+) with `scikit-learn`, `pandas`, `numpy` (optional for local ML script execution, fallback included)

### Installation & Launch

1. **Install Dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start Backend Server (Port 5000):**
   ```bash
   cd backend
   npm start
   ```

3. **Start Frontend Client (Port 3000):**
   ```bash
   cd frontend
   npm run dev
   ```

4. Open your browser at **`http://localhost:3000`**

### Run Automated Test Suites
```bash
# Run unit tests:
cd backend
npm test

# Run full 31-step end-to-end integration test:
node test/verify_all.js
```

---

## 🏆 SIH Hackathon Interactive Demo Modal
Click the **"SIH Demo Scenarios"** button in the top navigation bar to launch guided interactive walkthroughs for:
1. **Scenario 1:** Complete End-to-End Service Flow (Customer Request $\rightarrow$ Fair Allocation $\rightarrow$ Worker Acceptance $\rightarrow$ OTP Completion $\rightarrow$ Payment $\rightarrow$ Invoice $\rightarrow$ Ratings $\rightarrow$ Live Analytics).
2. **Scenario 2:** The 5-Plumber Fair Allocation Benchmark side-by-side comparison.
3. **Scenario 3:** Predictive Demand Forecasting & Workforce Reallocation Simulator.

---
*Developed for Smart India Hackathon 2026 — Ministry of Cooperation & National Council for Cooperative Training (NCCT)*
