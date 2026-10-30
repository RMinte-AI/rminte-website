---
id: "ota-service"
language: "zh"
title: "TianshanOS OTA 更新服务"
source_commit: "c9b0897aa87a7e22a0ab264f9007a131f43a1135"
prepared_on: "2026-10-30"
content_kind: "public-service-instructions"
applicability: "Live page snapshot on 2026-10-30; current release is time-sensitive."
source_files: ["services/tianshanos-ota/src/page.js"]
source_urls: ["https://ota.rminte.com/"]
default_retrieval: true
evidence_status: "source transcription; not independent operational verification"
---

RM-01 / TianshanOS

# OTA 更新服务

为 RM-01 本机的 TianshanOS OTA 页面提供正式固件与 WebUI 更新文件。刷写操作仍在设备自己的管理页面中完成。

OTA 服务地址

`https://ota.rminte.com`复制地址

## 连接更新服务

1. 让电脑或平板连接 RM-01 所在网络。
2. 打开 RM-01 的 TianshanOS WebUI，并进入**“OTA 升级”** 。
3. 把上面的地址填入**“OTA 服务器”** 并保存。
4. 点击**“检查更新”** ，确认版本后开始升级。

[阅读使用指南](https://rminte.com/guides/)

## 当前发布

版本

0.6.3+ea9a4a2.10281515

固件
:   TianShanOS.bin
:   2.1 MB

WebUI
:   www.bin
:   3.0 MB

[查看版本信息](https://ota.rminte.com/version) [服务接口信息](https://ota.rminte.com/health)

“当前发布”仅为 2026-10-30 读取页面时的快照，咨询最新版本时须重新读取 OTA 服务。未下载或刷写固件，未执行真实设备升级。
