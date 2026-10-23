FROM node:20-alpine

WORKDIR /app

# Instalar dependencias de producción
COPY package.json ./
RUN npm install --omit=dev

# Copiar código fuente
COPY src ./src

# Zona horaria y entorno por defecto
ENV TZ=America/Bogota
ENV NODE_ENV=production
ENV WEB_PORT=3080

EXPOSE 3080

CMD ["node", "src/presentation/http/server.js"]

