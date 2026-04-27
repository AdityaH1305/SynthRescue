import bpy
import os

# Set this to your new flattened folder path
MASTER_FOLDER = r"D:\Projects\HACK2SKILL\Synthrescue\models\master_import"

def get_class_id(filename):
    """Determines YOLO class based on the downloaded file's name."""
    name_lower = filename.lower()
    
    # Class 0: Survivors
    if any(word in name_lower for word in ["human", "person", "character", "mesh"]):
        return 0 
        
    # Class 1: Debris/Environment
    elif any(word in name_lower for word in ["rubble", "debris", "beam", "brick", "city", "urban"]):
        return 1 
        
    return -1

def batch_import_and_tag(directory):
    print(f"Scanning {directory} for assets...")
    
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        class_id = get_class_id(filename)
        
        # 1. Import the file based on its extension
        if filename.lower().endswith(('.glb', '.gltf')):
            bpy.ops.import_scene.gltf(filepath=filepath)
        elif filename.lower().endswith('.fbx'):
            bpy.ops.import_scene.fbx(filepath=filepath)
        else:
            continue # Skip non-3D files
            
        # 2. Tag the newly imported objects with their YOLO class
        # Blender automatically selects objects right after importing them
        for obj in bpy.context.selected_objects:
            if obj.type == 'MESH':
                if class_id != -1:
                    # Creates a custom property on the object for our rendering script to read later
                    obj["yolo_class"] = class_id 
                print(f"Imported: {obj.name} | Tagged as YOLO Class: {class_id}")

# Run the function
batch_import_and_tag(MASTER_FOLDER)
print("Batch import complete! Check your viewport.")