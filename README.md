# 🚁 SynthRescue

**Autonomous Visual Triage & Synthetic Data Pipeline for Rapid Crisis Response**

[![Live Demo](https://img.shields.io/badge/Live_MVP-synthrescue.vercel.app-00e5ff?style=for-the-badge)](https://synthrescue.vercel.app/)

## ⚠️ The Problem: "Missing Data" in Crisis Response
During structural collapses, real-world images of people 90% buried in rubble are practically impossible to source safely. Standard AI models fail in these scenarios because they have never been trained on these extreme visual edge cases. 

## 💡 The Solution
**SynthRescue** solves the "Missing Data" bottleneck. We built a custom procedural 3D generation engine to create heavily occluded edge cases, merged them with real-world disaster data, and trained a highly robust YOLOv8 model. The model detects trapped victims in live drone feeds, feeds the mathematical coordinates into Google's **Gemini AI**, and generates a live, prioritized emergency dispatch report.

---

## 🏆 Key Results (V3 Unified Production Model)
Trained natively on an RTX 5050 using ~6,115 unified images (Synthetic + Real-World Negative Samples):
* **Survivor Recall:** **98.3%** (Near-zero chance of missing a trapped person)
* **Survivor Precision:** **100%** (Zero false alarms; rescue teams won't dig for ghosts)
* **Overall mAP50:** **0.911**

---

## 📂 Project Architecture (The Monorepo)

This repository is built using a decoupled microservice architecture. Detailed instructions for running each specific subsystem can be found in their respective directories.

### 1. [`/frontend`](./frontend/) — The Tactical Command Interface
A high-urgency, zero-clutter Next.js dashboard deployed on **Vercel**. First responders use this interface to upload drone imagery, view real-time YOLO bounding box telemetry, and read Gemini dispatch reports.
* **Tech:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion.

### 2. [`/backend`](./backend/) — The Vision & Cognitive Engine
A high-performance Python FastAPI microservice deployed via Docker on **Google Cloud Run** (configured with 4GB RAM for heavy ML inference). 
* **Tech:** Python 3.10, FastAPI, Ultralytics YOLOv8, Google GenAI SDK (`gemini-2.5-flash-lite`).

### 3. [`/synthetic_engine`](./synthetic_engine/) — Procedural Data Generation
The core ML pipeline and 3D environment that created our training data. Contains the master Blender file and the Python automation scripts for bounding box calculation and Roboflow negative-sample merging.
* **Tech:** Blender Python API (`bpy`), PyTorch, OpenCV.

---

## 🛠️ The Hackathon Journey (How we built it)
To get this live for the **Solution Challenge 2026**, we had to overcome several complex engineering bottlenecks:
1. **Zero-Manual Labeling:** We wrote scripts to extract 3D mesh vertices from Blender, calculate 2D camera bounds, and programmatically generate mathematically perfect YOLO `.txt` labels natively.
2. **Negative Sample Alignment:** We merged 3,115 real-world disaster images and programmatically generated blank `.txt` labels for images containing *only* rubble. This explicitly taught the AI to ignore broken concrete, pushing our false positive rate to zero.
3. **Cloud Run Memory Management:** When PyTorch and YOLO initially crashed our serverless deployment, we diagnosed the OOM (Out-of-Memory) error, resolved Debian `libgl1` OpenCV dependencies inside our Dockerfile, and scaled the Google Cloud Run container to `4Gi` for stable production inference.

---
*Built for the Hack2skill Solution Challenge 2026.*