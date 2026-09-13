from __future__ import annotations

import typing as t

import torch
import pydantic
import PIL.Image
import PIL.ImageOps
import transformers

import bentoml

from save_model import download_model

_ = download_model()

MODEL_ID = "nickmuchi/vit-finetuned-chest-xray-pneumonia"
extractor = transformers.ViTImageProcessor.from_pretrained(MODEL_ID)
model = transformers.AutoModelForImageClassification.from_pretrained(MODEL_ID)
model.eval()

svc = bentoml.Service("pneumonia-classifier")


def preprocess(image: PIL.Image.Image) -> PIL.Image.Image:
    return PIL.ImageOps.exif_transpose(image).convert("RGB")


class Output(pydantic.BaseModel):
    class_name: t.Literal["NORMAL", "PNEUMONIA"]

    @classmethod
    def from_result(cls, logits: torch.Tensor) -> Output:
        id2label = model.config.id2label
        top_k = len(id2label)
        probs = logits.softmax(-1)[0]
        scores, ids = probs.topk(top_k)
        ranked = [
            (score, id2label[id_]) for score, id_ in zip(scores.tolist(), ids.tolist())
        ]
        return cls(class_name=max(ranked, key=lambda item: item[0])[1])


@svc.api(
    input=bentoml.io.Image(),
    output=bentoml.io.JSON(pydantic_model=Output),
    route="/v1/classify",
)
async def classify(image: PIL.Image.Image) -> Output:
    image = preprocess(image)
    features = extractor(images=image, return_tensors="pt")
    with torch.inference_mode():
        outputs = model(**features)
    return Output.from_result(outputs.logits)
