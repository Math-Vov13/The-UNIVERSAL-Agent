from dataclasses import dataclass

@dataclass(frozen=True)
class Config:
    S3_BUCKET_NAME: str = "the-universal-agent"

CONFIG = Config()