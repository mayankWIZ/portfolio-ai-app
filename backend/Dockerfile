FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Update and install Python and pip
RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a custom user
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -m -d /home/appuser appuser

# Set working directory
WORKDIR /app

# Copy requirements file (if you have one)
COPY requirements.txt ./

# Install dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy your application code
COPY . .

RUN chown -R 10001:10001 /app
USER appuser

# Expose the port
EXPOSE 8000

# Command to run your script
CMD ["python3", "main.py"]