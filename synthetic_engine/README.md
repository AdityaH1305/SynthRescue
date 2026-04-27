# SynthRescue: Autonomous Visual Triage & Synthetic Data Pipeline

## Objective
SynthRescue is an end-to-end computer vision pipeline designed to locate trapped survivors in disaster zones using drone-perspective imagery. Built for the **Rapid Crisis Response** track, the project utilizes a custom procedural 3D generation engine to create heavily occluded edge cases, merging them with real-world disaster data to train a highly robust YOLOv8 model. 

## Technical Architecture
### 1. Synthetic Data Engine (Blender + Python)
- **Procedural Placement**: Automated scripts handle the spawning, rotation, and scaling of low-poly disaster assets (survivors and debris) on a custom staging environment.
- **Heavy Occlusion Logic**: Implemented "High-Burial" simulations, forcing survivors to be partially covered by 4–8 pieces of concrete and rebar to train the model on extreme edge cases.
- **Domain Randomization**: Dynamic Sun positioning (lighting/shadow angles) and randomized survivor materials (Dusty Grey, Denim Blue, High-Vis Orange) prevent the model from overfitting to specific colors or lighting conditions.
- **Zero-Manual Labeling**: Extracts 3D mesh vertices, calculates the 2D camera bounds, and programmatically enforces `0.0` to `1.0` constraints to generate mathematically perfect YOLO bounding boxes natively.

### 2. Real-World Data Unification
- **Roboflow Merger**: Automatically ingests 3,115 real-world disaster images.
- **Negative Sample Alignment**: Programmatically generates blank `.txt` labels for real-world images containing only rubble. This teaches the AI to actively ignore broken concrete, drastically reducing false positive rates.

### 3. Machine Learning Pipeline
- **Dataset**: **~6,115 total images** (3,000 Procedural Synthetic + 3,115 Real-World) with an 80/20 train/val split.
- **Model**: YOLOv8n (Nano) optimized for high-speed edge inference on search-and-rescue drones.
- **Hardware**: Trained natively on an NVIDIA GeForce RTX 5050 Laptop GPU using auto-batching and mixed precision.

## Key Results (V3 Unified Production Model)
Trained on highly complex, occluded, and chaotic unified data:
- **Survivor Precision**: **96.7%** (Near-zero false alarms for rescue teams)
- **Survivor Recall**: **73.7%** (Strong baseline for detecting heavily buried individuals)

## Project Structure

    SynthRescue/
    ├── dataset/                    # Unified training/validation YOLO dataset
    ├── models/                     # Source 3D GLB/FBX files (Kenney low-poly assets)
    ├── script/                     # Core automation and ML codebase
    │   ├── 01_batch_import.py      # Ingests and tags 3D models with YOLO classes
    │   ├── 02_organize_col...      # Sorts assets into Blender Collections
    │   ├── 03_generate_syn...      # The core Blender rendering & labeling engine
    │   ├── 04_train_yolo.py        # YOLOv8 training loop with auto-cache clearing
    │   ├── 05_split_dataset.py     # 80/20 Train/Val mathematical split
    │   ├── 06_merge_roboflow.py    # Merges real-world data and negative samples
    │   ├── 07_test_image.py        # Local inference testing script
    │   └── runs/                   # YOLOv8 weight artifacts (best.pt)
    ├── .env                        # Local secrets
    ├── .gitignore                  # Keeps repo lightweight (ignores dataset/runs)
    ├── requirements.txt            # Python dependencies
    └── synth_data_master.blend     # The master Blender staging environment


## Innovation & Impact
- **Solving the "Missing Data" Problem**: Real-world images of people 90% buried in rubble are practically impossible to source safely. By procedurally generating these extreme edge cases, SynthRescue trains AI to find victims that the human eye misses.
- **Cloud-Ready**: The output `best.pt` weights are exported and ready to be containerized via Docker for Google Cloud Run integration, interfacing with the Gemini API to generate real-time emergency dispatch reports.