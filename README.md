<div align="center">
    <h1 align="center">Pneumonia Detection with BentoML</h1>
    <br>
    <strong> Healthcare AI 🫁🔍- Made Easy with BentoML<br></strong>
    <i>Powered by BentoML 🍱 + HuggingFace 🤗</i>
    <br>
</div>
<br>

## 📖 Introduction 📖
In this project, we showcase the seamless integration of an image detection model into a service using BentoML. Leveraging the power of the pretrained `nickmuchi/vit-finetuned-chest-xray-pneumonia model` from HuggingFace, users can submit their lung X-ray images for analysis. The model will then determine, with precision, whether the individual has pneumonia or not.


📝 **Disclaimer: Please note that this project is not intended to replace professional medical advice. It is designed purely for demonstration and testing purposes. Always consult with a qualified healthcare professional for a proper diagnosis.**

| Normal | Pneumonia                               	|
|------- |-----------------------------------------	|
| ![Normal](samples/NORMAL2-IM-1427-0001.jpeg)| ![Pneumonia](samples/person1950_bacteria_4881.jpeg) |

## 🏃‍♂️ Running the Service 🏃‍♂️
### Docker Compose (recommended)
The easiest way to run the demo locally is with [Docker Compose V2](https://docs.docker.com/compose/) (`docker compose`, not the legacy `docker-compose` binary). You need Docker installed.

```bash
git clone https://github.com/bentoml/Pneumonia-Detection-demo.git && cd Pneumonia-Detection-demo

./start.sh
```

`start.sh` runs `docker compose up --build -d`. Equivalent commands:

```bash
docker compose up --build -d
docker compose logs -f api
```

This starts two services:

| Service | Port | Description |
|---------|------|-------------|
| `web` | [http://127.0.0.1:8080](http://127.0.0.1:8080) | Nginx frontend for uploading X-ray images |
| `api` | [http://127.0.0.1:3000](http://127.0.0.1:3000) | BentoML API and Swagger UI |

The frontend proxies `/v1/` and health checks to the API, so you can classify images from the UI without calling port 3000 directly.

The first start downloads the Hugging Face model (via `HF_ENDPOINT`, default `https://hf-mirror.com`) and can take several minutes. Model and Hugging Face caches are stored in named volumes (`hf-cache`, `bentoml-store`) so later starts skip the download.

To stop:

```bash
./stop.sh
# or: docker compose down
```

Caches are kept after stop. Remove them with `docker compose down -v` if you want a clean slate.

Optional: set `HF_ENDPOINT` in the environment (or a `.env` file next to `docker-compose.yml`) to use another Hugging Face hub mirror.

### BentoML CLI
Clone the repository and install the dependencies:
```bash
git clone https://github.com/bentoml/Pneumonia-Detection-demo.git && cd Pneumonia-Detection-demo

pip install -r requirements/pypi.txt
```

To serve the model with BentoML:
```
bentoml serve
```

You can then open your browser at http://127.0.0.1:3000 and interact with the service through Swagger UI.

### Pre-built containers
We also provide two pre-built images optimized for CPU and GPU usage. These run the API only (no frontend). You need a container engine such as Docker or Podman:

```bash
# cpu
docker run -p 3000:3000 ghcr.io/bentoml/pneumonia-detection-demo:cpu

# gpu
docker run --gpus all -p 3000:3000 ghcr.io/bentoml/pneumonia-detection-demo:gpu
```

## 🌐 Interacting with the Service 🌐
BentoML's default model serving method is through an HTTP server. In this section, we demonstrate various ways to interact with the service.

If you started the stack with Docker Compose, open the web UI at http://127.0.0.1:8080 and upload a chest X-ray. Sample images live under `samples/` and `frontend/samples/`.

### cURL
```bash
curl -X 'POST' \
  'http://localhost:3000/v1/classify' \
  -H 'accept: application/json' \
  -H 'Content-Type: image/mpo' \
  --data-binary '@path-to-image'
```
> Replace `path-to-image` with the file path of the image you want to send to the service. With Docker Compose you can also POST to `http://localhost:8080/v1/classify` (proxied by nginx).

The response look like:
```json
{"class_name":"NORMAL"}
```
### Via BentoClient 🐍
To send requests in Python, one can use ``bentoml.client.Client`` to send requests to the service. Check out `client.py` for the example code.

### Swagger UI
You can use Swagger UI to quickly explore the available endpoints of any BentoML service.

## 🚀 Deploying to Production 🚀
Effortlessly transition your project into a production-ready application using [BentoCloud](https://www.bentoml.com/bento-cloud/), the production-ready platform for managing and deploying machine learning models.

Start by creating a BentoCloud account. Once you've signed up, log in to your BentoCloud account using the command:

```bash
bentoml cloud login --api-token <your-api-token> --endpoint <bento-cloud-endpoint>
```
> Note: Replace `<your-api-token>` and `<bento-cloud-endpoint>` with your specific API token and the BentoCloud endpoint respectively.

Next, build your BentoML service using the `build` command:

```bash
bentoml build
```

Then, push your freshly-built Bento service to BentoCloud using the `push` command:

```bash
bentoml push <name:version>
```

Lastly, deploy this application to BentoCloud with a single `bentoml deployment create` command following the [deployment instructions](https://docs.bentoml.org/en/latest/reference/cli.html#bentoml-deployment-create).

BentoML offers a number of options for deploying and hosting online ML services into production, learn more at [Deploying a Bento](https://docs.bentoml.org/en/latest/concepts/deploy.html).

## 👥 Community 👥
BentoML has a thriving open source community where thousands of ML/AI practitioners are 
contributing to the project, helping other users and discussing the future of AI. 👉 [Pop into our Slack community!](https://l.bentoml.com/join-slack)
