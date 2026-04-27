from ultralytics import YOLO

def test_single_image():
    # 1. Load your newly trained "best" weights
    # Update this path if your weights are saved somewhere else!
    model = YOLO(r"D:\Projects\HACK2SKILL\Synthrescue\script\runs\detect\synth_rescue_v3_unified\weights\best.pt")

    # 2. Put the path to the image you want to test here
    # You can download a random disaster image from Google to test it out
    image_to_test = r"D:\Projects\HACK2SKILL\test_image.jpg" 

    print(f"🚀 Running SynthRescue model on {image_to_test}...")

    # 3. Run inference (conf=0.4 means it will only show boxes it is 40%+ sure about)
    results = model.predict(source=image_to_test, conf=0.4, save=True)

    print("\n✅ Done! Check the newly created 'runs/detect/predict' folder to see your image with bounding boxes drawn on it.")

if __name__ == "__main__":
    test_single_image()