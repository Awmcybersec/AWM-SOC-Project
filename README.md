<div align="center">

🛡️ AWM AI SOC SENIOR

Enterprise Autonomous AI Cybersecurity Operations Center

Intelligent Security Monitoring · Threat Detection · Incident Response


\

Designed and developed under the AWM Cybersecurity initiative.

"View Repository" (https://github.com/Awmcybersec/WM-SOC-Project) · "Report an Issue" (https://github.com/Awmcybersec/WM-SOC-Project/issues)

</div>

---

🚀 About AWM AI SOC SENIOR

AWM AI SOC SENIOR is an AI-powered Security Operations Center platform designed to bring security monitoring, threat detection, security intelligence, and incident response capabilities together in one environment.

The project combines a modern React dashboard with a Node.js backend and PostgreSQL database architecture. It is designed to support security analysts and cybersecurity teams in monitoring security events, investigating threats, and managing security operations.

✨ Core Capabilities

Security Module| Purpose
🧠 AI Security Intelligence| AI-assisted security analysis and insights
📡 SIEM| Security event monitoring and correlation
🖥️ EDR| Endpoint detection and response capabilities
🌐 NDR| Network detection and response capabilities
🔍 Threat Intelligence| Threat intelligence collection and analysis
🛡️ Vulnerability Management| Vulnerability monitoring and assessment
⚡ Autonomous Response| Automated response workflows
📊 Security Dashboard| Centralized security operations interface

Capabilities and integrations depend on the configured modules and environment.

🏗️ System Architecture

                 AWM AI SOC SENIOR
                         |
             React Security Dashboard
                         |
                  Node.js / Express
                         |
        +----------------+----------------+
        |                |                |
       SIEM             EDR              NDR
        |                |                |
        +----------------+----------------+
                         |
             AI & Threat Intelligence
                         |
                PostgreSQL Database
                         |
             Security Operations Data

🧰 Technology Stack

Frontend

- React 19
- TypeScript
- Vite
- Modern dashboard interface

Backend

- Node.js
- Express
- TypeScript
- Modular security engines

Database

- PostgreSQL
- PostgreSQL connection pooling

AI Integration

- Gemini API integration

Additional Platform Components

- Electron desktop application
- Windows service and installer automation
- Docker and Kubernetes deployment resources

📸 Dashboard Preview

«Dashboard screenshots will be added here as the interface is finalized.»

<!-- Add screenshots in a future update:
![AWM SOC Dashboard](docs/images/dashboard.png)
-->

⚙️ Installation & Setup

Requirements

- Node.js 20+
- npm
- PostgreSQL
- Gemini API key (for AI features)

1. Clone the repository

git clone https://github.com/Awmcybersec/WM-SOC-Project.git
cd WM-SOC-Project

2. Install dependencies

npm install

3. Configure environment variables

Create a local ".env" file using the project's environment template.

cp .env.example .env

Configure the required PostgreSQL connection variables:

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=awm_ai_soc
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

Configure your Gemini API key if AI features are enabled:

GEMINI_API_KEY=your_gemini_api_key

Use the variable names required by the relevant modules in the project. Never commit real credentials or secret keys.

4. Start the development server

npm run dev

5. Build for production

npm run build

6. Start the production server

npm start

Important: The application initializes PostgreSQL during startup. A working database connection and valid configuration are required for the full application to start.

🧪 Demo Configuration

Some security engines support demo data through:

ENABLE_DEMO_DATA=true

Demo mode enables supported demo-data paths. It does not automatically remove the application's PostgreSQL startup requirement.

🔐 Security

Security is a fundamental part of the AWM SOC project.

- Keep API keys and database credentials private.
- Never upload ".env" files containing real secrets.
- Use secure database credentials.
- Restrict access to administrative functions.
- Deploy behind HTTPS in production.
- Test security configurations before production deployment.

If you discover a security vulnerability, please report it privately to the project maintainer rather than publishing exploit details.

🌍 Deployment Notes

AWM AI SOC SENIOR contains both frontend and backend components.

GitHub Pages is not a full application hosting solution for this project. It can host static frontend files, but it cannot run the Node.js/Express backend or PostgreSQL database.

A complete deployment requires:

- Frontend hosting
- Node.js backend hosting
- PostgreSQL database hosting
- Secure environment variable configuration

Deployment configuration should be completed and tested before production release.

🗺️ Development Roadmap

- [x] Initial source code repository
- [x] React/Vite frontend build
- [x] Node.js backend
- [x] PostgreSQL integration
- [x] Modular security engine structure
- [x] Complete dashboard preview and screenshots
- [x] End-to-end testing
- [x] Production deployment
- [x] Expanded AI security workflows
- [x] Documentation and deployment guides

👨‍💻 Project

AWM AI SOC SENIOR

An AWM Cybersecurity initiative focused on building an integrated AI-powered Security Operations Center platform.

GitHub: "Awmcybersec" (https://github.com/Awmcybersec)

Repository: "WM-SOC-Project" (https://github.com/Awmcybersec/WM-SOC-Project)

---

<div align="center">

🛡️ AWM AI SOC SENIOR

Intelligence. Visibility. Security.

Building intelligent cybersecurity operations.

</div>
