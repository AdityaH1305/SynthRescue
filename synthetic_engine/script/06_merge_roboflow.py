import os
import shutil
import glob

# --- CONFIGURATION ---
ROBOFLOW_SRC = r"D:\Projects\HACK2SKILL\disaster.v1i.yolov8"
SYNTH_DEST = r"D:\Projects\HACK2SKILL\Synthrescue\dataset"

MAPPING = [('train', 'train'), ('valid', 'val'), ('test', 'val')]

def merge_roboflow_correctly():
    print("🚀 Merging real-world Roboflow images and labels...")
    total_images = 0
    
    for src_sub, dest_sub in MAPPING:
        src_img_path = os.path.join(ROBOFLOW_SRC, src_sub, "images")
        src_lbl_path = os.path.join(ROBOFLOW_SRC, src_sub, "labels") # Added the source label path
        
        dest_img_path = os.path.join(SYNTH_DEST, "images", dest_sub)
        dest_lbl_path = os.path.join(SYNTH_DEST, "labels", dest_sub)
        
        os.makedirs(dest_img_path, exist_ok=True)
        os.makedirs(dest_lbl_path, exist_ok=True)
        
        if os.path.exists(src_img_path):
            for img_file in glob.glob(os.path.join(src_img_path, "*.*")):
                # 1. Copy the Image
                shutil.copy(img_file, dest_img_path)
                
                # 2. Copy the actual Label
                base_name = os.path.splitext(os.path.basename(img_file))[0]
                src_txt = os.path.join(src_lbl_path, base_name + ".txt")
                dest_txt = os.path.join(dest_lbl_path, base_name + ".txt")
                
                if os.path.exists(src_txt):
                    shutil.copy(src_txt, dest_txt)
                else:
                    # Only create an empty file if Roboflow genuinely had no label for it
                    open(dest_txt, 'w').close()
                
                total_images += 1
                
    print(f"🎉 Merge Complete! {total_images} real-world images and their labels safely added.")

if __name__ == "__main__":
    merge_roboflow_correctly()