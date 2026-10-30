---
id: "guide-network"
language: "en"
title: "RM-01 Network Configuration Guide"
source_commit: "c9b0897aa87a7e22a0ab264f9007a131f43a1135"
prepared_on: "2026-10-30"
content_kind: "operating-instructions"
applicability: "version-independent (confirmed by owner)"
source_files: ["website/guides/content/network.md"]
source_urls: ["https://rminte.com/guides/network"]
default_retrieval: true
evidence_status: "source transcription; not independent operational verification"
---

# RM-01 Network Configuration Guide

## 1. Understand the Two Network Paths

RM-01 provides two USB-C-based network paths, referred to in this guide as the **C1 port** and the **C3 port**. Both carry network connections, but they connect different devices and create different network topologies:

| Port | Primary purpose | Network relationship after connection |
| --- | --- | --- |
| C1 | Connect a computer, tablet, phone, or other user device to RM-01 | The user device joins the RM-01 internal switch network as an internal network node |
| C3 | Connect RM-01 to the user's existing local network | LPMU routes traffic for the other internal nodes, allowing the complete system to join the upstream switch or router network |

## 2. Identify C1 and C3

### C1 port

C1 is on the rear side of the enclosure. Of the two vertically arranged USB-C ports, C1 is the upper port. A connection symbol engraved below the port helps identify it.

### C3 port

C3 is on top of the enclosure. Lift the magnetic top cover to expose this USB-C port. C3 is the shared top USB port and can be switched among ESP, AGX, and LPMU in TianshanOS.

## 3. Connect a User Device through C1

Use a USB-C cable that supports data transfer to connect an iPad, computer, phone, or other user device to C1. RM-01 automatically provides DHCP configuration, so the user does not need to enter an IP address, gateway, or DNS server manually.

The user device will normally detect a wired network interface named `AX88179` or USB Ethernet. The device then joins the RM-01 internal switch network and can communicate with devices on that network.

> C1 connects the user device directly to the RM-01 internal network. Connect only trusted devices, and do not attach unmanaged devices to C1 in public or untrusted environments.

## 4. Keep Internet Access and Share It with RM-01

### What may happen to the user device's internet connection

After C1 is connected, some operating systems may treat `AX88179` as the preferred network path. Because C1 provides access to the RM-01 internal network rather than direct internet access, the user device's existing internet connection may be interrupted.

If the user device must continue using Wi-Fi, Ethernet, or another connection for internet access, keep that internet connection at a higher priority than `AX88179`:

| System | System terminology | Configuration principle |
| --- | --- | --- |
| macOS | Network service order (Service Order) | Place the internet-providing Wi-Fi or Ethernet service above `AX88179` |
| Windows | Interface metric | Lower values have higher priority; use a lower metric for the internet interface than for `AX88179` |
| Linux | Route metric | Lower values have higher priority; use a lower metric for the internet default route than for `AX88179` |

### Use the RM-01 Network Connection Tool

To share the user device's internet connection with RM-01, obtain the **RM-01 Network Connection Tool** from the website's Downloads page. The tool configures DHCP, routing, and network-sharing rules between the user device and C1 so internet traffic can be forwarded into the RM-01 internal network.

Currently supported systems:

- macOS
- Linux
- Windows Pro

Windows Home is not currently supported.

> The network connection tool changes network addressing, routing, and sharing settings on the user device. Existing connections may be interrupted briefly. Save active downloads, remote sessions, and other network-dependent work before starting.

## 5. Configure C1 Internet Sharing with AI

An Agent Harness with local command-execution capability, such as Codex or Hermes, can inspect the network topology from natural-language instructions and help configure forwarding and internet sharing from the user computer to the RM-01 internal network. The AI must be able to execute system commands on the target computer. A chat-only AI can provide instructions but cannot apply the configuration.

### Where to run the AI agent

Run the agent directly on the user computer connected to C1 whenever possible. That computer owns the internet uplink, default route, and sharing rules, so the agent needs administrator access on that computer to perform the configuration.

If Codex, Hermes, or another agent runs inside RM-01, it must already have authorized remote command execution and administrator access to the user computer. Without that access, it cannot change network sharing, routing, or firewall settings on the user computer.

### Confirm before starting

- The user computer is connected to RM-01 through C1 and can see a network interface named `AX88179` or USB Ethernet.
- The C1 address on the user computer is `10.10.99.100/24`, while the RM-01 internal nodes remain at `10.10.99.99`, `10.10.99.98`, and `10.10.99.97`.
- The user computer already has working internet access through Wi-Fi, Ethernet, or another interface.
- The Agent Harness can execute commands on the user computer and request administrator privileges when required.
- Active downloads, remote sessions, and other network-dependent work have been saved, and the network can be recovered locally if needed.

### Prompt to send directly to the agent

The following prompt preserves the factory RM-01 topology, requires inspection before modification, and asks for validation and rollback instructions. Copy it into Codex, Hermes, or another command-capable Agent Harness:

```text
You are helping me configure C1 internet sharing for RM-01. First inspect the current operating system, network interfaces, addresses, default routes, and firewall state. Make changes only after confirming that the actual configuration matches the topology below. Do not infer interface roles from names alone, and do not change the fixed addresses of the RM-01 internal nodes.

Current topology:
- The user computer is connected by USB-C to the C1 port on RM-01. On the user computer, this connection normally appears as AX88179 or USB Ethernet and uses 10.10.99.100/24.
- The RM-01 internal network is 10.10.99.0/24.
- The application computer (LPMU) is 10.10.99.99.
- The inference computer (AGX) is 10.10.99.98.
- The out-of-band management computer is 10.10.99.97.
- The user computer also has internet access through a separate network interface.

My goal is to preserve the user computer's existing internet connection and share it through the AX88179 / USB Ethernet interface associated with C1, allowing 10.10.99.99, 10.10.99.98, and 10.10.99.97 to access the internet.

Follow these constraints:
1. Identify the operating system, the actual internet uplink, and the interface associated with C1, then explain what you plan to change.
2. Use the operating system's native, least-invasive sharing method to configure only the necessary IP forwarding, NAT, routing, or Internet Connection Sharing.
3. Do not change the priority or default route of the user computer's existing internet interface. Do not change the RM-01 node addresses above, and do not flush or overwrite unrelated firewall rules.
4. If administrator privileges are required, explain why before requesting them. If the current system or permissions cannot complete the configuration safely, stop and report the reason.
5. After applying the configuration, verify that the user computer still has internet access; 10.10.99.99, 10.10.99.98, and 10.10.99.97 are reachable; and the RM-01 internal nodes can reach a public IP address and resolve DNS names.
6. Finally, list the commands or settings actually changed, the validation results, and the rollback steps required to restore the original configuration.
```

macOS normally uses Internet Sharing and system routing facilities; Linux typically uses IP forwarding with nftables or iptables; and Windows Pro normally uses Internet Connection Sharing (ICS). Exact commands and interface names must follow the agent's inspection of the current computer. Windows Home is not currently supported.

### How to confirm that it worked

All of the following conditions should be true after configuration:

1. The user computer's original internet connection remains available.
2. The user computer can reach `10.10.99.99`, `10.10.99.98`, and `10.10.99.97`.
3. RM-01 internal nodes can reach both public IP addresses and internet hostnames through DNS.
4. The agent reports the exact changes made and provides executable rollback steps instead of only stating that the configuration succeeded.

### Security notice

> Granting an agent administrator or root access for network configuration allows it to change routes, IP forwarding, NAT, Internet Connection Sharing, and firewall rules. Use only a trusted Agent Harness and review its proposed actions before authorizing them. If the user computer carries a remote session or other critical network workload, make sure the configuration can be recovered locally first.

## 6. Connect RM-01 to an Upstream Network through C3

In this guide, “upstream network” means the user's existing local network, such as a network provided by a switch or router.

### Prepare the adapter

The user must provide:

- A USB-C-to-RJ45 Ethernet adapter
- An RJ45 Ethernet cable connected to the switch or router

Connect the USB-C end to C3, then connect the RJ45 cable to the user's switch or router. The physical connection alone does not complete DHCP or routing configuration. The built-in RM-01 network configuration program must be run afterward.

### Switch the top USB port to LPMU

1. Open the TianshanOS home page.
2. Find “USB Switch.”
3. Select the “USB” button and switch the current target of the top USB port to `LPMU`.
4. Confirm that the page shows `LPMU` as the current target before continuing.

Switching the top USB target may disconnect the current link briefly. Do not switch targets while data is being transferred through the port.

## 7. Bring the Complete System Online through LPMU

RM-01 ships with the network automation project preloaded on LPMU. After LPMU obtains upstream connectivity, it uses internal routing and NAT to forward traffic for AGX and the other internal nodes, bringing the complete system onto the user's upstream network.

### Project location and what the user needs to do

The project is stored in the **home directory of the current LPMU user** at `~/network-setup/`. LPMU-specific scripts are located in `~/network-setup/lpmu/`.

On a factory-configured device, do not download the project again or repeat the engineering deployment steps in the repository README, such as `scp`, `chmod`, or service installation. Regular users should start the configuration from TianshanOS. Enter the project directory only for troubleshooting or development.

> Do not move, rename, or delete `~/network-setup/`. The TianshanOS network configuration workflow depends on the factory project path and scripts.

### What the automation project configures

When started, the project performs the following work on LPMU:

1. Detects interfaces with gateways and runs connectivity tests to select a usable upstream path.
2. Replaces the LPMU default route so traffic uses the selected upstream interface.
3. Enables IPv4 forwarding and configures `iptables` NAT and FORWARD rules.
4. Allows the internal AGX, at the default address `10.10.99.98`, to reach the upstream network through LPMU at `10.10.99.99`.
5. Adds port-forwarding rules for services hosted on AGX.

The project also includes an optional smart-route monitoring service. When enabled, it checks the current upstream path every 30 seconds, attempts to fail over when connectivity is lost, and returns to the preferred interface when that interface recovers.

### Run the configuration from TianshanOS

1. Confirm that C3 is connected to the switch or router through the USB-C-to-RJ45 Ethernet adapter.
2. Confirm that the top USB target on the TianshanOS home page is set to `LPMU`.
3. Open “Network” from the top navigation in TianshanOS.
4. Find “Upstream Network Access.”
5. Select “Access via LPMU.”
6. Wait for the state to change from “Processing” to “Success” or “Failed.” Do not start the operation again while it is processing.

“Success” means that the script found a usable upstream path, configured the LPMU route, and ran the internal forwarding and NAT configuration. Verify AGX IP connectivity and DNS resolution afterward instead of treating the button state as the only proof of connectivity.

### Confirm that the connection works

First confirm that TianshanOS reports “Success.” If the user has AGX terminal access, run these checks on AGX:

```bash
ping -c 3 10.10.99.99  # Verify AGX-to-LPMU connectivity
ping -c 3 8.8.8.8       # Verify internet IP connectivity
ping -c 3 google.com    # Verify DNS resolution
```

These checks isolate the internal link, internet forwarding, and DNS. If the first test fails, inspect the internal link and addressing. If the first succeeds but the second fails, inspect the LPMU upstream connection, default route, and NAT. If only the third fails, inspect DNS configuration.

### Port forwarding and the security boundary

The current project configures these forwards on the LPMU upstream interface:

| LPMU entry | Forwarding target | Purpose |
| --- | --- | --- |
| TCP `58022` | AGX TCP `22` | Reach the AGX SSH service through LPMU |
| TCP/UDP `58000–58999` | The same ports on AGX | Reach application services running on AGX |

For SSH, the client connects to the LPMU upstream address, but the username and authentication credentials belong to AGX:

```bash
ssh -p 58022 <AGX_USERNAME>@<LPMU_IP>
```

> Port forwarding increases the reachability of AGX services from the upstream network. Enable it only on a trusted LAN and restrict source addresses with the switch, router, or upstream firewall. Do not expose these ports directly to the public internet.

### Risks and troubleshooting

> “Access via LPMU” deletes the previous LPMU default routes, flushes the existing `iptables` NAT table and FORWARD chain, sets the default FORWARD policy to DROP, and then writes the RM-01 routing, NAT, and port-forwarding rules. This can immediately interrupt remote sessions and overwrite custom network or firewall configuration. If LPMU has been customized, export the current routes and firewall rules first and make sure a local recovery path is available.

If the operation fails, check the following in order:

1. Confirm that the USB-C-to-RJ45 adapter and Ethernet cable connected to C3 are secure.
2. Confirm that the switch or router port is enabled.
3. Confirm that the TianshanOS home page shows `LPMU` as the current top USB target.
4. Confirm that the upstream network provides LPMU with a valid address, gateway, and DNS configuration.
5. Read the error and output shown in “Upstream Network Access.”
6. Confirm that AGX can still reach the LPMU internal address `10.10.99.99`.
7. Check for custom LPMU rules that conflict with the default route, NAT, FORWARD chain, or port forwarding.
