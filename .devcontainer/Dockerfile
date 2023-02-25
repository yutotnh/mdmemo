FROM mcr.microsoft.com/devcontainers/rust:0-1-bullseye

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends libgtk-3-dev \
                                                  libwebkit2gtk-4.0-dev \
                                                  libappindicator3-dev \
                                                  librsvg2-dev \
                                                  patchelf
