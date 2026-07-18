# Threadlinqs Intelligence MCP server (stdio transport).
# Introspection (tools/list) works with no API key; tool CALLS require THREADLINQS_API_KEY.
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
ENTRYPOINT ["node", "dist/index.js"]
