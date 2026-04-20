import pytesseract
from PIL import Image

# ---- Embeddings ---- #
import torch
import clip

device = "cuda" if torch.cuda.is_available() else "cpu"
clip_model, clip_preprocess = clip.load("ViT-B/32", device=device)

def embed_image(image_path: str):
    img = Image.open(image_path)
    preprocessed = clip_preprocess(img).unsqueeze(0).to(device)
    with torch.no_grad():
        features = clip_model.encode_image(preprocessed)
    return features[0].cpu().tolist()


def process_image(image_path):
    # OCR basique
    try:
        ocr_text = pytesseract.image_to_string(Image.open(image_path))
    except:
        ocr_text = ""

    return [{
        "type": "image",
        "content": image_path,
        "ocr": ocr_text,
        "source": image_path
    }]
