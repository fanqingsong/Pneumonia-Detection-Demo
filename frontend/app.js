const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const pickBtn = document.getElementById("pick-btn");
const clearBtn = document.getElementById("clear-btn");
const classifyBtn = document.getElementById("classify-btn");
const preview = document.getElementById("preview");
const emptyPreview = document.getElementById("empty-preview");
const result = document.getElementById("result");
const resultLabel = document.getElementById("result-label");
const resultDetail = document.getElementById("result-detail");
const apiStatus = document.getElementById("api-status");

let selectedFile = null;

function setResult(state, title, detail = "") {
  result.className = `result ${state}`;
  resultLabel.textContent = title;
  resultDetail.textContent = detail;
}

function setFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    setResult("error", "文件无效", "请上传图片格式的胸部 X 光片。");
    return;
  }

  selectedFile = file;
  classifyBtn.disabled = false;
  clearBtn.disabled = false;
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  emptyPreview.hidden = true;
  setResult("idle", "待检测", "图片已就绪，点击「开始检测」。");
}

function clearFile() {
  selectedFile = null;
  fileInput.value = "";
  classifyBtn.disabled = true;
  clearBtn.disabled = true;
  preview.hidden = true;
  preview.removeAttribute("src");
  emptyPreview.hidden = false;
  setResult("idle", "检测结果", "上传影像后点击「开始检测」");
}

async function checkApi() {
  try {
    const response = await fetch("/healthz", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("unhealthy");
    }
    apiStatus.textContent = "服务已就绪";
    apiStatus.className = "status ok";
  } catch (_error) {
    apiStatus.textContent = "服务未就绪";
    apiStatus.className = "status bad";
  }
}

async function classify() {
  if (!selectedFile) {
    return;
  }

  classifyBtn.disabled = true;
  setResult("idle", "检测中…", "模型正在分析胸部 X 光影像。");

  try {
    const response = await fetch("/v1/classify", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": selectedFile.type || "application/octet-stream",
      },
      body: selectedFile,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const className = data.class_name;
    if (className === "NORMAL") {
      setResult("normal", "NORMAL", "模型判断当前影像更接近正常胸部 X 光。");
    } else if (className === "PNEUMONIA") {
      setResult("pneumonia", "PNEUMONIA", "模型判断当前影像更接近肺炎表现。");
    } else {
      setResult("idle", className || "未知结果", "接口已返回，但类别不在预期范围内。");
    }
  } catch (error) {
    setResult("error", "检测失败", error.message || "无法连接模型服务。");
  } finally {
    classifyBtn.disabled = !selectedFile;
  }
}

dropzone.addEventListener("click", () => fileInput.click());
pickBtn.addEventListener("click", () => fileInput.click());
clearBtn.addEventListener("click", clearFile);
classifyBtn.addEventListener("click", classify);

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("dragover");
  const file = event.dataTransfer.files[0];
  setFile(file);
});

fileInput.addEventListener("change", () => {
  setFile(fileInput.files[0]);
});

document.querySelectorAll(".sample-btn").forEach((button) => {
  button.addEventListener("click", async () => {
    const url = button.dataset.sample;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("示例图片不存在");
      }
      const blob = await response.blob();
      const name = url.split("/").pop() || "sample.jpeg";
      setFile(new File([blob], name, { type: blob.type || "image/jpeg" }));
    } catch (error) {
      setResult("error", "示例加载失败", error.message);
    }
  });
});

checkApi();
setInterval(checkApi, 15000);
