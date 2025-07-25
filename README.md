# Aamira Courier Package Tracker

This project is a full-stack solution for the Aamira Courier Package Tracker coding challenge. It features a real-time dashboard for dispatchers to monitor active packages, ingest updates from couriers, and receive alerts for stuck packages.

**Live Demo:** https://aamira-frontend.vercel.app/
**Backend Repository:** https://github.com/RownokNishat/aamira-courier-backend 
**Frontend Repository:** https://github.com/RownokNishat/aamira-frontend

---

## Features Implemented

### Core Requirements

- **F1: Courier Update Ingestion:** A secure `POST /api/updates` endpoint accepts package status events from couriers.
- **F2: Persistent State & History:** All package events are stored durably in MongoDB. The system maintains both the complete event history and the latest valid state for each package.
- **F3: Real-Time Dispatcher Dashboard:** A responsive web UI that updates in real-time (≤5s) via WebSockets as new events arrive.
    - Lists all active packages.
    - Clicking a package opens a detailed modal with its full chronological timeline.
    - Displays ETA and location data.
- **F4: Stuck-Package Alerting:** A background job runs automatically to detect active packages that haven't been updated in over 30 minutes.
    - Alerts are displayed as a notification icon with a badge in the UI.
    - Clicking the icon reveals a collapsible panel with detailed alert messages.
- **F5: Basic Security:** All API endpoints are protected and require a secret API token to be passed in the `Authorization` header.

### Bonus Features & "Nice-to-Haves"

- **Dockerized Environment:** The entire backend stack (Node.js server + MongoDB) can be run with a single `docker-compose up` command.
- **Advanced Frontend UI:**
    - **Search & Filter:** The dashboard includes client-side controls to search by Package ID and filter by package status.
    - **Reverse Geocoding:** Automatically converts latitude/longitude coordinates into human-readable place names using a free public API.
    - **Geolocation API:** A "Get Current Location" button on the package creation form uses the browser's Geolocation API to auto-fill coordinates.
- **Layered Architecture:** The backend code is organized into a clean, modular structure (controllers, services, models) for maintainability and scalability.
- **Comprehensive Error Handling:** The backend includes a global error handler, and the frontend displays user-friendly error messages for failed API calls or connection issues.

---

## Technology Stack

| Area      | Technology                               |
| :-------- | :--------------------------------------- |
| **Backend** | Node.js, Express.js, TypeScript        |
| **Frontend** | React.js (with Hooks)                  |
| **Database** | MongoDB                                |
| **Real-time** | WebSockets (Socket.IO)                 |
| **Styling** | Inline CSS (Styled JSX)                |
| **Deployment**| Docker (for local dev), Render, MongoDB Atlas |

---

## Local Development Setup

### Prerequisites

- Node.js (v18 or later)
- npm
- Docker & Docker Compose (Recommended for backend)
- A code editor (e.g., VS Code)

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/RownokNishat/aamira-courier-backend
    cd aamira-server
    ```
2.  **Create an environment file:**
    Create a `.env` file in the root of the backend directory and add the following content:
    ```env
    # Server Configuration
    PORT=3001
    NODE_ENV=development

    # Use this URI for Docker
    MONGO_URI=mongodb://mongodb:27017/aamira_tracker
    # Use this URI if running MongoDB locally without Docker
    # MONGO_URI=mongodb://127.0.0.1:27017/aamira_tracker

    # Security
    API_SECRET_KEY=your-super-secret-api-key

    # Frontend URL for CORS
    CLIENT_URL=http://localhost:3000
    ```
3.  **Run with Docker (Recommended):**
    ```bash
    docker-compose up --build
    ```
    The backend server will be running at `http://localhost:3001`.

### Frontend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/RownokNishat/aamira-frontend
    cd aamira-client
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create an environment file:**
    Create a `.env` file in the root of the frontend directory and add the following:
    ```env
    REACT_APP_API_URL=http://localhost:3001
    REACT_APP_API_SECRET_KEY=your-super-secret-api-key
    ```
    **Important:** The `API_SECRET_KEY` must match the one in your backend's `.env` file.
4.  **Start the development server:**
    ```bash
    npm start
    ```
    The application will open in your browser at `http://localhost:3000`.

---

## Architecture & Design Choices

The application is built with a standard client-server architecture. The backend follows a layered (or n-tier) pattern to separate concerns, making the codebase modular and easy to maintain.

- **Controllers:** Handle HTTP request/response cycles.
- **Services:** Contain the core business logic.
- **Models:** Define the database schemas and interact with MongoDB.
- **Jobs:** A `node-cron` job runs in the background for periodic tasks (detecting stuck packages).
- **Real-time Layer:** Socket.IO is integrated into the Express server to push updates to clients, avoiding the need for inefficient HTTP polling.

## Assumptions & Trade-offs

- **ETA Calculation:** The system accepts a manually provided ETA. A production system would likely involve a more complex calculation based on historical data, traffic, and routing, which was deemed out of scope for this challenge.
- **Authentication vs. Authorization:** The system uses a simple, shared API secret key for server-to-server authorization, which is sufficient for an internal tool. A full user authentication/authorization system (e.g., JWT with user roles) was not implemented as per the requirements.
- **Geocoding API:** The frontend uses the free Nominatim (OpenStreetMap) API for reverse geocoding. This API has a strict usage policy (1 request/second) and is suitable for a demo but would be replaced with a paid, high-volume service in a production environment.

## Idempotency and Out-of-Order Events

The system is designed to be resilient to network issues that can cause duplicate or out-of-order events.

### 1. Handling Out-of-Order Events

**Strategy Chosen:** Append to history but don’t roll back the current state.

**Implementation Details:**
The system maintains two separate data collections:
- **`package_events`:** This collection serves as an immutable, chronological log. Every single event received by the API is appended to this collection, ensuring a complete and auditable history is always preserved.
- **`packages`:** This collection stores only the *current state* of each package. An update to this collection is only performed if the incoming event's `event_timestamp` is **strictly newer** than the timestamp of the currently stored state for that package.

This ensures the dispatcher's view is always accurate and never moves backward in time due to a delayed event.

### 2. Idempotency

**Strategy Chosen:** Optimistic upsert using timestamp de-duplication.

**Implementation Details:**
When an event is received, the system checks if its timestamp is newer than the currently stored state. If the same event is sent again, its timestamp is not newer, and the system skips the database write operation for the current state. This makes the `POST /api/updates` endpoint fully idempotent.

---

## Future Improvements ("What I'd Do Next")

- **Message Queue:** For massive scale, I would introduce a message queue (like RabbitMQ or AWS SQS) to ingest courier updates. This would decouple the API from the processing logic, improving reliability and handling traffic spikes more effectively.
- **Delayed Queue for Alerts:** To make the stuck-package detection more efficient at scale, I would replace the cron job with a delayed message queue. This would eliminate the need to scan the database periodically.
- **Integration & Unit Tests:** Implement a robust testing suite with Jest and Supertest to ensure code quality and prevent regressions.
- **CI/CD Pipeline:** Set up a CI/CD pipeline using GitHub Actions to automate testing and deployment.
