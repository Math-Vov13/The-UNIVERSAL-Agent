from langchain_core.tools import tool


@tool
def generate_image(prompt: str) -> str:
    """
    Generates an image based on the provided text prompt using an external API.
    Model used: fluxdev from Modelslab.

    Args:
        prompt: The text prompt describing the desired image (describe it only in English).

    Returns:
        A URL to the generated image.

    Note:
        To show image in text, use the following syntax:
        ![Image title](image_url)
    """
    import requests
    import json
    from os import environ as env

    url = "https://modelslab.com/api/v6/images/text2img"

    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "prompt": prompt,
        "model_id": "fluxdev",
        "samples": "1",
        "negative_prompt": "(worst quality:2), (low quality:2), (normal quality:2), (jpeg artifacts), (blurry), (duplicate), (morbid), (mutilated), (out of frame), (extra limbs), (bad anatomy), (disfigured), (deformed), (cross-eye), (glitch), (oversaturated), (overexposed), (underexposed), (bad proportions), (bad hands), (bad feet), (cloned face), (long neck), (missing arms), (missing legs), (extra fingers), (fused fingers), (poorly drawn hands), (poorly drawn face), (mutation), (deformed eyes), watermark, text, logo, signature, grainy, tiling, censored, nsfw, ugly, blurry eyes, noisy image, bad lighting, unnatural skin, asymmetry",
        "width": "768",
        "height": "1024",
        "clip_skip": "1",
        "enhance_prompt": False,
        "guidance_scale": "7.5",
        "safety_checker": False,
        "watermark": "no",
        "base64": "no",
        "seed": "0",
        " num_inference_steps": "20",
        "safety_checker_type": None,
        "webhook": None,
        " track_id": None,
        "key": env.get("MODELSLAB_API_KEY")
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4XX or 5XX)
        result = response.json()
        print("API Response:")
        print(json.dumps(result, indent=2))
        if result.get("status", "") != "processing" and result.get("status", "") != "completed":
            print(f"Image generation failed: {result}")
            return f"Error generating image: {result.get('message', 'Unknown error')}"

        return result.get("future_links", ["No image URL found in response."])[0]
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err} - {response.text}")
        return "Error generating image."
    except Exception as err:
        print(f"Other error occurred: {err}")
        return "Error generating image."
    finally:
        print("Request completed.")