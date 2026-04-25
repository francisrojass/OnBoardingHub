FROM onboardinghub/ubuntu-basic

RUN apt-get update && apt-get install -y python3 && rm -rf /var/lib/apt/lists/*

COPY index.html /opt/app/index.html

WORKDIR /opt/app
EXPOSE 8080

ENTRYPOINT []
CMD ["python3", "-m", "http.server", "8080", "--bind", "0.0.0.0"]
