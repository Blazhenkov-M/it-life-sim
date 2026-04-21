FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
COPY audio/ audio/
COPY --from=frontend /app/frontend/dist frontend/dist
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
