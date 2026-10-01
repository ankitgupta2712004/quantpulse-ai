import uvicorn

if __name__ == "__main__":
    print("[QuantPulse ML] Starting Python FastAPI Microservice on http://127.0.0.1:8000 ...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
