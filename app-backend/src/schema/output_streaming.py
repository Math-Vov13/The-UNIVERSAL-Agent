from pydantic import BaseModel
from typing import Any
from enum import StrEnum

class DeltaType(StrEnum):
    FILE_UPLOADED = "file_uploaded"
    TOOL_START = "tool_start"
    TOOL_END = "tool_end"
    CHAT_MODEL_STREAM = "chat_model_stream"
    MODEL_CHOSEN = "model_chosen"
    SUMMARY = "end"
    START = "start"
    ERROR = "error"


class StartingResponse(BaseModel):
    status: DeltaType= DeltaType.START
    timestamp: str
    model: str
    settings: dict[str, str] = {}
    message: str = "Starting response"


class ErrorResponse(BaseModel):
    status: DeltaType= DeltaType.ERROR
    error: str
    type: str = "exception"


class ChangeModel(BaseModel):
    status: DeltaType= DeltaType.MODEL_CHOSEN
    model: str

class FileUploaded(BaseModel):
    status: DeltaType= DeltaType.FILE_UPLOADED
    name: str
    key: str
    size: int
    mimeType: str
    type: str

class ToolStart(BaseModel):
    status: DeltaType= DeltaType.TOOL_START
    id: str
    name: str
    input: dict[str, Any]

class ToolEnd(BaseModel):
    status: DeltaType= DeltaType.TOOL_END
    id: str
    tool_id: str
    name: str
    output: Any

class DeltaMessage(BaseModel):
    status: DeltaType= DeltaType.CHAT_MODEL_STREAM
    tokens: int
    chunk: str

class SummaryMessage(BaseModel):
    status: DeltaType= DeltaType.SUMMARY
    inp_tokens: int
    out_tokens: int
    tools: list[str] = []
    response: str
    files: list[dict[str, str | int]] = []