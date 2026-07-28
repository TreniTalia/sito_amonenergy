# syntax=docker/dockerfile:1

# Immagine del sito: build statica Astro servita da nginx.
# Astro è configurato senza adapter (output statico), quindi in produzione non
# gira alcun processo Node — solo nginx su file già generati.

# --- Stage 1: build ---------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Solo i manifest prima del resto: lo strato con le dipendenze resta in cache
# finché package-lock.json non cambia, e una modifica ai contenuti non fa
# ripartire npm ci.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: runtime -------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Il server di default va rimosso, non affiancato: ascolta anch'esso sulla 80
# con server_name _ e prevarrebbe sul nostro.
RUN rm /etc/nginx/conf.d/default.conf

COPY docker/nginx.conf /etc/nginx/conf.d/site.conf
COPY docker/snippets/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
