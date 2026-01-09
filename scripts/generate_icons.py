from PIL import Image
import os

source_path = r"C:/Users/User1/.gemini/antigravity/brain/2628ccae-6848-4619-85d8-92fcb70b39d7/brand_logo_ce_sharp_1765277737259.png"
dest_dir = r"c:\Users\User1\Downloads\Eventkalender\public\icons"

if not os.path.exists(source_path):
    print(f"Error: Source file not found at {source_path}")
    exit(1)

try:
    with Image.open(source_path) as img:
        # Save 192x192
        img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
        img_192.save(os.path.join(dest_dir, "icon-192x192.png"))
        print("Saved icon-192x192.png")

        # Save 512x512
        img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
        img_512.save(os.path.join(dest_dir, "icon-512x512.png"))
        print("Saved icon-512x512.png")
except Exception as e:
    print(f"Error processing image: {e}")
    exit(1)
