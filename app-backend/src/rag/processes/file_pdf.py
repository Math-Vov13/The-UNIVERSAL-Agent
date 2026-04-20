import uuid
import fitz  # PyMuPDF pour extraire images depuis PDF

def process_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    data = []

    for page_idx in range(len(doc)):
        page = doc.load_page(page_idx)
        text = page.get_text()

        # Enregistrer texte de page
        data.append({
            "type": "pdf_text",
            "content": text,
            "page": page_idx,
            "source": pdf_path
        })

        # Extraire images
        images = page.get_images(full=True)
        for img_index, img in enumerate(images):
            xref = img[0]
            base_image = doc.extract_image(xref)
            img_bytes = base_image["image"]

            image_path = f"/tmp/{uuid.uuid4()}.png"
            with open(image_path, "wb") as f:
                f.write(img_bytes)

            data.append({
                "type": "pdf_image",
                "content": image_path,  # chemin image
                "page": page_idx,
                "source": pdf_path
            })

    return data
