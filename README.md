# SmartWallet AI - MERN + FastAPI Fraud Check

This project is split into 3 parts:
- `ai-service/` (FastAPI) - fraud scoring
- `backend/` (Node/Express + MongoDB) - transaction API that calls FastAPI
- `frontend/` (React + Tailwind) - UI

## 1) Run the AI microservice

> From repo root

```bash
pip install -r fintech-ai-app/ai-service/requirements.txt
uvicorn fintech-ai-app.ai-service.main:app --reload --port 8001
```

AI endpoint:
- `POST http://localhost:8001/fraud/check`

## 2) Run MongoDB

Start MongoDB locally (or set `MONGODB_URI`).
Default DB name: `smartwallet_ai`.

## 3) Run the backend

```bash
cd fintech-ai-app/backend
npm i
npm run dev
```

Backend endpoint:
- `POST http://localhost:5000/api/transactions/send`

Expected request body:
```json
{
  "fromUserId": "...",
  "toUserId": "...",
  "amount": 120,
  "senderTxCountLast24h": 0,
  "isNewRecipient": false
}
```

## 4) Run the frontend

```bash
cd fintech-ai-app/frontend
npm i
npm run dev
```

## Notes for the SendMoney demo
- The frontend currently uses demo user IDs.
- To fully test, create users in MongoDB (or extend backend with a create-user endpoint).

