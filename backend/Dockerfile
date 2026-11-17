FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=0 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYBOT_PATH=/opt/pybot \
    PORT=7860

# PyBot fork with Mayank's portfolio module. Pin a branch or tag with --build-arg.
ARG PYBOT_REPO=https://github.com/mayankWIZ/pybot.git
ARG PYBOT_REF=main

RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/* \
    && git clone --depth 1 --branch "$PYBOT_REF" "$PYBOT_REPO" "$PYBOT_PATH" \
    && rm -rf "$PYBOT_PATH/.git" "$PYBOT_PATH/tests" "$PYBOT_PATH/assets" \
    && python -m compileall -q "$PYBOT_PATH/bot"

RUN useradd -m -u 1000 app
WORKDIR /app
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY --chown=app:app . .
RUN chown -R app:app "$PYBOT_PATH"
USER app

EXPOSE 7860
# One worker keeps a single ~250 MB copy of PyBot in memory; threads handle concurrent visitors.
CMD gunicorn main:app --bind 0.0.0.0:${PORT} --workers 1 --threads 8 --timeout 60
