# Modal Deployment for TinyLlama

This directory contains the Modal deployment configuration for the TinyLlama LLM that powers the AI Doppelganger.

## Setup

1. Install Modal CLI:
   ```bash
   pip install modal
   ```

2. Authenticate with Modal:
   ```bash
   modal token new
   ```

3. Deploy the app:
   ```bash
   modal deploy app.py
   ```

## Usage

Once deployed, the API will be available at your Modal endpoint. Update the `MODAL_ENDPOINT` in your `.env` file with the deployed URL.

### API Endpoints

- `POST /generate` - Generate a response from the model
  ```json
  {
    "system_prompt": "You are Chris's AI Doppelganger...",
    "messages": [
      {"role": "user", "content": "Tell me about yourself"}
    ],
    "max_tokens": 500,
    "temperature": 0.7
  }
  ```

- `GET /health` - Health check endpoint

## Local Testing

Run locally with:
```bash
modal run app.py
```

## Configuration

The model uses TinyLlama-1.1B-Chat-v1.0 by default. You can modify the model in `app.py` if needed.

GPU: T4 (cost-effective for inference)
Container idle timeout: 5 minutes (keeps the model warm for quick responses)
