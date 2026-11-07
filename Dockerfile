# ========================================================
# Dockerfile Multi-Stage para Easypanel (ISAAC Monólito)
# Constrói o Frontend React (Vite) e executa o Backend Node.js
# Servindo tudo na mesma porta (3001) sem problemas de CORS ou SSL
# ========================================================

# ESTÁGIO 1: Build do Frontend React
FROM node:22-alpine AS frontend-builder

WORKDIR /build/frontend

# Define VITE_BACKEND_URL vazio para garantir rotas relativas (/api/...)
# no monólito Docker — sem CORS, sem porta fixa hardcoded
ARG VITE_BACKEND_URL=""
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ARG VITE_SUPABASE_URL=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY=""
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Cache de dependências do frontend
COPY frontend/package*.json ./
RUN npm ci || npm install

# Copia código-fonte do frontend e faz o build de produção
COPY frontend/ ./
RUN npm run build

# =====================================================
# ESTÁGIO 2: Backend Node.js de Produção (Imagem Final)
# =====================================================
FROM node:22-alpine

WORKDIR /app

# Variáveis de ambiente padrão para Produção
# (As sensíveis — GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY — devem ser definidas
#  no painel de Environment Variables do Easypanel, NUNCA aqui no Dockerfile)
ENV NODE_ENV=production
ENV PORT=3001
ENV CORS_ORIGIN=*

# Instala apenas as dependências de produção do backend
COPY backend/package*.json ./backend/
RUN cd backend && (npm ci --omit=dev || npm install --omit=dev)

# Copia código-fonte do backend
COPY backend/ ./backend/

# Copia o build estático do frontend compilado no estágio 1
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

# Expõe apenas a porta 3001 (o Easypanel/Traefik faz o roteamento HTTP/HTTPS externo)
EXPOSE 3001

# Inicia o servidor orquestrador Hermes
CMD ["node", "backend/src/server.js"]
