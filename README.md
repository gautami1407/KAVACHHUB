<div align="center">
  <img src="https://img.icons8.com/color/96/000000/ambulance.png" alt="Jeevan Setu Logo"/>
  <h1>🚑 Jeevan Setu </h1>
  <h3><i>Intelligent End-to-End Emergency Response Ecosystem</i></h3>
  
  <p><b>Bridging the critical gap between accident occurrence and life-saving medical care.</b></p>
  
  <p>
    <a href="#-the-problem">The Problem</a> •
    <a href="#-the-solution">Our Solution</a> •
    <a href="#-key-features">Key Features</a> •
    <a href="#-how-it-works">How It Works</a> •
    <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
    <a href="#-local-setup--live-demo">Live Demo Setup</a>
  </p>
</div>

---

## 🚨 The Problem

Traditional emergency systems operate in **fragmented stages**. Detection, reporting, identification, dispatch, and traffic management are handled entirely independently. This reliance on manual reporting, overloaded dispatchers, and congested city traffic leads to fatal delays. 

In an emergency crisis, **every second lost is life lost.**

## 💡 The Solution: Jeevan Setu

**Jeevan Setu** (*Bridge of Life*) is not an app—it is a **unified, real-time distributed ecosystem**. 

We have transformed emergency response from a reactive, manual procedure into a proactive, automated, and guided life-saving pipeline. By interconnecting **Patients, Ambulances, Traffic Signals, and Hospitals** via real-time WebSocket communication, we ensure that an emergency triggers an immediate, synchronized response across entire urban grids without human delay.

---

## 🔥 Key Features

Jeevan Setu integrates multiple critical systems to create a flawless pipeline:

1. **Multi-Modal Emergency Triggers**: Voice-activation triggers for trapped victims, QR code SafeRide scanning for unconscious victims, and intelligent crash thresholds.
2. **Autonomous Dispatch Engine**: Instantly matches GPS locations to the nearest available ambulance and optimal destination hospital—all within milliseconds.
3. **Smart Green Corridor**: Turns traffic signals into independent software agents. Traffic lights dynamically turn green as the ambulance approaches, eliminating urban gridlock.
4. **Live Pre-Hospital Assistance**: Establishes a real-time connection with doctors or provides AI-instructed First Aid explicitly tailored to the victim’s emergency type.
5. **Real-time Hospital Prep**: Destination ERs receive the patient's medical profile (allergies, blood type) and ETA *before* they arrive, allowing the trauma room to be fully prepped.

---

## 🔄 How It Works (The Ecosystem Flow)

Our system is defined by its synchronized execution:

*   **T=0sec (Detection):** Patient triggers SOS. System activates.
*   **T=1sec (Coordination):** Ambulance is dispatched. Destination hospital is assigned. 
*   **T=15sec (Clearance):** Ambulance begins transmitting its live GPS location. Traffic signals pinged by the GPS radius instantly halt cross-traffic and turn **Green**.
*   **T=20sec (Assistance):** Patient's phone begins guiding bystanders on bleeding control while the ER staff reviews their allergies in the hospital dashboard.
*   **T=Arrival:** The green corridor resets to normal, the session dissolves securely to protect data privacy, and the patient is handed over to a waiting medical team.

---

## 🛠️ Tech Stack 

Jeevan Setu is engineered for millisecond latency using modern Web Technologies:

**Frontend Ecosystem:**
*   **React 18 + Vite** (For lightning fast builds & rendering)
*   **TypeScript** (For robust, typed agent schemas)
*   **Tailwind CSS + Shadcn UI** (For modern, accessible glassmorphic UI components)
*   **Lucide Icons + Recharts + Leaflet Maps** (For dynamic visual data)

**Backend & Real-Time Node:**
*   **Supabase (PostgreSQL)** (For complex relational emergency queries)
*   **Supabase Realtime (WebSockets)** (The nervous system driving the live map tracking and green corridors)
*   **Row Level Security (RLS)** (To ensure strictly private medical records)

---

## 💻 Local Setup & Live Demo (Hackathon Judges Workflow)

Jeevan Setu is designed to be demonstrated as a distributed system. 

### Prerequisites
*   Node.js (`v18+`)
*   npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/jeevan-setu.git
cd jeevan-setu/kavachhub

# Install dependencies
npm install

# Run the live server on your local network
npm run dev -- --host
```

### The "4-Screen" Judge Demo

To witness the true power of Jeevan Setu, open the application on **4 separate devices connected to the same WiFi network** (or 4 different browser windows side-by-side).

1.  **Device 1 (Patient)**: Sign up as **Patient**. Wait at the dashboard.
2.  **Device 2 (Ambulance)**: Sign up as **Ambulance Driver**. You will be put on standby.
3.  **Device 3 (Hospital Admin)**: Sign up as **Hospital Admin**. The dashboard will be clear.
4.  **Device 4 (Traffic Agent)**: Sign up as **Traffic Controller**. Signals will be operating normally.

**The Action:**
*   On **Device 1**, click the **SOS** button.
*   *Watch the magic:* Device 2 gets a dispatch popup. Once accepted, Device 3 immediately shows patient ETA and medical context. As the ambulance distance shortens, Device 4's traffic signals dynamically turn green.

---

### Built with ❤️ to Save Lives.