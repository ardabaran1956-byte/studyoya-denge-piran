# Stûdyoya Dengê Pîran - AI Separation Backend (FastAPI + Python)

This directory contains the Python + FastAPI backend system designed for high-quality audio separation. 
It accepts an uploaded MP3 file and separates it into two distinct high-fidelity stems:
1. **vocal.wav** (Isolated clean vocals)
2. **instrumental.wav** (Backing instruments, percussion, strings/saz)

## Table of Contents
- [Architecture & Folder Structure](#architecture--folder-structure)
- [System Requirements](#system-requirements)
- [How It Works](#how-it-works)
- [Setup & Installation Instructions](#setup--installation-instructions)
- [Starting the API Server](#starting-the-api-server)
- [Integration with React & Wavesurfer](#integration-with-react--wavesurfer)

---

## Architecture & Folder Structure

```text
/backend
├── main.py              # Main FastAPI application with Separation endpoints
├── requirements.txt     # Python packages list (FastAPI, Librosa, soundfile, etc.)
└── README.md            # Detailed setup and instructions document
```

During operations, the server automatically boots two safe local directories:
- `uploads/`: Holds files uploaded temporarily for processing.
- `stems/`: Persistent folder where session outputs (`vocal.wav`, `instrumental.wav`) are hosted statically.

---

## System Requirements

- **Python**: 3.8, 3.9, 3.10, or 3.11 is recommended.
- **FFmpeg**: Must be installed on your host system to allow librosa, soundfile, and UVR models to decode audio streams (MP3/M4A).

---

## How It Works

1. **Upload Request (`POST /api/separate`)**:
   The frontend posts a multipart form containing the target `.mp3` or `.wav` audio.
2. **Target Isolation**:
   The backend generates a unique `session_id` (`UUIDv4`).
3. **Primary Deep Learning Engine (Demucs / UVR5)**:
   It attempts to run full neural network isolation through the `audio-separator` wrapper (using ONNX models like `Kim_Vocal_2.onnx`).
4. **Resilient DSP Fallback**:
   If deep learning modules are absent (or run without a GPU), an advanced Python DSP (Digital Signal Processing) pipeline takes over. It uses Short-Time Fourier Transform (STFT) and Harmonic-Percussive Source Separation (HPSS) to extract center channel vocals and backing strings/drumbeats, saving them to WAV files.
5. **JSON Response**:
   Returns relative URLs `/stems/{session_id}/vocal.wav` and `/stems/{session_id}/instrumental.wav` to trigger WaveSurfer in React.

---

## Setup & Installation Instructions

### Step 1: Clone or navigate to the directory
```bash
cd backend
```

### Step 2: Create a virtual environment (Recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Install dependencies
Install the basic FastAPI wrappers and DSP tools:
```bash
pip install -r requirements.txt
```

To enable full Deep Learning UVR5 separation, install the specialized separation engine:
```bash
pip install audio-separator[cpu]     # For CPU processing
# OR
pip install audio-separator[gpu]     # For NVIDIA GPU (CUDA) acceleration
```

### Step 4: Install FFmpeg on your machine
- **Mac (Homebrew)**: `brew install ffmpeg`
- **Linux (Apt)**: `sudo apt-get update && sudo apt-get install ffmpeg`
- **Windows**: Install via `choco install ffmpeg` or download binaries from official sources and add them to your system path.

---

## Starting the API Server

Launch the FastAPI application on host `0.0.0.0` and port `8000`:
```bash
python main.py
```
The console will boot Uvicorn:
`INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)`

You can access the auto-generated api swagger documentation in your browser at:
`http://localhost:8000/docs`

---

## Integration with React & Wavesurfer

Once your FastAPI server is running alongside the Node server:
1. The React app targets Node's Express proxy `/api/separate`.
2. Node pipes the MP3 to FastAPI, receives the stem parameters, and feeds the stream to WaveSurfer.
3. The front-end renders both wavesurfer panels in perfect synchronization and allows mixing.
