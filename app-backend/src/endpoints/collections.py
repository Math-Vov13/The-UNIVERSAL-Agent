import uuid
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from models.vc_chroma.utils import get_collection_by_name, openai_ef

from langchain_community.document_loaders import TextLoader, CSVLoader, JSONLoader, Blob
from langchain_community.document_loaders.pdf import PDFMinerLoader, PagedPDFSplitter
from langchain_community.vectorstores import FAISS, Chroma
from langchain.schema import Document
from models.s3.upload_files import upload_files_to_s3
from langchain_text_splitters import RecursiveCharacterTextSplitter
# from rag.config import model_embeddings
from models.vc_chroma.client import chroma_client
from dotenv import load_dotenv
load_dotenv()

router = APIRouter()


@router.get("/", description="Retrieve all collections")
async def get_collections():
    try:
        collects = chroma_client.list_collections()
        return JSONResponse(content={"collections": [i for i in range(len(collects))], "length": len(collects)}, status_code=200)
    
    except Exception as e:
        print("Error retrieving collections:", str(e))
        return JSONResponse(content={"collections": [], "length": 0}, status_code=503)

@router.get("/{collection_id}/items", description="Retrieve a collection")
async def get_collection_items(collection_id: str):
    try:
        collect = chroma_client.get_collection(name=collection_id)
        items = collect.get()
        return {"collection_id": collection_id, "items": items, "length": collect.count()}
    except Exception as e:
        print("Error retrieving collection items:", str(e))
        return JSONResponse(content={"collection_id": collection_id, "items": [], "length": 0}, status_code=404)

@router.get("/{collection_id}/items/{item_id}", description="Retrieve an item in a collection")
async def get_collection_item(collection_id: str, item_id: str):
    return {"collection_id": collection_id, "item_id": item_id, "item": "item details"}


@router.post("/{collection_id}/items", description="Add a new File to a collection")
async def add_item_to_collection(collection_id: str, item: UploadFile = File(...)):
    try:
        if item.content_type == "text/plain" or item.content_type == "application/json":
            content_bytes = await item.read()
            await item.close()
            text = content_bytes.decode("utf-8", errors="replace")

            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
            chunks = splitter.split_text(text)
            print(chunks)
            # items = process_text(f.read(), source=path)
        elif item.content_type == "application/pdf":
            return JSONResponse(content={"error": "Unsupported file type"}, status_code=400)
            # items = process_pdf(path)
            # loader = PDFMinerLoader(item.file)
        elif item.content_type == "image/png" or item.content_type == "image/jpeg" or item.content_type == "image/jpg":
            return JSONResponse(content={"error": "Unsupported file type"}, status_code=400)
            # items = process_image(path)
            # loader = ImageLoader(item.file)
        elif item.content_type == "text/csv":
            return JSONResponse(content={"error": "Unsupported file type"}, status_code=400)
            # loader = CSVLoader(item.file)
        else:
            return JSONResponse(content={"error": "Unsupported file type"}, status_code=400)
    except Exception as e:
        print("File processing error:", str(e))
        return JSONResponse(content={"error": "Unsupported file type"}, status_code=400)
    
    try:
        processed_chunks = []
        embeddings = []

        for chunk in chunks:
            normalized_chunk = chunk.strip()
            if not normalized_chunk:
                continue
            raw_embedding = openai_ef(input=normalized_chunk)
            if isinstance(raw_embedding, list):
                if not raw_embedding:
                    continue
                raw_embedding = raw_embedding[0]
            if hasattr(raw_embedding, "tolist"):
                raw_embedding = raw_embedding.tolist()
            processed_chunks.append(normalized_chunk)
            embeddings.append(raw_embedding)

        if not processed_chunks:
            return JSONResponse(content={"error": "No valid content to add"}, status_code=400)

        # collection = chroma_client.get_or_create_collection(
        #     name=collection_id,
        #     embedding_function=OpenAIEmbeddingFunction(
        #         model_name="text-embedding-3-small",
        #         api_key_env_var="OPENAI_API_KEY",
        #         # dimensions=1536,
        #     ),
        #     metadata={"hnsw:space": "cosine"},
        # )

        collection = get_collection_by_name(collection_id, get_or_create=True)
        if collection is None:
            return JSONResponse(content={"error": "Collection could not be created"}, status_code=409)

        # collection.add(
        #     ids=["11111111"],
        #     documents=[f"Placeholder document for {item.filename}. The price of greatness is responsibility."],
        #     metadatas=[{"source": item.filename}],
        # )

        collection.add(
            ids=[str(uuid.uuid4()) for _ in range(len(processed_chunks))],
            documents=processed_chunks,
            embeddings=embeddings,
            metadatas=[{"source": item.filename} for _ in range(len(processed_chunks))],
        )

        # # Read the whole uploaded file asynchronously to avoid a streaming loop that can hang
        # content_bytes = await item.read()
        # await item.close()
        # text = content_bytes.decode("utf-8", errors="replace")

        # splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
        # chunks = splitter.split_text(text)

        # batch_texts = []
        # batch_metadatas = []
        # batch_ids = []
        # batch_size = 100  # number of chunks before sending to the vectorstore
        # doc_counter = 0

        # for piece in chunks:
        #     batch_texts.append(piece)
        #     batch_metadatas.append({"source": item.filename})
        #     batch_ids.append(str(doc_counter))
        #     doc_counter += 1

        #     if len(batch_texts) >= batch_size:
        #         collection.upsert(documents=batch_texts, metadatas=batch_metadatas, ids=batch_ids) # , embeddings=model_embeddings.embed_documents(batch_texts)
        #         batch_texts, batch_metadatas, batch_ids = [], [], []

        # # send final batch if present
        # if batch_texts:
        #     collection.upsert(documents=batch_texts, metadatas=batch_metadatas, ids=batch_ids) # , embeddings=model_embeddings.embed_documents(batch_texts)
        
        # # Upload the file to S3 (TODO: change sync to async / handle duplicates or versioning as needed)
        # bucket_file_id = upload_files_to_s3(file_name=item.filename, file_content=content_bytes, content_type=item.content_type)
        # return JSONResponse(content={"status": "item streamed and added", "collection_id": collection_id, "chunks_added": doc_counter, "id": bucket_file_id}, status_code=201)
        return JSONResponse(content={"status": "item added", "collection_id": collection_id, "item": item.filename}, status_code=201)

    except Exception as e:
        print("Streaming upload error:", str(e))
        return JSONResponse(content={"error": "Streaming upload failed", "detail": str(e)}, status_code=500)


#     if item.content_type == "text/plain":
#         pass
#     elif item.content_type == "application/pdf":
#         loader = PDFMinerLoader(item.file)
#     elif item.content_type == "text/csv":
#         loader = CSVLoader(item.file)
#     else:
#         return JSONResponse(content={"error": "Unsupported file type"}, status_code=400)

#     documents = loader.load()
#     text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
#     texts = text_splitter.split_documents(documents)
#     for idx, text in enumerate(texts):
#         text.metadata["id"] = idx

#     retriever = Chroma.from_documents(texts, model_embeddings).as_retriever(search_kwargs={"k": 20})

#     query = "What did the president say about Ketanji Brown Jackson"
#     docs = retriever.invoke(query)
#     print(f"Retrieved {len(docs)} documents for the query.")

#     try:
#         chroma_collection = chroma_client.get_or_create_collection(name=collection_id)
#         chroma_collection.add(
#             documents=[doc.page_content for doc in texts],
#             metadatas=[doc.metadata for doc in texts],
#             ids=[str(doc.metadata["id"]) for doc in texts]
#         )
#         return JSONResponse(content={"status": "item added", "collection_id": collection_id, "item": item}, status_code=201)
    
#     except Exception as e:
#         print("Error adding documents to Chroma collection:", str(e))
#         return JSONResponse(content={"error": "Document already exists or is invalid"}, status_code=409)

# @router.post("/{collection_id}/items", description="Add a new File to a collection")
# async def add_item_to_collection(collection_id: str, item: UploadFile = File(...)):
#     content_bytes = await item.read()
#     if item.content_type.startswith("text/"):
#         text = content_bytes.decode("utf-8", errors="replace")
#         doc = Document(page_content=text, metadata={"source": item.filename})
#     elif item.content_type == "application/pdf":
#         # exemple simple avec PyPDF2 (démonstration) — extrayez correctement en production
#         import io, PyPDF2
#         reader = PyPDF2.PdfReader(io.BytesIO(content_bytes))
#         text = "\n".join(p.extract_text() or "" for p in reader.pages)
#         doc = Document(page_content=text, metadata={"source": item.filename})
#     else:
#         return JSONResponse({"error": "Unsupported file type"}, status_code=400)

#     text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
#     texts = text_splitter.split_documents([doc])
    # ... ensuite créez embeddings / stockez comme avant ...
# ...existing code...


@router.put("/{collection_id}/items/{item_id}", description="Update an item in a collection")
def update_item_in_collection(collection_id: str, item_id: str, item: dict):
    return {"status": "item updated", "collection_id": collection_id, "item_id": item_id, "item": item}


@router.delete("/{collection_id}/items/{item_id}", description="Delete an item from a collection")
def delete_item_from_collection(collection_id: str, item_id: str):
    return JSONResponse(content={"status": "item deleted", "collection_id": collection_id, "item_id": item_id}, status_code=204)