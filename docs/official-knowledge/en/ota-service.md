---
id: "ota-service"
language: "en"
title: "TianshanOS OTA update service"
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

# OTA update service

Provides official firmware and WebUI updates to the TianshanOS OTA page hosted on your RM-01 . Flashing remains securely controlled by the device’s own management interface.

OTA SERVER ADDRESS

`https://ota.rminte.com`Copy address

## Connect to the service

1. Connect your computer or tablet to the same network as the RM-01 .
2. Open the TianshanOS WebUI on your RM-01 , then go to **OTA Update** .
3. Enter the address above under **OTA Server** , then save it.
4. Select **Check for Updates** , confirm the version, and start the update.

[Read the guides](https://rminte.com/guides/)

## Current release

Version

0.6.3+ea9a4a2.10281515

Firmware
:   TianShanOS.bin
:   2.1 MB

WebUI
:   www.bin
:   3.0 MB

[View version information](https://ota.rminte.com/version) [Service API information](https://ota.rminte.com/health)

“Current release” is a snapshot read on 2026-10-30. Recheck the OTA service for the latest release. No firmware was downloaded or flashed and no real device update was performed.
