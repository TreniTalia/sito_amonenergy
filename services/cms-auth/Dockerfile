# syntax=docker/dockerfile:1

# Backend OAuth del pannello /admin.
# Nessuna dipendenza npm: niente npm install, niente lockfile, un solo file.

FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY server.mjs ./

# L'immagine node fornisce già l'utente non privilegiato `node`. Questo
# processo non scrive nulla su disco, non gli serve root.
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1

CMD ["node", "server.mjs"]
