client = OpenAI()

def embed_text(text: str):
    response = client.embeddings.create(
        model="text-embedding-3-large",
        input=text
    )
    return response.data[0].embedding

def process_text(text, source="raw_text"):
    return [{
        "type": "text",
        "content": text,
        "source": source
    }]
