---
id: "hardware-security"
language: "en"
title: "RM-01 Hardware Security"
source_commit: "c9b0897aa87a7e22a0ab264f9007a131f43a1135"
prepared_on: "2026-10-30"
content_kind: "product-security-document"
applicability: "2026-09-11; version-independent (confirmed by owner). PDF page references retained; page layout is not reproduced."
source_files: ["website/assets/downloads/rm01-hardware-security-en.pdf"]
source_urls: ["https://rminte.com/assets/downloads/rm01-hardware-security-en.pdf"]
default_retrieval: true
evidence_status: "source transcription; not independent operational verification"
---

## Original PDF page 1

RMinte
RM-01
Hardware Security
Network access · Device binding · Tamper protection
Product Security Documentation / English Edition
September 2026
www.rminte.com

## Original PDF page 2

RM-01 | Hardware Security RMinte
Contents
RM-01 hardware security and supporting management functions
1. Security Overview . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3
2. Hardware Architecture and Security Roles . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4
3. Network Access and USB Controls . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
4. Storage Encryption and Software Protection . . . . . . . . . . . . . . . . . . . . . . . . . . . 7
5. Compute Module Binding . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 9
6. Physical Tamper and Boot Protection . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 10
7. TianshanOS Identity and Credential Management . . . . . . . . . . . . . . . . . . . . . . . 11
8. Operation and Maintenance Requirements . . . . . . . . . . . . . . . . . . . . . . . . . . . 13
About this document
The main text describes the security measures and their purpose. Shaded notes explain technical
concepts and the scope of protection. Use the contents or PDF bookmarks to navigate between sections.
English | 02

## Original PDF page 3

RM-01 | Hardware Security RMinte
1. Security Overview
RM-01 incorporates network access controls, storage encryption, device binding, and physical tamper
protection into its hardware design. These measures protect the supplied software environment and
restrict unauthorized access, transfer, and use.
The design addresses five areas:
• Defined network access boundaries: Connecting a device through C1 does not, by itself,
expose internal services to the entire office network.
• Software bound to its designated unit: Storage encryption and card-to-unit binding prevent
the supplied environment from being reused on another unit by moving the card.
• Compute modules bound to their original carrier board: Both AGX and LPMU have
boot-level binding that prevents unauthorized use on another board.
• Physical tamper protection: Custom screws make the enclosure harder to open. Opening it
interrupts RTC backup power and prevents the unit from booting.
• Device identity management: TianshanOS manages keys, certificates, and connection
identities to support authenticated device administration.
This document covers RM-01 hardware and its supporting embedded system. It complements the software
supplier's application security documentation. Business accounts, application permissions, and business
data management are covered in that documentation.
English | 03

## Original PDF page 4

RM-01 | Hardware Security RMinte
2. Hardware Architecture and Security Roles
LPMU AGX ESP32
Applications and storage Model inference TianshanOS management
Onboard Ethernet switch
RM-01 consists of three main units for application computing, model inference, and device management,
connected through an onboard Ethernet switch. Each unit has a defined role and hosts the corresponding
workloads or management functions.
This division of responsibilities places the supplier's application storage on LPMU and the operating
system and inference storage on AGX, with defined boundaries for operation and management.
Technical note: Compute modules and system software
x86 is the processor architecture used by LPMU. Ubuntu Server is the server operating system used by AGX. The
inference engine is software that runs on the operating system and uses AI models to perform computations.
The onboard switch connects the internal devices. Network connectivity and access permissions are separate
concerns; service permissions must be configured as part of the deployment.
English | 04

| Hardware unit | Primary role | Security role |
| --- | --- | --- |
| LPMU application server | An x86 platform that runs the supplier's software and has its own storage. | Hosts business applications. Binding to the original carrier board restricts use of the module in another unit. |
| AGX inference server | An NVIDIA computing platform running Ubuntu Server and the inference engine. | Provides model inference. Storage-card and module binding protect the inference environment. |
| ESP32 management unit | Runs TianshanOS for device management, USB switching, and key and certificate management. | Controls USB connection targets and provides device identity management. |

## Original PDF page 5

RM-01 | Hardware Security RMinte
3. Network Access and USB Controls
3.1 Internal Network Access through C1
C1 connects a computer, tablet, phone, or other endpoint to RM-01. The endpoint detects a USB network
interface and joins the RM-01 internal subnet, where it can access the application and management
services made available to it.
C1 brings the endpoint onto the RM-01 internal network; it does not automatically place RM-01 on
the endpoint's existing office LAN.
For example, a computer may connect to the office network over Wi-Fi and to RM-01 through C1. Unless
bridging, forwarding, or another external access path is enabled, other devices on the office network do not
gain access to RM-01 simply because C1 is connected.
This design supports local, direct access and reduces the risk of exposing internal services to the office
network without realizing it.
C1 is an entry point to the RM-01 internal network and should connect only to trusted, managed endpoints.
Connection sharing, bridging, proxies, and port forwarding can change the access boundary and should be
configured by an administrator.
Technical note: Subnets and access boundaries
A subnet is a group of networked devices with a defined address range. A computer can connect to both the office
network and the RM-01 subnet. Communication between those networks depends on whether a bridge, route, or
other forwarding path exists.
C1 does not provide one-way data transfer or an air gap. Its role is to establish a defined access path without
exposing services to a wider network merely by connecting a cable.
English | 05

## Original PDF page 6

RM-01 | Hardware Security RMinte
3.2 Connection Target Control for C3
C3 is the shared USB port at the top of the enclosure. TianshanOS can switch its connection target to
ESP32, AGX, or LPMU.
When a direct connection to a compute module is not needed, C3 can be assigned to ESP32 so that it no
longer connects to AGX or LPMU. ESP32 does not provide an SSH server login interface. This setting
removes an unnecessary direct path to the compute modules through C3.
Switching the target changes only the C3 connection. It does not affect an existing C1 network connection
or disable services reachable through other network paths.
Technical note: USB switching and management interfaces
An internal hardware multiplexer switches C3 between modules. The port connects to the selected module at any
given time.
SSH is an encrypted protocol for logging in to a device and running commands over a network. A serial interface is a
separate management channel used for configuration, logs, and maintenance. C3 may still provide serial access
when assigned to ESP32, so the absence of an SSH login interface does not mean the port is disabled.
3.3 Controlled Access from the LAN
To share RM-01 services on a LAN, C3 can be assigned to LPMU and connected to a switch or router
through an Ethernet adapter. TianshanOS can then initiate the associated network configuration.
This deployment mode extends the access boundary. An administrator should define which services,
devices, and connection paths are needed, without exposing unnecessary management interfaces.
Technical note: Routing and port forwarding
Routing connects different networks. Port forwarding directs connections received at a network entry point to an
internal service.
Port forwarding makes the corresponding internal service reachable from a wider network. LAN sharing must
therefore be managed as a separate deployment configuration; the access boundary for a local C1 connection no
longer applies.
English | 06

## Original PDF page 7

RM-01 | Hardware Security RMinte
4. Storage Encryption and Software Protection
4.1 Encryption and Card-to-Unit Binding
RM-01 uses a CFexpress Type B card to hold the AGX Ubuntu Server installation, the inference engine,
and the supplier's software for delivery. These components are encrypted, and the card is bound to a
designated RM-01 unit.
The environment supplied on a card assigned to unit A cannot run on unit B.
This mechanism prevents reuse of the complete system and software by transferring the card to another
unit. It protects the supplier's licensing rights and keeps the supplied environment tied to its designated
hardware.
A card reader can recognize and read the card. Reading its contents does not remove the device binding
or enable the original system and software to run on another unit.
Technical note: Encryption and runtime binding
Encryption protects content; device binding determines which unit can run it. They serve different purposes and work
together to protect the supplied environment.
Binding a card to one unit restricts its use. It does not mean a reader cannot read the card, or that every partition and
file on it is unreadable.
English | 07

## Original PDF page 8

RM-01 | Hardware Security RMinte
4.2 Separate Delivery and Application Storage
The supplier's software is delivered on the CFexpress Type B card. When the software runs, RM-01
transfers it to LPMU's own storage and removes it from the card once the transfer is complete. LPMU then
hosts the application.
This process separates the delivery medium from the storage used to run the application, reducing the
exposure associated with leaving the supplier's software on a removable card. Removing the card after the
transfer does not provide access to the application environment stored on LPMU.
Technical note: File handling after transfer
Removal from the card describes a change in where the software is stored. It does not mean the files have been
securely erased beyond recovery.
File removal, encryption, and secure erasure are different mechanisms. Protection of applications and data on
LPMU's storage depends on the software security plan and the delivered configuration.
4.3 Inference Processing and Business Records
The AGX inference engine receives computation requests and returns results. In this deployment, the
CFexpress Type B card is not used as persistent business storage for requests or inference results.
Reading the operating system or inference engine files does not provide access to historical business
records or application data stored on LPMU.
Whether conversations, files, or business results are retained, where they are stored, and who may access
them are defined by the supplier's application configuration and software security plan.
Technical note: Persistent and temporary data
Persistence means writing data to storage so that it remains available after a program exits or the device loses
power.
Model files, temporary computation data, runtime logs, and business records are different types of data. The
statement that the inference service does not retain business records is not a promise to erase all model files,
caches, or logs.
English | 08

## Original PDF page 9

RM-01 | Hardware Security RMinte
5. Compute Module Binding
5.1 AGX Boot Binding
AGX uses a device-specific ID and a custom BIOS configuration and is bound to its original carrier board.
Transferring AGX to another board, including an identical board in another RM-01, prevents the system
from booting. Matching connectors and board models do not allow the original inference environment to be
restored by moving the module.
5.2 LPMU Boot Binding
LPMU uses a custom BIOS configuration and is also bound to its original carrier board.
The system cannot boot if LPMU is transferred to another development board or an identical board in
another RM-01. This prevents the original application environment from being used on another board by
moving the entire application compute module.
AGX and LPMU binding is enforced at system boot. It protects startup of the computing
environment, rather than relying solely on a license check within an individual application.
Technical note: Device identity and boot firmware
A device ID distinguishes one device from another. BIOS is low-level firmware responsible for hardware initialization
and system startup; this document uses the product's term for its custom boot firmware.
Connector compatibility establishes a physical connection, not permission to boot. Module binding restricts system
startup and use on other carrier boards; it does not establish that every storage medium is unreadable on its own.
English | 09

## Original PDF page 10

RM-01 | Hardware Security RMinte
6. Physical Tamper and Boot Protection
6.1 Custom Enclosure Protection
The RM-01 structural enclosure is secured with two screws designed exclusively for RM-01. Their design
makes disassembly more difficult and raises the barrier to unauthorized access to the internal board and
compute modules.
The screws and internal boot protection work together: the screws restrict physical access, while boot
protection prevents continued operation after the structural enclosure has been opened.
6.2 Boot Protection Triggered by Enclosure Opening
The RM-01 enclosure design links opening the structural enclosure to the board's RTC backup power.
Opening it interrupts RTC battery power and triggers hardware-level protection, preventing the board from
operating and the unit from booting.
This design prevents continued use after unauthorized disassembly and protects the original hardware
assembly and operating environment.
The manufacturer can restore operation after this protection has been triggered. Internal repairs and
recovery should be handled through the manufacturer's service process.
Technical note: RTC and boot protection
RTC stands for Real-Time Clock. The RTC battery supplies backup power to the clock and related circuitry when the
main power is off.
RM-01 links this backup power state to its custom boot protection. The startup restriction following loss of RTC power
is part of the RM-01 design, not a feature common to all computers.
Opening the enclosure here means disassembling the structural enclosure. It does not include opening the top
magnetic cover to access C3 as described in the operating instructions. Triggering boot protection does not
automatically erase business data.
6.3 Long-Term Backup Power and Manufacturer Recovery
RM-01 uses a high-quality RTC battery and a low-power backup design to provide at least five years of
RTC power, reducing the impact of battery depletion on normal use.
Battery depletion also triggers boot protection. Battery maintenance and enclosure servicing should
therefore be handled by the manufacturer to avoid an unintended interruption of backup power.
Boot protection does not mean the unit is permanently unusable. The manufacturer can address the
battery and restore startup as part of the service process.
English | 10

## Original PDF page 11

RM-01 | Hardware Security RMinte
7. TianshanOS Identity and Credential Management
TianshanOS runs on ESP32 and manages keys, certificates, and connection identities. These functions
support identity verification for device administration and management of the associated credentials.
7.1 Key Pair Generation and Management
TianshanOS can generate and manage RSA and elliptic-curve key pairs on the device for defined
purposes. Keys can authenticate device connections and reduce the need to enter passwords during
routine administration.
Private-key export is disabled by default. Only keys marked as exportable when created can be exported
through the export function.
Technical note: Public and private keys
A public key is shared with the party verifying an identity, while the holder keeps the private key. During
authentication, the holder performs a cryptographic operation using the private key, and the other party verifies it
using the public key without receiving the private key.
Disabling export by default is a key management policy, not a guarantee that private keys cannot be extracted under
every form of physical attack.
7.2 Public-Key Authorization and Revocation
TianshanOS can deploy public keys to target servers for SSH key authentication and revoke keys that
have been deployed.
When an administrative connection is retired or its authorization changes, the corresponding public key
can be removed to end its authorization for future logins.
Technical note: Scope of revocation
Revoking a public key removes the authentication permission associated with that key. It does not remove other
accounts, passwords, or authorized keys on the target server. Broader permission changes should be coordinated
with account management.
English | 11

## Original PDF page 12

RM-01 | Hardware Security RMinte
7.3 Connection Identity Verification
TianshanOS records and verifies SSH host fingerprints. If a previously recorded host's fingerprint changes,
it rejects the connection by default until the change is explicitly accepted.
This identifies changes in the connection target's identity, helping administrators investigate device
replacement, system reinstallation, or impersonation instead of relying on the network address alone.
Technical note: Host fingerprints
A host fingerprint is a digest of a server's public key, used to compare the current connection target with the recorded
identity.
A trusted record must be established on first connection. Any later change requires investigation. A changed
fingerprint does not necessarily indicate an attack, but it should not be accepted without verification.
7.4 Device Certificate Management
TianshanOS can generate device keys and certificate signing requests, request certificates from a
certificate service, and install and manage device certificates and CA certificate chains. These functions
support certificate-based identity authentication.
Technical note: Digital certificates and CAs
A digital certificate associates an identity with a public key and is issued by a certificate authority (CA). A certificate
signing request submits the public key and identity information without submitting the private key.
The services covered by certificate authentication depend on their configuration. Certificate management capabilities
do not mean that every interface uses certificate authentication.
English | 12

## Original PDF page 13

RM-01 | Hardware Security RMinte
8. Operation and Maintenance Requirements
To maintain the security state established at delivery, follow these requirements for device connections,
network access, and internal maintenance:
These requirements help preserve network access boundaries, device binding, and physical protection,
and provide a basis for fault recovery and long-term maintenance.
English | 13

| Area | Requirement |
| --- | --- |
| Endpoint access | Connect trusted, managed endpoints to C1. Keep unmanaged devices off the internal network. |
| USB configuration | Set the C3 target to match its intended use and remove unnecessary direct paths to compute modules. |
| Service sharing | Have an administrator configure LAN access and port forwarding, with a defined scope of exposed services. |
| Card and module replacement | Confirm device binding and recovery arrangements before replacement. Identical parts are not necessarily interchangeable between units. |
| Internal servicing | Have the manufacturer service the structural enclosure, board, and RTC battery to avoid triggering boot protection through unauthorized disassembly. |
| Credential management | Define the purpose, custody, and retirement process for keys and certificates. Revoke authorization that is no longer needed. |
