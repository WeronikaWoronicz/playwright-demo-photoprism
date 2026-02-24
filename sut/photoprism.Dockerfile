# Custom PhotoPrism Docker image with accessibility improvements
# This image includes aria-labels and roles for better accessibility support in tests

FROM photoprism/photoprism:251130 AS base

# Stage 1: Extract and build custom frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /src

# Install git
RUN apk add --no-cache git

# Clone PhotoPrism and checkout version
RUN git clone https://github.com/photoprism/photoprism.git . && \
    git checkout 251130-b3068414c

# Copy accessibility patch from build context
COPY patches/navigation-accessibility.patch ./
RUN git apply navigation-accessibility.patch

# Install and build frontend
WORKDIR /src/frontend
RUN npm ci --legacy-peer-deps && \
    npm run build

# Stage 2: Apply built frontend to official PhotoPrism image
FROM photoprism/photoprism:251130

# Copy custom-built frontend
COPY --from=frontend-builder /src/assets/static/build /opt/photoprism/assets/static/build

# Environment configuration
ENV PHOTOPRISM_WORKERS=2 \
    PHOTOPRISM_READONLY=false \
    PHOTOPRISM_DISABLE_TLS=false \
    PHOTOPRISM_DEFAULT_LOCALE=en

EXPOSE 2342

