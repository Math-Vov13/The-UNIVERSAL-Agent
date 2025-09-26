from fastapi import FastAPI, Request
import logging
from uuid import uuid4
from time import time
import os

from pydantic import BaseModel
from rag.main import llm

app = FastAPI(root_path="/api/v1")

class GenerationRequest(BaseModel):
    prompt: str

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),  # Save logs to a file
        logging.StreamHandler()         # Print logs to the console
    ]
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid4())
    start_time = time()
    
    # Extract client info
    client_host = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    content_type = request.headers.get("content-type", "unknown")
    
    # Pre-request logging with request ID
    logging.info(f"[{request_id}] Request received | {request.method} {request.url.path} | Client: {client_host} | UA: {user_agent[:30]}...")
    
    # Capture request body for specific endpoints (careful with privacy)
    request_body = None
    if request.url.path == "/generation":
        try:
            body_bytes = await request.body()
            request.body = lambda: body_bytes  # Reset body for further processing
            if content_type == "application/json":
                body_json = body_bytes.decode()
                request_body = body_json[:100] + "..." if len(body_json) > 100 else body_json
                logging.info(f"[{request_id}] Request payload: {request_body}")
        except Exception as e:
            logging.error(f"[{request_id}] Error reading request body: {str(e)}")
    
    # Process the request and catch exceptions
    try:
        response = await call_next(request)
        process_time = time() - start_time
        
        # Log response details with performance metrics
        status_category = response.status_code // 100
        log_level = logging.WARNING if status_category in [4, 5] else logging.INFO
        
        logging.log(
            log_level,
            f"[{request_id}] Response | Status: {response.status_code} | Time: {process_time:.3f}s | Size: {response.headers.get('content-length', 'unknown')} bytes"
        )
        
        return response
    except Exception as e:
        process_time = time() - start_time
        logging.error(f"[{request_id}] Exception during request processing: {str(e)} | Time: {process_time:.3f}s")
        raise

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/generation")
def create_generation(body: GenerationRequest):
    generation_id = str(uuid4())
    generation = llm.invoke(body.prompt)

    return {
        "model": llm.model,
        "generation_id": "gen-" + generation_id,
        "timestamp": time(),
        "response": generation.content,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=os.getenv("PORT", 8080))