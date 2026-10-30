---
id: "system-overview"
language: "zh"
title: "TianshanOS 让整机协同有序"
source_commit: "c9b0897aa87a7e22a0ab264f9007a131f43a1135"
prepared_on: "2026-10-30"
content_kind: "official-product-copy"
applicability: "Preserve marketing claims as attributed site statements; diagrams/animations are illustrative, not measurements."
source_files: ["website/index.html", "website/assets/site-data.js", "website/assets/main.js", "website/assets/home-architecture.js"]
source_urls: ["https://rminte.com/#tianshanos"]
default_retrieval: true
evidence_status: "published claim; not independently tested"
---

整机协同

## TianshanOS 让整机协同有序

一台设备的运行，离不开内部各个部分的配合。TianshanOS 管理 RM-01 的内部设备与系统行为，让推理、应用与存储共同工作。无需专门建设供电、网络与机房环境，RM-01 就能走进业务现场。

查看界面演示

CUDA

ESP32

W5500

RTL8367RB

MAC/PHY

MAC/PHY

x86

ESP32

W5500

CUDA

RTL8367RB

MAC/PHY

MAC/PHY

x86

配置驱动硬件南北向设备控制安全配置包OTA 与自动化

引脚、服务与系统行为，都可以通过 JSON 配置定义。现场调试所需的代码修改因此减少，设备配置也有据可查。

北向管理推理算力，南向管理通用计算与存储。TianshanOS 连接两端，协调内部设备，让各个模组各司其职。

模型、密钥与现场参数的交付，需要清楚的安全边界。配置包支持 ECDH、AES-256-GCM 与 ECDSA 签名，为交付提供加密与签名支持。

设备可以通过 HTTPS 或 SD 卡升级，升级异常时自动回滚。WebUI、CLI 与 API 提供管理入口，规则引擎接手重复操作，让日常运维少一些手动处理。

## 示意图原始说明与标签

- 两台计算机分别经以太网控制器和 PHY 接入板载交换机，ESP32 经 W5500 接入并拥有配置存储；两台计算机各有独立存储。

- 推理计算机

- TianshanOS

- 板载以太网交换机

- 应用计算机

- 独立存储

- 配置存储

- PCIe

- SPI
