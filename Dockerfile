FROM node:18-slim

# Install system dependencies for node-canvas
# node-canvas requires build tools and libraries like cairo, pango, libjpeg, libgif
RUN apt-get update && \
    apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy source code
# We copy everything so we have js/ and assets/ available
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
