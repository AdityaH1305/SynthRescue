import bpy
import bpy_extras
import os
import random
import math

# --- CONFIGURATION ---
OUTPUT_DIR = r"D:\Projects\HACK2SKILL\Synthrescue\dataset"
NUM_IMAGES_TO_GENERATE = 3000 # 🚀 Phase 2: Increased for Domain Randomization
CAMERA_HEIGHT = 15.0
SCATTER_RADIUS = 4.0

os.makedirs(os.path.join(OUTPUT_DIR, "images"), exist_ok=True)
os.makedirs(os.path.join(OUTPUT_DIR, "labels"), exist_ok=True)

def setup_lighting():
    """Adds a strong sun lamp over the new stage."""
    if 'DroneSun' not in bpy.data.objects:
        light_data = bpy.data.lights.new(name="DroneSun", type='SUN')
        light_data.energy = 5.0 # Bright sunlight
        light_obj = bpy.data.objects.new(name="DroneSun", object_data=light_data)
        bpy.context.scene.collection.objects.link(light_obj)
    else:
        light_obj = bpy.data.objects['DroneSun']
        
    light_obj.location = (100, 100, 20)
    light_obj.rotation_euler = (0, 0, 0) # Point straight down

def setup_drone_camera():
    if 'DroneCam' not in bpy.data.objects:
        cam_data = bpy.data.cameras.new("DroneCam")
        cam_obj = bpy.data.objects.new("DroneCam", cam_data)
        bpy.context.scene.collection.objects.link(cam_obj)
    else:
        cam_obj = bpy.data.objects['DroneCam']
        
    cam_obj.location = (100, 100, CAMERA_HEIGHT)
    cam_obj.rotation_euler = (0, 0, 0) # Point straight down
    bpy.context.scene.camera = cam_obj
    return cam_obj

def setup_survivor_materials():
    """Creates realistic, dusty materials for the YOLO Domain Randomization."""
    # Colors defined in RGBA (Blender uses linear color space, these approximate your hex codes)
    color_palettes = [
        ("Denim_Blue", (0.05, 0.09, 0.18, 1.0)), 
        ("Dusty_Grey", (0.28, 0.26, 0.23, 1.0)),
        ("High_Vis_Orange", (0.75, 0.15, 0.02, 1.0))
    ]
    
    mats = []
    for name, rgba in color_palettes:
        # Check if material already exists to avoid duplicates
        if name not in bpy.data.materials:
            mat = bpy.data.materials.new(name=name)
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs['Base Color'].default_value = rgba
                bsdf.inputs['Roughness'].default_value = 0.9  # Makes it look dusty/matte
                bsdf.inputs['Specular IOR Level'].default_value = 0.1 # Removes shine
        mats.append(bpy.data.materials[name])
        
    return mats

def get_yolo_bbox(scene, cam_obj, obj):
    """Calculates 2D bounding box from 3D object and returns YOLO format string."""
    mesh = obj.data
    mat = obj.matrix_world
    
    if not mesh.vertices:
        return None
        
    coords_2d = []
    for v in mesh.vertices:
        co = mat @ v.co
        co2d = bpy_extras.object_utils.world_to_camera_view(scene, cam_obj, co)
        if co2d.z <= 0.0: continue # Behind camera
        coords_2d.append((co2d.x, 1.0 - co2d.y)) # Invert Y for YOLO
        
    if not coords_2d:
        return None
        
    xs = [c[0] for c in coords_2d]
    ys = [c[1] for c in coords_2d]
    
    # 🛠️ FIX 1: Strictly bound ALL coordinates between 0.0 and 1.0 to prevent YOLO crashes
    min_x = max(0.0, min(1.0, min(xs)))
    max_x = max(0.0, min(1.0, max(xs)))
    min_y = max(0.0, min(1.0, min(ys)))
    max_y = max(0.0, min(1.0, max(ys)))
    
    if min_x == max_x or min_y == max_y:
        return None
        
    width = max_x - min_x
    height = max_y - min_y
    center_x = min_x + (width / 2.0)
    center_y = min_y + (height / 2.0)
    
    # Grab yolo_class tagged from your 01_batch_import script
    cls_id = obj.get("yolo_class", 1) 
    
    # 🛠️ FIX 2: ALIGN WITH ROBOFLOW: If it is Debris (1), ignore it completely!
    if cls_id == 1:
        return None
    
    return f"{cls_id} {center_x:.6f} {center_y:.6f} {width:.6f} {height:.6f}"

def generate_dataset():
    scene = bpy.context.scene
    setup_lighting()
    cam_obj = setup_drone_camera()
    available_mats = setup_survivor_materials()
    
    col_survivors = bpy.data.collections.get("YOLO_0_Survivors")
    col_debris = bpy.data.collections.get("YOLO_1_Debris")
    
    if not col_survivors or not col_debris:
        print("❌ ERROR: Missing required collections. Did you run script 02?")
        return
        
    # Create an active collection to hold spawned objects for rendering
    if "Active_Render" not in bpy.data.collections:
        active_col = bpy.data.collections.new("Active_Render")
        scene.collection.children.link(active_col)
    else:
        active_col = bpy.data.collections["Active_Render"]

    for i in range(NUM_IMAGES_TO_GENERATE):
        # Clear previous frame's spawned objects
        for obj in list(active_col.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
            
        labels = []
        
        # ---------------------------------------------------------
        # DOMAIN RANDOMIZATION: DYNAMIC LIGHTING & WEATHER
        # ---------------------------------------------------------
        if 'DroneSun' in bpy.data.objects:
            sun = bpy.data.objects['DroneSun']
            
            sun.rotation_euler = (
                random.uniform(-0.8, 0.8),  
                random.uniform(-0.8, 0.8),  
                random.uniform(0, 6.28)     
            )
            sun.data.energy = random.uniform(1.0, 8.0)
        # ---------------------------------------------------------
        
        # ---------------------------------------------------------
        # SPAWN 1 TO 3 SURVIVORS PER IMAGE
        # ---------------------------------------------------------
        num_survivors = random.randint(1, 3)  
        
        for s_index in range(num_survivors):
            if not col_survivors.objects: break
            base_survivor = random.choice(col_survivors.objects)
            new_survivor = base_survivor.copy()
            new_survivor.data = base_survivor.data.copy()
            active_col.objects.link(new_survivor)
            
            # --- DYNAMIC COLOR RANDOMIZATION ---
            chosen_mat = random.choice(available_mats)
            new_survivor.data.materials.clear()
            new_survivor.data.materials.append(chosen_mat)
            # -----------------------------------
            
            # Base X and Y are 100 because of your "Off-Site Stage" setup
            s_x = random.uniform(-SCATTER_RADIUS, SCATTER_RADIUS) + 100.0 
            s_y = random.uniform(-SCATTER_RADIUS, SCATTER_RADIUS) + 100.0 
            
            new_survivor.location = (s_x, s_y, 0.0)
            new_survivor.rotation_euler = (random.uniform(0, 6), random.uniform(0, 6), random.uniform(0, 6))
            bpy.context.view_layer.update()
            
            bbox_s = get_yolo_bbox(scene, cam_obj, new_survivor)
            if bbox_s: labels.append(bbox_s)

            # ---------------------------------------------------------
            # HEAVY OCCLUSION: BURY THIS SPECIFIC SURVIVOR
            # ---------------------------------------------------------
            num_debris = random.randint(4, 8) 
            for j in range(num_debris):
                if not col_debris.objects: break
                base_debris = random.choice(col_debris.objects)
                new_debris = base_debris.copy()
                new_debris.data = base_debris.data.copy()
                active_col.objects.link(new_debris)
                
                offset = 0.6 if j < 3 else 2.0 
                
                new_debris.location = (
                    s_x + random.uniform(-offset, offset),
                    s_y + random.uniform(-offset, offset),
                    random.uniform(0.1, 0.8) # Lower Z height for partial burial
                )
                new_debris.rotation_euler = (random.uniform(0, 6), random.uniform(0, 6), random.uniform(0, 6))
                
                bpy.context.view_layer.update()
                bbox_d = get_yolo_bbox(scene, cam_obj, new_debris)
                if bbox_d: labels.append(bbox_d)
                
        # ---------------------------------------------------------
        # BACKGROUND CLUTTER (Additional Generic Debris)
        # ---------------------------------------------------------
        num_bg_debris = random.randint(5, 15)
        for _ in range(num_bg_debris):
            if not col_debris.objects: break
            base_debris = random.choice(col_debris.objects)
            new_debris = base_debris.copy()
            new_debris.data = base_debris.data.copy()
            active_col.objects.link(new_debris)
            
            new_debris.location = (
                100.0 + random.uniform(-SCATTER_RADIUS*1.5, SCATTER_RADIUS*1.5),
                100.0 + random.uniform(-SCATTER_RADIUS*1.5, SCATTER_RADIUS*1.5),
                random.uniform(0.0, 0.5)
            )
            new_debris.rotation_euler = (random.uniform(0, 6), random.uniform(0, 6), random.uniform(0, 6))
            
            bpy.context.view_layer.update()
            bbox_d = get_yolo_bbox(scene, cam_obj, new_debris)
            if bbox_d: labels.append(bbox_d)

        # ---------------------------------------------------------
        # RENDERING & SAVING
        # ---------------------------------------------------------
        img_path = os.path.join(OUTPUT_DIR, "images", f"frame_{i:04d}.png")
        txt_path = os.path.join(OUTPUT_DIR, "labels", f"frame_{i:04d}.txt")
        
        scene.render.filepath = img_path
        bpy.ops.render.render(write_still=True)
        
        if labels:
            with open(txt_path, "w") as f:
                f.write("\n".join(labels))
                
        print(f"Generated {i+1}/{NUM_IMAGES_TO_GENERATE}: {len(labels)} objects")

if __name__ == "__main__":
    generate_dataset()