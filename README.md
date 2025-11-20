# ECG Visualizer (Vite + React)

This minimal Vite + React app demonstrates `ECGVisualizer.jsx`, a real-time ECG waveform simulator using D3.

Setup:

```powershell
# from repository root
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

Usage:
- Edit `src/App.jsx` to change component props: `heartRate`, `samplingRate`, `gain`, `width`, `height`.

Controls:
- The example `src/App.jsx` includes two buttons to switch between *Normal* and *Tachycardia* modes.
- Clicking a button updates the `heartRate` prop passed to `ECGVisualizer` (72 bpm for Normal, 140 bpm for Tachycardia).
 - Clicking a button updates the `heartRate` prop passed to `ECGVisualizer` (72 bpm for Normal, 140 bpm for Tachycardia). You can also fine-tune HR and gain with the sliders in the control card.
 - The layout and visuals were improved: a card container, rounded controls, and a gradient ECG line.

Notes:
- If `npm install` fails, check your network or registry settings. You can run `npm config get registry` and set it to `https://registry.npmjs.org/` if necessary.
- This repository does not contain a CI or lockfile; run `npm install` to create `package-lock.json` and install packages.
