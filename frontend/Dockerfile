FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Update and install Node.js and npm
RUN apt-get update && \
    apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Check Node.js and npm versions
RUN node -v && npm -v

# Create a custom user
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -m -d /home/appuser appuser

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

RUN chown -R 10001:10001 /app
USER appuser

# Build the application
RUN npm run build

# Install a simple server to serve the static files
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Command to serve the built application
CMD ["serve", "-s", "dist", "-l", "3000"]