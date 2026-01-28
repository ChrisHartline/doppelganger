"""
Modal deployment for TinyLlama LLM.

This module creates a serverless deployment of TinyLlama for the AI Doppelganger.
"""

import modal

# Create the Modal app
app = modal.App("doppelganger-llm")

# Define the container image with required dependencies
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "torch",
    "transformers",
    "accelerate",
    "fastapi",
    "pydantic",
)


@app.cls(
    image=image,
    gpu="T4",  # Use T4 GPU for inference
    container_idle_timeout=300,  # Keep warm for 5 minutes
    allow_concurrent_inputs=10,
)
class TinyLlamaModel:
    """TinyLlama model class for text generation."""

    @modal.enter()
    def load_model(self):
        """Load the model when the container starts."""
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch

        model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto",
        )

        # Set pad token
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

    @modal.method()
    def generate(
        self,
        system_prompt: str,
        messages: list[dict],
        max_tokens: int = 500,
        temperature: float = 0.7,
    ) -> str:
        """Generate a response from the model."""
        import torch

        # Build the chat prompt in TinyLlama format
        chat_template = "<|system|>\n{system}</s>\n"
        chat_template += "".join(
            [
                f"<|{msg['role']}|>\n{msg['content']}</s>\n"
                for msg in messages
            ]
        )
        chat_template += "<|assistant|>\n"

        prompt = chat_template.format(system=system_prompt)

        # Tokenize
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2048,
        ).to(self.model.device)

        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                do_sample=True,
                top_p=0.9,
                top_k=50,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )

        # Decode
        response = self.tokenizer.decode(
            outputs[0][inputs.input_ids.shape[1]:],
            skip_special_tokens=True,
        )

        return response.strip()


# FastAPI web endpoint
@app.function(image=image)
@modal.asgi_app()
def fastapi_app():
    """Create FastAPI app for HTTP endpoint."""
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel

    web_app = FastAPI(title="Doppelganger LLM API")

    class GenerateRequest(BaseModel):
        system_prompt: str
        messages: list[dict]
        max_tokens: int = 500
        temperature: float = 0.7

    class GenerateResponse(BaseModel):
        response: str

    @web_app.post("/generate", response_model=GenerateResponse)
    async def generate(request: GenerateRequest):
        try:
            model = TinyLlamaModel()
            response = model.generate.remote(
                system_prompt=request.system_prompt,
                messages=request.messages,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
            )
            return GenerateResponse(response=response)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @web_app.get("/health")
    async def health():
        return {"status": "ok"}

    return web_app


# Local entrypoint for testing
@app.local_entrypoint()
def main():
    """Test the model locally."""
    model = TinyLlamaModel()

    system_prompt = "You are Chris's AI Doppelganger, a professional software engineer."
    messages = [
        {"role": "user", "content": "Tell me about your experience with Python."}
    ]

    response = model.generate.remote(
        system_prompt=system_prompt,
        messages=messages,
    )

    print("Response:", response)
