import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

/**
 * ECGVisualizer.jsx
 * React component for Vite that simulates and displays an ECG (electrocardiogram) waveform
 * in real-time using D3.js for rendering to SVG. Uses requestAnimationFrame for updates.
 *
 * Props:
 *  - heartRate (number): beats per minute, default 60
 *  - samplingRate (number): samples per second (Hz), default 500
 *  - gain (number): vertical amplitude scale (1.0 == normal), default 1.0
 *  - width (number): SVG width in px, default 800
 *  - height (number): SVG height in px, default 300
 *  - displaySeconds (number): length of time shown on the screen in seconds, default 8
 *
 * Installation notes for Vite/React:
 *  - npm i react react-dom d3
 *  - Place `ECGVisualizer.jsx` inside your `src/` and import it in a component or App:
 *
 *    import ECGVisualizer from './ECGVisualizer';
 *
 *    <ECGVisualizer heartRate={72} samplingRate={500} gain={2.0} />
 *
 * Implementation summary:
 *  - The signal is simulated using a small baseline drift + noise, plus a beat template
 *    composed of Q, R (sharp spike), S and T-like components.
 *  - Samples are generated at a rate determined by `samplingRate`. requestAnimationFrame
 *    provides the scheduling; we generate as many samples per frame as the elapsed
 *    time requires.
 *  - D3 draws the waveform and updates the path attribute. An ECG paper grid is
 *    rendered in SVG behind the waveform.
 */

function ECGVisualizer({
  heartRate = 60,
  samplingRate = 500,
  gain = 1.0,
  width = 800,
  height = 300,
  displaySeconds = 8,
}) {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const animationRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  // Derived constants
  const bufferLength = Math.max(64, Math.floor(samplingRate * displaySeconds));
  const timePerSample = 1 / samplingRate;
  const midY = height / 2;
  const pxPerMv = (height / 3) / 1.2; // scale for amplitude mapping (approx)

  // Signal buffers
  const signalRef = useRef(new Float32Array(bufferLength).fill(0));
  const timeBufferRef = useRef(new Float32Array(bufferLength).fill(0));

  // ECG beat template: QRS + T
  const beatTemplateRef = useRef(null);

  // State used to manage beat timing and sample generation
  const nextBeatTimeRef = useRef(0);
  const lastTimestampRef = useRef(null);
  const lowFreqPhaseRef = useRef(0);

  // precompute a beat template (samples). The template is expressed in mV units
  // and will be multiplied by gain before rendering. Template length is ~0.35s
  function buildBeatTemplate() {
    const templateDuration = 0.35; // seconds (QRS + T)
    const templateLength = Math.ceil(templateDuration * samplingRate);
    const out = new Float32Array(templateLength).fill(0);

    // Helper to add gaussian bump
    const gauss = (x, mu, sigma, amp) => amp * Math.exp(-0.5 * ((x - mu) / sigma) ** 2);

    for (let i = 0; i < templateLength; i++) {
      const t = (i / templateLength) * templateDuration; // 0..templateDuration

      // Q-wave: small negative (sharp)
      out[i] += gauss(t, 0.06, 0.008, -0.08);

      // R-wave: tall narrow positive peak
      out[i] += gauss(t, 0.10, 0.006, 1.0);

      // S-wave: small negative following R
      out[i] += gauss(t, 0.12, 0.007, -0.25);

      // T-wave: mild positive, broader
      out[i] += gauss(t, 0.22, 0.03, 0.25);
    }

    // Normalize amplitude so that max is 1 (we'll use gain to scale)
    const max = Math.max(...out.map(Math.abs));
    if (max > 0) for (let i = 0; i < templateLength; i++) out[i] /= max;

    return out;
  }

  // Map a signal amplitude (mV) to y position on SVG
  function amplitudeToY(mv) {
    // center at midY, invert y because SVG y increases downward
    return midY - mv * pxPerMv * gain;
  }

  useEffect(() => {
    beatTemplateRef.current = buildBeatTemplate();
    setMounted(true);
  }, []);

  // Effects: set up static grid and path
  useEffect(() => {
    if (!mounted) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear

    // Draw grid similar to ECG paper: small grid every 5 px, heavy line every 5 small squares
    const smallCell = 5; // px
    const bigCell = smallCell * 5;

    // Slightly warmer small grid for better contrast
    const smallColor = '#f7f7f7';
    const bigColor = '#ffdfe0';

    // Small grid lines
    for (let x = 0; x <= width; x += smallCell) {
      svg.append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', height)
        .attr('stroke', smallColor)
        .attr('stroke-width', 0.5);
    }
    for (let y = 0; y <= height; y += smallCell) {
      svg.append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', width)
        .attr('y2', y)
        .attr('stroke', smallColor)
        .attr('stroke-width', 0.5);
    }

    // Big grid lines
    for (let x = 0; x <= width; x += bigCell) {
      svg.append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', height)
        .attr('stroke', bigColor)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.6);
    }
    for (let y = 0; y <= height; y += bigCell) {
      svg.append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', width)
        .attr('y2', y)
        .attr('stroke', bigColor)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.6);
    }

    // Add defs: gradient for nicer ECG line
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'ecgGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#ff7a7a');
    grad.append('stop').attr('offset', '60%').attr('stop-color', '#ff3b3b');
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#d90000');

    // subtle highlight in background (rounded rectangle)
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', 'transparent');

    // Append path for the waveform
    svg.append('path')
      .attr('d', '')
      .attr('fill', 'none')
      // use gradient stroke and class for styling
      .attr('stroke', 'url(#ecgGradient)')
      .attr('class', 'ecg-path')
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('id', 'ecg-path');

    pathRef.current = svg.select('#ecg-path');
  }, [mounted, width, height]);

  // Simulation and animation
  useEffect(() => {
    if (!mounted) return;

    // Reset buffers
    signalRef.current.fill(0);
    timeBufferRef.current.fill(0);
    nextBeatTimeRef.current = 0; // relative time since start
    lastTimestampRef.current = null;
    lowFreqPhaseRef.current = Math.random() * Math.PI * 2;

    // set next beat interval based on heartRate
    const beatInterval = 60 / Math.max(20, heartRate); // seconds between beats
    const beatJitter = beatInterval * 0.05; // mild jitter

    // helper to push one sample into the ring buffer
    const pushSample = (sample, t) => {
      // shift buffer left one sample by copying slice (fast typed array manipulation)
      const buf = signalRef.current;
      const tb = timeBufferRef.current;
      for (let i = 0; i < buf.length - 1; i++) {
        buf[i] = buf[i + 1];
        tb[i] = tb[i + 1];
      }
      buf[buf.length - 1] = sample;
      tb[tb.length - 1] = t;
    };

    // schedule first beat slightly after start
    let timeSinceStart = 0;
    nextBeatTimeRef.current = beatInterval * (0.2 + Math.random() * 0.6);

    // create d3 line generator
    const xScale = (i) => (i / (bufferLength - 1)) * width;
    const lineGen = d3.line()
      .x((d, i) => xScale(i))
      .y((d) => amplitudeToY(d))
      .curve(d3.curveLinear);

    // animation loop
    const frame = (timestamp) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const elapsedMs = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      // accumulate time and generate samples
      let toGenerate = elapsedMs / 1000.0; // seconds elapsed
      timeSinceStart += toGenerate;

      // generate sample-by-sample to preserve samplingRate
      while (toGenerate > 0) {
        const dt = Math.min(toGenerate, timePerSample);
        toGenerate -= dt;

        const tNow = timeSinceStart - toGenerate; // approximate sample time from start

        // baseline wander (low freq) and noise
        lowFreqPhaseRef.current += dt * 0.5; // low-freq 0.5 Hz
        const baseline = 0.1 * Math.sin(lowFreqPhaseRef.current) * 0.8; // mV-level drift
        const noise = (Math.random() - 0.5) * 0.02; // small noise

        // beat contribution
        let beatValue = 0;
        const beatTemplate = beatTemplateRef.current;
        if (tNow >= nextBeatTimeRef.current && tNow < nextBeatTimeRef.current + beatTemplate.length * timePerSample) {
          const beatIndex = Math.floor((tNow - nextBeatTimeRef.current) / timePerSample);
          beatValue = beatTemplate[Math.max(0, Math.min(beatTemplate.length - 1, beatIndex))];
        }

        // when we pass the end of template, optionally schedule next beat
        if (tNow >= nextBeatTimeRef.current + beatTemplate.length * timePerSample) {
          // schedule next beat with small jitter
          nextBeatTimeRef.current += beatInterval + (Math.random() - 0.5) * beatJitter;
        }

        const sample = baseline + noise + beatValue * (1.0 + (Math.random() - 0.5) * 0.05);
        pushSample(sample, tNow);
      }

      // Draw path using the updated buffer
      if (pathRef.current) {
        pathRef.current.attr('d', lineGen(Array.from(signalRef.current)));
      }

      animationRef.current = requestAnimationFrame(frame);
    };

    animationRef.current = requestAnimationFrame(frame);

    // cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };

  }, [mounted, heartRate, samplingRate, gain, width, height]);

  // Recompute template when sampling rate or gain changes
  useEffect(() => {
    beatTemplateRef.current = buildBeatTemplate();
  }, [samplingRate]);

  return (
    <div style={{ width }}>
      <svg ref={svgRef} width={width} height={height} style={{ display: 'block' }} />
    </div>
  );
}

export default ECGVisualizer;