---
id: "system-overview"
language: "en"
title: "TianshanOS Bringing the system together"
source_commit: "c9b0897aa87a7e22a0ab264f9007a131f43a1135"
prepared_on: "2026-10-30"
content_kind: "official-product-copy"
applicability: "Preserve marketing claims as attributed site statements; diagrams/animations are illustrative, not measurements."
source_files: ["website/index.html", "website/assets/site-data.js", "website/assets/main.js", "website/assets/home-architecture.js"]
source_urls: ["https://rminte.com/#tianshanos"]
default_retrieval: true
evidence_status: "published claim; not independently tested"
---

SYSTEM ORCHESTRATION

## TianshanOS Bringing the system together

A system depends on its parts working in concert. TianshanOS manages the devices and system behavior inside RM-01 , coordinating inference, applications, and storage. Bring RM-01 to your business site without building dedicated power, network, or server-room infrastructure.

View interface demo

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

Configuration-driven hardwareNorth-south device controlSecure config packsOTA and automation

JSON configuration defines pins, services, and system behavior. That means fewer code changes during on-site setup and a clear record of how the device is configured.

Northbound control manages inference compute; southbound control manages general-purpose compute and storage. TianshanOS links both sides and coordinates the internal devices, with each module serving its role.

Delivering models, keys, and site parameters calls for a clear security boundary. Config packs support ECDH, AES-256-GCM, and ECDSA signatures, providing encryption and signatures for delivery.

Update your device through HTTPS or an SD card, with automatic rollback if an update fails. Manage it through WebUI, CLI, or API. The rule engine handles repeat operations, reducing manual work in day-to-day maintenance.

## Original diagram descriptions and labels

- Both computers connect to the onboard switch through Ethernet controllers and PHYs. ESP32 connects through W5500 and has configuration storage. Each computer has its own storage.

- Inference computer

- TianshanOS

- Onboard Ethernet switch

- Application computer

- Dedicated storage

- Config storage

- PCIe

- SPI
