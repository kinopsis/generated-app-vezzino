# AgoraEdge
A secure, scalable, and unified platform for modern assemblies and weighted online voting, powered by Cloudflare's edge network.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kinopsis/generated-app-vezzino)
AgoraEdge is a sophisticated, multi-tenant SaaS platform for conducting secure, auditable, and engaging virtual, physical, or hybrid assemblies. Built entirely on Cloudflare's edge network, it offers unparalleled performance, scalability, and cost-efficiency. The platform provides a unified experience by integrating advanced weighted voting, proxy delegation, real-time quorum tracking, and high-quality video conferencing into a single, intuitive interface. Organizations can manage users with specific voting coefficients, create complex polls, and run assemblies seamlessly, with all data securely isolated per tenant in their own D1 database. The serverless architecture ensures that the system scales automatically from small board meetings to large-scale assemblies with thousands of participants, all with ultra-low latency globally.
## ✨ Key Features
- **Multi-Tenant SaaS Architecture**: Securely isolates each organization's data.
- **Super Admin Tenant Management**: A dedicated interface for platform administrators to manage all tenant organizations.
- **Advanced Weighted Voting**: Assigns voting coefficients to users for accurate, weighted decision-making.
- **Proxy Delegation**: Allows users to delegate their voting power to another participant for a specific assembly.
- **Real-Time Quorum Tracking**: Monitors participant presence and voting power in real-time to ensure assembly validity.
- **Integrated Video Conferencing**: Leverages Cloudflare Calls for a seamless, low-latency video experience within the same interface.
- **Comprehensive User Management**: Includes bulk user import, role assignments, and coefficient management.
- **Secure & Auditable**: Provides a complete audit trail for all actions, ensuring transparency and integrity.
- **Globally Scalable**: Built on Cloudflare's serverless edge network, ensuring high performance and availability worldwide.
## 🛠️ Technology Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Backend**: Cloudflare Workers, Hono
- **Real-time & State**: Cloudflare Durable Objects
- **Database**: Cloudflare D1
- **Video**: Cloudflare Calls
- **Deployment**: Cloudflare Pages
### 📝 Implementation Notes
**Video Conferencing (Cloudflare Calls)**: The current implementation of the video panel is a high-fidelity UI simulation designed to demonstrate the user experience of an integrated video conference. It dynamically displays participants and includes client-side controls for mute/unmute and camera on/off. A fully functional WebRTC integration with Cloudflare Calls requires a dedicated client-side SDK and API credentials, which are beyond the scope of this project's current environment.
## 🚀 Getting Started
Follow these instructions to get the project up and running on your local machine for development and testing purposes.
### Prerequisites
- [Bun](https://bun.sh/) installed on your machine.
- A [Cloudflare account](https://dash.cloudflare.com/sign-up).
### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/agora_edge.git
    cd agora_edge
    ```
2.  **Install dependencies:**
    This project uses Bun for package management.
    ```bash
    bun install
    ```
3.  **Authenticate with Wrangler:**
    Log in to your Cloudflare account to be able to interact with Workers, D1, and other services.
    ```bash
    bunx wrangler login
    ```
## 💻 Development
To start the local development server, which includes the Vite frontend and a local instance of the Cloudflare Worker, run the following command:
```bash
bun run dev
```
This will start the application, typically on `http://localhost:3000`. The frontend will hot-reload on changes, and the worker will be available for API requests.
## ☁️ Deployment
This project is configured for seamless deployment to the Cloudflare ecosystem.
1.  **Build the project:**
    This command bundles the React application and prepares the Worker script for deployment.
    ```bash
    bun run build
    ```
2.  **Deploy to Cloudflare:**
    This command deploys the static assets to Cloudflare Pages and the API to Cloudflare Workers. It will also run any necessary D1 database migrations.
    ```bash
    bun run deploy
    ```
Alternatively, you can deploy this project with a single click.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kinopsis/generated-app-vezzino)