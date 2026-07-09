from fastapi import FastAPI

app = FastAPI(
    title="METRO AI API",
    description="Money Exchange & Transfer Routing Optimizer Engine",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": "METRO AI",
        "message": "Welcome to the Money Exchange & Transfer Routing Optimizer Engine Gateway."
    }

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "database": "disconnected", "cache": "disconnected"}