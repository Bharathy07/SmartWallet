from __future__ import annotations

from typing import Dict, Any

import json
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

app = FastAPI(title="SmartWallet AI Fraud Check", version="1.0")


# CORS: allow Vite/dev + local testing.
# If you have a different frontend origin, adjust accordingly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)





def simple_risk_score(payload: Dict[str, Any]) -> float:
    """Beginner-friendly, explainable risk scoring.

    Input fields expected (all optional):
    - amount: float
    - hour: int (0-23) local time of the transaction
    - isNewRecipient: bool
    - senderTxCountLast24h: int

    Returns:
        risk score in [0, 100]
    """

    amount = float(payload.get("amount", 0) or 0)
    hour = int(payload.get("hour", 12) or 12)
    is_new_recipient = bool(payload.get("isNewRecipient", False))
    sender_tx_count = int(payload.get("senderTxCountLast24h", 0) or 0)

    risk = 0.0

    # 1) High amount heuristic
    # - >= 1000 => +40
    # - >= 500  => +25
    # - >= 200  => +12
    if amount >= 1000:
        risk += 40
    elif amount >= 500:
        risk += 25
    elif amount >= 200:
        risk += 12

    # 2) Late-night transactions heuristic (e.g., 0-5)
    if hour <= 5 or hour >= 23:
        risk += 15

    # 3) New recipient heuristic
    if is_new_recipient:
        risk += 20

    # 4) Rapid sending heuristic
    # More than ~5 tx in last 24h => +up to 15
    if sender_tx_count >= 10:
        risk += 15
    elif sender_tx_count >= 5:
        risk += 10
    elif sender_tx_count >= 2:
        risk += 5

    # Cap to [0, 100]
    return max(0.0, min(100.0, risk))


def ml_i_forest_like_adjustment(payload: Dict[str, Any]) -> float:
    """Light (optional) ML-like adjustment.

    Note: This project intentionally avoids real model training to keep
    dependencies small and explainable in a student viva.

    We map the heuristic risk score to a slightly higher score when
    it is already high.
    """
    score = simple_risk_score(payload)

    # If score is already high, increase further slightly.
    if score >= 70:
        return min(100.0, score + 10)
    if score >= 45:
        return min(100.0, score + 5)
    return score


@app.get("/")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "smartwallet-ai"}


# NOTE: Spec-required endpoint + response schema:
# POST /predict
# Returns:
#   { "prediction": "Safe", "score": 0.14 }
#   { "prediction": "Fraud", "score": 0.91 }
@app.post("/predict")
def predict(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Reuse existing explainable heuristic scoring.
    risk = ml_i_forest_like_adjustment(payload)  # 0..100

    # Convert to a score in 0..1 for frontend.
    score01 = float(risk) / 100.0

    # Map to Safe/Fraud.
    # Spec says show Safe/Fraud beside transactions.
    prediction = "Fraud" if risk >= 50 else "Safe"

    return {
        "prediction": prediction,
        "score": round(score01, 2),
    }


# Backwards-compatible endpoint for current demo frontend/backend.
# (Will be removed once Node backend is fully refactored.)
@app.get("/predict/stream")
def predict_stream():
    # Kept as a placeholder to avoid breaking clients; SSE requires an input payload.
    # Use POST /predict for now.
    from fastapi.responses import JSONResponse

    return JSONResponse({"error": "SSE requires POST body; use POST /predict or /fraud/check"})


@app.post("/fraud/check")
def fraud_check(payload: Dict[str, Any]) -> Dict[str, Any]:

    risk = ml_i_forest_like_adjustment(payload)
    allow = risk < 50
    reason = (
        "Transaction looks normal based on amount/time/recipient/activity heuristics."
        if allow
        else "Transaction appears risky based on amount/time/recipient/activity heuristics."
    )

    return {
        "allow": allow,
        "reason": reason,
        "riskScore": round(float(risk), 2),
    }

