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

# Set working directory
WORKDIR /app

# Copy requirements file (if you have one)
COPY requirements.txt ./

# Install dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy your application code
COPY . .

# Command to run your script
CMD ["python3", "main.py"]