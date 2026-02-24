# Stage 1: Build from source with patch applied
FROM photoprism/develop:jammy AS build

# Fetch PhotoPrism source at specific commit (ensures patch compatibility)
# Pinned to f6d2026 — the commit our accessibility patch was created against
WORKDIR /go/src/github.com/photoprism/photoprism
RUN git clone https://github.com/photoprism/photoprism.git . && \
    git checkout f6d202615aef868a810000c0cdd69e63e032a5d7

# Copy and apply the accessibility patch BEFORE building
COPY patches/navigation-accessibility.patch /tmp/navigation-accessibility.patch
RUN git apply /tmp/navigation-accessibility.patch && rm /tmp/navigation-accessibility.patch

# Build everything (frontend webpack + Go backend) and install to /opt/photoprism
RUN make all install DESTDIR=/opt/photoprism

# Stage 2: Slim runtime image
FROM photoprism/develop:jammy-slim

# Copy built artifacts from build stage
COPY --from=build /opt/photoprism/ /opt/photoprism

# Keep same defaults as official image
WORKDIR /photoprism
ENTRYPOINT ["/opt/photoprism/bin/photoprism"]
CMD ["start"]
