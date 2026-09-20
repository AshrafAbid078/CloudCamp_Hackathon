from fastapi import FastAPI
from dispatch.api import router as dispatch_router

app = FastAPI(
    title="AI Builders API",
    version="1.0.0",
)

app.include_router(dispatch_router)


@app.get("/")
def root():
    return {
        "message": "AI Builders API is running"
    }