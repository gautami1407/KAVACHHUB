# 🚀 How to Run Jeevan Setu

This guide provides step-by-step instructions on how to start the **Jeevan Setu** emergency response ecosystem on your local machine, and how to expose it for a multi-laptop hackathon demonstration.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
1. **Node.js** (v18 or higher is recommended)
2. **npm** (comes with Node.js) or **bun**
3. **Git**
4. A modern web browser (Chrome edge, Safari, etc.)

---

## 💻 1. Installation 

Open your terminal or command prompt and run the following commands:

1. **Clone the repository (if you haven't already):**
   ```bash
   git clone https://github.com/gautami1407/KAVACHHUB.git
   cd KAVACHHUB/kavachhub
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

---

## 🔑 2. Database & Environment Setup 

Jeevan Setu relies on Supabase for its backend, authentication, and real-time WebSockets.

1. Ensure the `.env` file exists in the `kavachhub` directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://nnputnzrollcuretuxbp.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_KFlMljwe6jtSzTGyCdRrUA_LdUYz_SL
   ```
   *(Note: This is already configured if you just cloned the active workspace, but ensure it's provided if running on a fresh setup).*

2. **Database Schema Setup:**
   If this is a completely fresh Supabase instance, copy the contents of `supabase-schema.sql` and run it in your **Supabase SQL Editor** to generate all the necessary tables (Profiles, Patients, Ambulances, Hospitals, Traffic Signals) and activate Realtime capabilities.

---

## 🏃 3. Running the App (Local Dev)

If you just want to run the app normally on a single computer:

```bash
npm run dev
```
*   Your terminal will display `http://localhost:8080/`. Open this link in your browser to view the application.

---

## 🌐 4. Running the Multi-Device Demo (Hackathon Mode)

To properly demonstrate the distributed nature of Jeevan Setu, you will need to run the application on one main laptop, and connect to it from other laptops/smartphones over the same Wi-Fi network.

1. Connect all the devices you plan to use to the **exact same Wi-Fi network** (or Mobile Hotspot).
2. On your main host laptop, run:
   ```bash
   npm run dev -- --host
   ```
3. Your terminal will now provide a **Network IP** address. It will look something like this:
   ```bash
     ➜  Local:   http://localhost:8080/
     ➜  Network: http://192.168.1.10:8080/
   ```
4. On your main laptop, go to the `Local` address.
5. On your other 3 laptops/phones, open a web browser and type in the `Network` address (e.g., `http://192.168.1.10:8080/`).

You can now sign into different roles (Patient, Ambulance, Hospital, Traffic Controller) simultaneously on different screens and witness the real-time ecosystem in action.

---

## 📦 5. Building for Production

When you are ready to deploy Jeevan Setu to the web (e.g., Vercel, Netlify, Render):

```bash
npm run build
```
This will compile and optimize the React code into a `dist/` folder, which can be uploaded directly to any hosting provider.
