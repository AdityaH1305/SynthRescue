import bpy

def organize_into_collections():
    # 1. Create the new collections
    collection_names = {
        0: "YOLO_0_Survivors",
        1: "YOLO_1_Debris",
        -1: "YOLO_Ignore_Environment"
    }
    
    for class_id, name in collection_names.items():
        if name not in bpy.data.collections:
            new_col = bpy.data.collections.new(name)
            bpy.context.scene.collection.children.link(new_col)
            
    # 2. Move objects to their respective collections
    count = 0
    for obj in bpy.context.scene.objects:
        if "yolo_class" in obj:
            class_id = obj["yolo_class"]
            target_col_name = collection_names.get(class_id)
            
            if target_col_name:
                target_col = bpy.data.collections[target_col_name]
                
                # Link to new collection
                if obj.name not in target_col.objects:
                    target_col.objects.link(obj)
                
                # Unlink from the default "Collection" so it's not in two places at once
                for old_col in obj.users_collection:
                    if old_col.name != target_col_name:
                        old_col.objects.unlink(obj)
                count += 1
                
    print(f"Successfully organized {count} assets into YOLO collections!")

organize_into_collections()