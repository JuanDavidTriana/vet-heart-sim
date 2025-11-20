import React, { useState } from 'react'
import ECGVisualizer from '../ECGVisualizer'
import Heart3D from './Heart3D'

export default function App() {
  // mode state: 'normal' or 'tachycardia'
  const [mode, setMode] = useState('normal')

  // interactive controls
  const [heartRate, setHeartRate] = useState(72)
  const [gain, setGain] = useState(1.4)
  const [samplingRate, setSamplingRate] = useState(500)

  return (
    <div className="app-container body-wrapper">
      <div className="card">
        <h1>ECG Simulator</h1>

        <div className="controls" style={{ marginBottom: 12 }}>
        <button
          className={mode === 'normal' ? 'mode-btn active' : 'mode-btn'}
          onClick={() => { setMode('normal'); setHeartRate(72); }}
        >
          Normal
        </button>
        <button
          className={mode === 'tachycardia' ? 'mode-btn active' : 'mode-btn'}
          onClick={() => { setMode('tachycardia'); setHeartRate(140); }}
        >
          Tachycardia
        </button>

      </div>

      </div>

      <div style={{ marginTop: 18 }}>
        <ECGVisualizer
          heartRate={heartRate}
          samplingRate={samplingRate}
          gain={gain}
          width={900}
          height={400}
        />
      </div>
      
      <div className="app-container" style={{ marginTop: 12 }}>
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: 18, marginBottom: 12, textAlign: 'center' }}>Modelo 3D del Corazón</h2>
          <Heart3D heartRate={heartRate} />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 600 }}>
              {heartRate} BPM
            </div>
            <div className="small-hint" style={{ marginTop: 8, fontSize: 15 }}>
              {mode === 'normal' ? 'Ritmo Normal' : 'Taquicardia'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
