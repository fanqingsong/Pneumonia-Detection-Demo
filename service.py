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


# /v1/classify 的 JSON 响应，例如 {"class_name": "PNEUMONIA"}。
class Output(pydantic.BaseModel):
    class_name: t.Literal["NORMAL", "PNEUMONIA"]

    @classmethod
    def from_result(cls, logits: torch.Tensor) -> Output:
        # logits 例: tensor([[-2.10, 3.45]])，列 0=NORMAL、列 1=PNEUMONIA，数值越大越倾向该类。
        # id2label 例: {0: "NORMAL", 1: "PNEUMONIA"}
        id2label = model.config.id2label
        top_k = len(id2label)  # 例: 2
        # softmax 后第一张图的概率，例: tensor([0.004, 0.996])
        probs = logits.softmax(-1)[0]
        # 按概率从高到低：scores 例 [0.996, 0.004]，ids 例 [1, 0]
        scores, ids = probs.topk(top_k)
        # ranked 例: [(0.996, "PNEUMONIA"), (0.004, "NORMAL")]
        ranked = [
            (score, id2label[id_]) for score, id_ in zip(scores.tolist(), ids.tolist())
        ]
        # 取最高分标签，例: Output(class_name="PNEUMONIA")
        return cls(class_name=max(ranked, key=lambda item: item[0])[1])


@svc.api(
    input=bentoml.io.Image(),
    output=bentoml.io.JSON(pydantic_model=Output),
    route="/v1/classify",
)
async def classify(image: PIL.Image.Image) -> Output:
    # image 例: RGB 胸片，size=(1858, 1317)
    image = preprocess(image)
    # features 例: {"pixel_values": tensor, shape=[1, 3, 224, 224]}，已归一化到 ViT 输入
    features = extractor(images=image, return_tensors="pt")
    with torch.inference_mode():
        outputs = model(**features)
    # outputs.logits 例: tensor([[-2.10, 3.45]])，再交给 from_result 得到 {"class_name": "PNEUMONIA"}
    return Output.from_result(outputs.logits)
