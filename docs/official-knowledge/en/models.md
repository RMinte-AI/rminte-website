---
id: "models"
language: "en"
title: "RMQ3x & RMQ4 Models | Specialized Reasoning & Inference | RMinte"
source_commit: "c9b0897aa87a7e22a0ab264f9007a131f43a1135"
prepared_on: "2026-10-30"
content_kind: "official-site-text"
applicability: "Model performance statements retain original qualification and hardware applicability. Industry scenarios are not evidence of customer deployments."
source_files: ["website/models/index.html", "website/models/models.js"]
source_urls: ["https://rminte.com/models/"]
default_retrieval: true
evidence_status: "published source text; qualification retained"
---

RMQ MODELS

# Deeper analysis. More efficient inference.

RMQ3x and RMQ4 are RMinte ’s specialist models for law, investigations, security and governance, and scientific and social research. They combine domain knowledge, deep reasoning, and tool use so agents can understand problems, form judgments, and act on them to produce documents, code, and research findings.

[Explore models](https://rminte.com/models/#models)
[Benchmarks](https://rminte.com/models/#benchmarks)

RMQ3x Dense

RMQ4 MoE

## RMQ3x

Dense

Illustrative

Expert reasoning. Driving action.

A specialist model for law, investigations, security and governance, and scientific and social research. It combines planning, code generation, tool use, and verification so agents can turn professional judgment into action and produce documents, code, and research findings.

- ### Understand domain problems

  Connect facts, evidence, and domain knowledge to examine cause and effect, test hypotheses, and develop sound judgments and plans.
- ### Execute tasks

  Develop search strategies, generate data queries and validation code, and use specialist tools to execute tasks and verify results.
- ### Carry tasks forward

  Use prior findings and execution feedback to revise plans, verify results, and complete investigations, research, and business tasks.

![](https://rminte.com/models/huggingface.svg)![Hugging Face](https://rminte.com/models/huggingface-text.svg)

## RMQ4

MoE

Illustrative

Explore complex problems. Manage long-horizon tasks.

Built for complex work in law, investigations, security and governance, and scientific and social research. It connects planning, code execution, tool use, and iterative research across disciplines and stages, retaining goals, constraints, and findings through repeated verification. Agents can carry investigations and research projects from the initial question to the final deliverable.

- ### Build a complete argument

  Connect knowledge and evidence across disciplines, explain underlying mechanisms, and test competing hypotheses to reach sound professional judgments.
- ### Coordinate complex tasks

  Coordinate investigation planning, information retrieval, code execution, and result verification. Use findings at each stage to guide the next action.
- ### Refine the research

  Incorporate new evidence, computational results, and experimental feedback to revise hypotheses, refine plans, and produce testable research findings.

![](https://rminte.com/models/huggingface.svg)![Hugging Face](https://rminte.com/models/huggingface-text.svg)

## Model benchmarks

Benchmark results coming soon

## Power specialist agents. Complete complex tasks.

Build specialist agents with RMQ . Connect domain knowledge, business systems, and specialist tools to turn professional goals into sustained action.

Justice & legal services  Research cases and prepare for trial Contract revisions Trial outlines  Explore workflow  Criminal investigation & digital forensics  Trace key leads and reconstruct event links Event timelines Forensic verification tasks  Explore workflow  Cyber defense  Detect threats and drive incident response Detection queries Remediation plans  Explore workflow  Platform content governance  Apply policies and handle complex disputes Review assignments Appeal assessments  Explore workflow  Corporate investigations & anti-fraud  Uncover transaction links and investigate anomalies Unusual connections Investigation reports  Explore workflow  Forensic medicine, toxicology & accident investigation  Explain mechanisms and plan tests Mechanistic hypotheses Follow-up testing plans  Explore workflow  Materials & industrial chemistry research  Explore materials and processes. Advance R&D. Experimental matrices Simulation scripts  Explore workflow  Life sciences & biomedical research  Develop hypotheses and test them through experiments Experimental designs Research scripts  Explore workflow  Sociology, criminology & ethics  Design studies and examine institutional effects Study designs Theory-testing reports  Explore workflow

INFERENCE ENGINES

## Dedicated engines. Unlock model performance.

RMQ3x and RMQ4 run on RMinte ’s C++ inference engine and a custom vLLM implementation. We tailor kernels, execution paths, and runtimes to the model architectures and RM-01 hardware to turn model capability into efficient inference.

NVIDIA CUDA

RMinte C++ Runtime

RMQ3x · RMQ4 FlashInfer · Fused MoE

**2 *MB***  Runner resident memory Excludes weights, KV cache and context

Our C++ engine
Custom vLLM

### Our C++ inference engine

#### Lower runtime overhead. More efficient execution.

The runner in RMinte ’s C++ engine uses about 2 MB of memory, excluding model weights, KV cache, context, and other model allocations. With identical model, precision, and quantization settings, it outperforms our optimized vLLM implementation in both input processing (prefill) and token-by-token generation (decode).

#### Match the hardware. Move less data.

We design CUDA kernels for RM-01 ’s GPU, unified memory, and caches, merge projections and adjacent operations, and select computation paths by matrix size. Weight loading, quantized storage, and runtime layouts reduce memory allocations and movement of intermediate results, leaving more resources for model computation.

#### Continuous prefill. Decode on demand.

The engine accepts incremental input and schedules input processing separately from response generation. Prefix caching and recurrent-state management reuse prior computation, while memory and SSD tiers hold context. Models process new messages, documents, and task feedback, then decode when output is needed.

Agents can keep receiving context without responding to every input. Whether listening throughout a meeting or analyzing new case material, models process information as it arrives and contribute to decisions and actions when needed.

### vLLM, customized from the kernel up

#### Inference optimization, from kernels to toolchains.

RMinte has ported and rewritten GPU kernels to match model execution and hardware requirements, and resolved compatibility issues with PTX and the compiler toolchain. We adapt and integrate the FlashInfer inference kernel library and the Transformers 5 model library.

We resolved Triton compatibility issues in the Fused MoE tuning workflow so kernel parameters can be tuned for each model configuration and hardware platform. We also optimize execution paths, including speculative decoding, to improve inference efficiency.

#### Built for RMQ . Open to more models.

Our custom vLLM supports RMQ3x and RMQ4 , as well as other compatible open-source models on RM-01 . Choose models to suit each task and build specialist applications and agent workflows on the same device.

## From architecture to training. Built for professional work. From hardware to inference. Unlock model performance.

RMQ3x and RMQ4 combine recurrent memory, attention-based retrieval, and targeted training for professional analysis and tool use. Our inference engine tailors computation paths, data access, and task scheduling to the model architectures and hardware, supporting long documents, multi-turn interaction, and agents that keep working.

### Gated DeltaNet recurrent memory

RMQ3x · RMQ4

Carry history in recurrent state to reduce cache use, with chunked computation to accelerate input processing.

**TECHNICAL DETAILS**

Gated DeltaNet combines a forget gate with the delta update rule. The gate controls how much of the previous state is retained; the delta rule uses new information to correct the state’s prediction error. Each GDN layer stores history in a fixed-size state rather than growing a full key-value cache with every token.

Both models pair three GDN layers with one attention layer. GDN supports chunk-parallel prefill and recurrent updates during decode; attention retrieves details from the context. Recurrent memory and attention-based retrieval work together to process long documents and multi-turn tasks.

The engine uses WY chunked computation for prefill, reusing state and inputs within each chunk to reduce repeated access during token-by-token updates. Recurrent state is stored in BF16, with updates and accumulation performed in FP32, reducing state traffic and memory use across concurrent requests.

### Global attention & dense computation

RMQ3x

Global attention retrieves details across the context; a regular feed-forward path supports sustained execution and operator fusion.

**TECHNICAL DETAILS**

RMQ3x retains Gated Attention layers between GDN layers. These attend across the causal context, with an output gate controlling the contribution of retrieved information. Every token passes through the full dense feed-forward network, without expert routing or token reordering.

The engine merges Q, K, and V projections into one matrix operation and fuses QK normalization with RoPE positional encoding. During single-token decoding, input RMSNorm and projection computation share on-chip data. SwiGLU, output projections, and residual addition are fused where the execution path allows, reducing intermediate tensor writes, reads, and kernel launches.

### QSA block-sparse attention

RMQ4

Find relevant context blocks, then attend to their original tokens to focus computation on selected content.

**TECHNICAL DETAILS**

QSA (Qwen Sparse Attention) uses a lightweight indexer to compress past keys into micro-block representations and score their relevance. Selected blocks are mapped back to their original token positions for the main attention computation, along with the current incomplete tail block. Block indexing shortens the candidate sequence; token-level attention preserves access to the original content.

QSA handles context retrieval alongside GDN in RMQ4 . Optimization covers block indexing, top-k selection, sparse key-value access, and attention computation to control indexing and memory-access costs while focusing retrieval on relevant context.

### Sparse experts & Fused MoE

RMQ4

Each token activates selected routed experts and a shared expert, allowing model capacity to scale separately from per-token computation.

**TECHNICAL DETAILS**

RMQ4 selects experts based on each token’s representation. The selected experts and a shared expert perform feed-forward computation, and a weighted sum combines their outputs. Sparse activation supports a larger expert pool while limiting per-token computation. The full set of weights still needs storage and an access mechanism.

Fused MoE groups and reorders tokens by expert, combining inputs assigned to the same expert to reuse its weights. The engine selects GEMV or GEMM according to expert workload and fuses gated activation and weighted reduction. This reduces fragmented small operations and movement of intermediate results while preserving routing and expert-computation semantics.

Quantized expert weights load into preallocated packed buffers, avoiding separate allocations and a second round of copies for each tensor. Gate and up projections share a layout, so loading and inference use the same data organization to reduce startup preparation and memory overhead.

### Gated Residual

RMQ4

Use multiple residual branches and dynamic read-write gates to control what each layer receives and retains.

**TECHNICAL DETAILS**

Gated Residual widens the residual stream into multiple branches. Each read normalizes the branches, applies input-dependent gates to their channels, and aggregates them into the current block’s input. Each write assigns a scalar weight to each branch to control how much of the block output it receives.

Branch- and channel-level selection improves information flow through deep networks. Read gating shares a computation path with normalization. Removing the additional residual-mixing matrix reduces repeated reads of the widened residual stream.

### N-gram conditional memory

RMQ4

Look up local token combinations in an embedding table to expand representational capacity with little extra computation.

**TECHNICAL DETAILS**

N-gram embeddings combine the current token with nearby preceding tokens to form short sequences and deterministic lookup indices. Retrieved vectors are projected and gated into the model representation, adding features from local token combinations to individual-token information. The embedding table is learned during training and read by index during inference.

Most of the added cost comes from lookup and projection, without running a full expert network for each access. Deterministic indices let embedding prefetch overlap with computation in earlier layers. Optimization focuses on lookup bandwidth, data layout, and memory scheduling to control the cost of accessing a large embedding table.

### Hardware-specific computation paths

RMQ3x · RMQ4

Organize kernels and data by workload size to put GPU compute, memory bandwidth, and caches to work on inference.

**TECHNICAL DETAILS**

Single-token decoding, small-batch verification, and large input batches use different computation paths. The engine selects specialized GEMV, cuBLAS, or CUTLASS GEMM by matrix size, combining thread layouts, vectorized memory access, and cache reuse to match RM-01 ’s GPU and memory architecture. Small batches reuse inputs through the L2 cache, reducing the impact of shared-memory use on parallelism.

NVFP4 (W4A16) stores weights in a 4-bit format for computation with 16-bit activations. Specialized kernels use lookup-table decoding, vectorized loads, and merged projections to reduce weight-access costs. Loading selects memory-mapping and prefetch strategies according to available memory and shard size, bringing precision, capacity, and access costs into the inference design.

### Multi-token prediction & verification

RMQ3x · RMQ4

Verify multiple candidate tokens in one pass to reduce repeated computation and synchronization during generation.

**TECHNICAL DETAILS**

MTP generates candidate tokens on the GPU, feeding each draft step from the previous result to reduce CPU–GPU synchronization. The main model verifies the drafts in a batch, accepts the matching prefix, and emits a corrected or additional token. Small-batch verification uses multi-row GEMV to share weight reads and reduce verification overhead.

For stateful architectures such as GDN, the engine checkpoints recurrent and convolution states during verification. When only part of a draft is accepted, it restores the state at that position before continuing. Single requests use speculative decoding; multiple requests switch to batched decoding, matching prediction, verification, and weight reuse to the workload.

### Context & concurrency scheduling

RMQ3x · RMQ4

Reuse prior computation and batch concurrent requests so memory and bandwidth can serve more tasks.

**TECHNICAL DETAILS**

Paged KV cache and recurrent-state management retain each request’s progress, while prefix caching reuses repeated input. Long contexts use chunked prefill and memory–SSD storage tiers to manage historical state. Streaming attention reads key-value blocks from SSD in batches and merges partial attention results to extend context capacity.

Short inputs of equal length can share one batched prefill pass. Output projections are also combined across requests, reducing repeated weight reads and time to first token. Continuous batching shares compute resources during generation while each request retains its own context and state, bringing document processing, multi-turn interaction, and concurrent tasks into one inference service.

### Domain adaptation & agent training

RMQ3x · RMQ4

Train analysis, tool use, and result verification with domain material, task trajectories, and execution feedback.

**TECHNICAL DETAILS**

Supervised fine-tuning (SFT) uses task trajectories built from domain material, covering problem analysis, evidence synthesis, tool calls, and delivery. Training supervises assistant responses and actions across multi-turn dialogue, structured outputs, and recovery from execution failures to teach the full task process. Low-rank adaptation (LoRA) and full-parameter fine-tuning offer different approaches to updating weights.

Direct Preference Optimization (DPO) uses preferences between responses to the same problem, with evidence quality, reasoning consistency, and instruction following as training criteria. For coding, computation, and tool tasks with verifiable outcomes, GRPO-style reinforcement learning uses result feedback to refine the policy. Held-out evaluations track changes in domain and general capabilities.

### Adjusting value & safety alignment

RMQ3x · RMQ4

Reshape preferences and edit refusal-related representations to remove preset alignment constraints on professional tasks and limit disruption to existing capabilities.

**TECHNICAL DETAILS**

RMQ3x and RMQ4 use post-training to adjust their base models’ value and safety alignment. SFT uses task demonstrations to teach direct answers, evidence analysis, and instruction following. DPO uses preferences between paired responses to adjust predefined stances, evasive language, and overgeneralized refusals. Training objectives center on the evidence and the user’s task so models can discuss contested topics, compare viewpoints, and conduct professional analysis.

Abliteration extracts refusal-related directions from intermediate activations of contrasting examples and edits weights that write into the residual stream. We select single-direction projection, SVD-based multidirectional subspaces, and LEACE linear concept erasure to suit each layer and representation structure. Layer-wise strength search, projection refinement, norm preservation, and weight blending control the intervention. Successive edits target remaining refusal behavior.

Edit targets follow each architecture: attention and dense feed-forward outputs in RMQ3x ; fused expert tensors, shared experts, and multiple residual branches in RMQ4 . Embedding projections are treated separately from gating paths. Response behavior, KL divergence, and task evaluations guide edit strength. Evaluations of Chinese-language performance, reasoning, coding, tool use, and long-horizon tasks check capability retention.

## All application scenario source text

## name

Justice & legal services

## task

Research cases and prepare for trial

## outputs

Contract revisions

Trial outlines

## stages

Case files, contracts, legal databases, and relevant precedents.

Find legal authorities, map evidence to legal elements, draft documents, and cross-check citations.

Legal opinions with supporting authorities, contract revisions, and trial outlines.

## name

Criminal investigation & digital forensics

## task

Trace key leads and reconstruct event links

## outputs

Event timelines

Forensic verification tasks

## stages

Communication records, device data, and investigation records.

Cross-reference entities and events, test competing explanations, and generate forensic queries and follow-up verification tasks.

Traceable event timelines, related leads, and verification plans.

## name

Cyber defense

## task

Detect threats and drive incident response

## outputs

Detection queries

Remediation plans

## stages

Security logs, threat intelligence, and detection tools.

Triage alerts, trace attack paths, and write detection queries and response scripts.

Investigation records, remediation plans, and response validation results.

## name

Platform content governance

## task

Apply policies and handle complex disputes

## outputs

Review assignments

Appeal assessments

## stages

User content, platform policies, reports, and appeals.

Examine context and links between behaviors, classify risks by severity, and use prior cases to support review decisions.

Review assignments, review recommendations, and a list of policy gaps.

## name

Corporate investigations & anti-fraud

## task

Uncover transaction links and investigate anomalies

## outputs

Unusual connections

Investigation reports

## stages

Contracts, transaction records, internal communications, and company registration records.

Cross-check unusual transactions and entity relationships, and prepare investigation plans and interview outlines.

Investigation reports with evidence indexes and items requiring verification.

## name

Forensic medicine, toxicology & accident investigation

## task

Explain mechanisms and plan tests

## outputs

Mechanistic hypotheses

Follow-up testing plans

## stages

Examination results, scene records, and specialist literature.

Develop competing explanations, examine causal chains, and identify evidence that distinguishes possible mechanisms.

Mechanistic hypotheses, questions that distinguish competing explanations, and follow-up testing plans.

## name

Materials & industrial chemistry research

## task

Explore materials and processes. Advance R&D.

## outputs

Experimental matrices

Simulation scripts

## stages

Research literature, materials databases, and experimental and simulation tools.

Propose formulations and hypotheses about mechanisms, write simulation scripts, design experimental matrices, and revise plans based on the results.

Candidate approaches, experimental matrices, and reproducible data-processing scripts.

## name

Life sciences & biomedical research

## task

Develop hypotheses and test them through experiments

## outputs

Experimental designs

Research scripts

## stages

Literature, biological databases, and experimental data.

Develop mechanistic hypotheses, set research priorities, design experiments and data-processing workflows, and refine them based on feedback.

Experimental designs, reproducible scripts, and research plans.

## name

Sociology, criminology & ethics

## task

Design studies and examine institutional effects

## outputs

Study designs

Theory-testing reports

## stages

Interviews, cases, statistical data, and theoretical literature.

Develop sampling plans, code qualitative data, build statistical models, test explanations, and examine the effects of institutions.

Study designs, model results, and arguments supported by evidence.

## Original diagram descriptions and labels

- Conceptual view of dense and MoE architectures

- RMinte C++ inference diagram
