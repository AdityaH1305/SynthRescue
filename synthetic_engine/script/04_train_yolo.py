import os
from ultralytics import YOLO

def clear_yolo_cache():
    """Automatically deletes old YOLO cache files to prevent training on corrupt data."""
    print("🧹 Checking for old YOLO cache files...")
    cache_paths = [
        r"D:\Projects\HACK2SKILL\Synthrescue\dataset\labels\train.cache",
        r"D:\Projects\HACK2SKILL\Synthrescue\dataset\labels\val.cache"
    ]
    
    cleared = False
    for cache_file in cache_paths:
        if os.path.exists(cache_file):
            os.remove(cache_file)
            print(f"   Deleted: {cache_file}")
            cleared = True
            
    if cleared:
        print("✅ Cache cleared. Ready for fresh training!")
    else:
        print("✅ No old cache found. Ready for training!")

def train_production_v3():
    # 0. Clear old cache before starting to prevent data corruption errors
    clear_yolo_cache()

    # 1. Load the pre-trained Nano model
    model = YOLO('yolov8n.pt') 

    # 2. Start the Phase 2 Training Loop
    print("\n🚀 Starting V3 Unified Production Training...")
    results = model.train(
        data=r'D:\Projects\HACK2SKILL\Synthrescue\dataset\data.yaml',
        epochs=200,           
        patience=25,        
        imgsz=640,            
        batch=-1,             
        device=0,             
        name='synth_rescue_v3_unified', 
        workers=4,            
        exist_ok=True,        
        pretrained=True       
    )

    # 3. Final Production Evaluation
    print("\n📊 Running final evaluation metrics...")
    metrics = model.val()
    
    # Grab recall specifically for your ONLY class now (Trapped_Survivor)
    recall_survivor = metrics.box.r[0] 
    
    # Grab the precision as well to show the judges how accurate it is
    precision_survivor = metrics.box.p[0]

    print(f"\n--- V3 UNIFIED PRODUCTION METRICS ---")
    print(f"Trapped_Survivor Recall:    {recall_survivor:.4f}")
    print(f"Trapped_Survivor Precision: {precision_survivor:.4f}")
    print(f"-------------------------------------\n")

if __name__ == '__main__':
    train_production_v3()