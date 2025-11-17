# Real-time Data Aggregation Service

A high-performance backend service that aggregates real-time meme coin data from **DexScreener** and **GeckoTerminal**. It provides a unified, normalized API and pushes live updates to connected clients via WebSockets.

This project was built to demonstrate scalable architecture patterns including **Fan-In Aggregation**, **Real-time Broadcasting**, and **In-Memory Caching**.

---

## 🔗 Project Links

| Resource | URL |
| :--- | :--- |
| **Live Demo** | [INSERT YOUR RENDER/RAILWAY URL HERE] |
| **Video Walkthrough** | [INSERT YOUR YOUTUBE LINK HERE] |
| **Design Documentation** | [View Design Decisions & Architecture](./Documentation.md) |

---

## Key Features

* **Multi-Source Aggregation:** Fetches and merges token data from multiple decentralized exchange (DEX) APIs to ensure data reliability.
* **Real-time WebSockets:** Implements a background poller that pushes fresh data to all connected clients every 20 seconds (WebSocket "Fan-out" pattern).
* **Smart Caching:** Uses an abstraction layer for caching (mock Redis) to strictly adhere to API rate limits (300 req/min) while serving thousands of clients.
* **Advanced Filtering:** REST API supports cursor-based pagination, sorting by volume/price, and filtering.
* **Robust Testing:** Includes a suite of 10 unit/integration tests covering happy paths and edge cases using Jest.

---

## Tech Stack

* **Runtime:** Node.js (v16+)
* **Language:** TypeScript
* **Web Framework:** Express.js
* **Real-time Engine:** Socket.io
* **HTTP Client:** Axios
* **Testing:** Jest & ts-jest

---

## Getting Started

Follow these steps to run the project locally.

### 1. Prerequisites
Ensure you have **Node.js** and **npm** installed on your machine.

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/NysaPahari/Real-time-aggregator.git
cd real-time-aggregator
npm install