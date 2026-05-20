FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl \
    git \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install ttyd for web terminal
RUN curl -sL https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 -o /usr/local/bin/ttyd \
    && chmod +x /usr/local/bin/ttyd

# Setup workspace with a sample project to review
WORKDIR /root/workspace

# Create a sample project with intentional issues for code review
RUN git init -b main sample-api && cd sample-api && \
    git config user.email "dev@onboardinghub.com" && \
    git config user.name "Dev Team" && \
    mkdir src && \
    printf '{\n  "name": "sample-api",\n  "version": "1.0.0",\n  "scripts": {\n    "start": "node src/server.js"\n  }\n}\n' > package.json && \
    printf 'const express = require("express");\nconst app = express();\n\n// TODO: Add input validation\napp.get("/users/:id", (req, res) => {\n  const query = "SELECT * FROM users WHERE id = " + req.params.id;\n  res.json({ query });\n});\n\napp.post("/login", (req, res) => {\n  const { user, pass } = req.body;\n  console.log("Login attempt:", user, pass);\n  res.json({ token: "hardcoded-secret-123" });\n});\n\napp.listen(3000);\n' > src/server.js && \
    printf '# Sample API\n\nA simple REST API for the code review exercise.\n' > README.md && \
    git add -A && git commit -m "Initial commit: basic API setup" && \
    printf 'const express = require("express");\nconst app = express();\n\n// Input validation added\napp.get("/users/:id", (req, res) => {\n  const id = parseInt(req.params.id);\n  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });\n  res.json({ id });\n});\n\napp.post("/login", (req, res) => {\n  const { user, pass } = req.body;\n  console.log("Login attempt:", user, pass);\n  res.json({ token: "hardcoded-secret-123" });\n});\n\napp.listen(3000);\n' > src/server.js && \
    git add -A && git commit -m "Fix: validate user ID parameter" && \
    git checkout -b feature/auth-fix && \
    printf 'const express = require("express");\nconst crypto = require("crypto");\nconst app = express();\n\napp.get("/users/:id", (req, res) => {\n  const id = parseInt(req.params.id);\n  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });\n  res.json({ id });\n});\n\napp.post("/login", (req, res) => {\n  const { user, pass } = req.body;\n  if (!user || !pass) return res.status(400).json({ error: "Missing credentials" });\n  const token = crypto.randomBytes(32).toString("hex");\n  res.json({ token });\n});\n\napp.listen(3000);\n' > src/server.js && \
    git add -A && git commit -m "Refactor: secure login endpoint" && \
    git checkout main

EXPOSE 7681

ENTRYPOINT ["ttyd", "-p", "7681", "-W", "bash"]
