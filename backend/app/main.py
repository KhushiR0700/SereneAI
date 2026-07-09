from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import feedback, question

app = FastAPI(
    title="Serenai API", 
    description="Backend for the Serenai AI interview platform"
)

# Enable CORS (allow all origins for now to facilitate frontend development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers
app.include_router(feedback.router, prefix="/api", tags=["feedback"])
app.include_router(question.router, prefix="/api", tags=["question"])

@app.get("/")
async def root():
    return {"message": "SereneAI backend running"}
