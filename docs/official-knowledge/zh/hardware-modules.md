---
id: "hardware-modules"
language: "zh"
title: "各司其职，整机交付"
source_commit: "c9b0897aa87a7e22a0ab264f9007a131f43a1135"
prepared_on: "2026-10-30"
content_kind: "official-product-copy"
applicability: "Preserve marketing claims as attributed site statements; diagrams/animations are illustrative, not measurements."
source_files: ["website/index.html", "website/assets/site-data.js", "website/assets/main.js"]
source_urls: ["https://rminte.com/#hardware"]
default_retrieval: true
evidence_status: "published claim; not independently tested"
---

硬件架构

## 各司其职，整机交付

应用有自己的运行空间，推理有专属的计算资源。RM-01 将模型、应用与运行环境整合进一台设备，让各个模组的协作，服务于你的业务。

### Agent 与应用模组

独立的 x86 计算机，为 Agent 与应用提供专属的运行资源。工具调用、代码执行与数据库访问在应用侧完成，模型推理由推理模组承担。兼容广泛的 x86 软件生态，让已有工具与业务应用更容易接入 Agent 工作流。

- x86
- 8  *核* 8  *线程*
- 16*GB*–32*GB* ECC
- 512*GB*–2*TB* NVMe

### 推理模组

自研推理引擎与高速互联线路提高推理效率。资源集中用于模型推理与 KV Cache，为更大模型、更长上下文与更高并发留出空间。

- 64*GB* VRAM
- 128*GB* VRAM
- 275  *TOPS* INT8
- 1200–2070  *TFLOPS* FP4

### 加密模组

你的后训练模型、RAG 知识库、业务数据与应用代码，都值得保护。独立安全模组隔离私钥，硬件级非对称密钥保护降低私钥导出与复制风险，为业务资产建立设备级安全边界。

TPM 2.0 / RSA / ECC

### 网络模组

调用本地 AI，也可以沿用熟悉的云服务接口体验。内部交换、路由与统一 API 连接各个模组，减少系统扩展与维护所需的改动。

内部交换 / 路由 / 统一 API

### 电源与热管理

统一供电、启动时序与 Z 型独立风道共同支撑整机运行，降低频繁启停、高负载和积尘的影响。减少停机与现场维护，让工作少受打扰。

USB-C PD 3.1 / 最高 140W / Z 型独立风道
