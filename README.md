# Smart Residential Operations Platform

### About it
**Smart Residential Operations Platform** is a full-stack, role-based housing management portal designed to streamline communication, maintenance request routing, fee payments, and interactive oper[...]

---

### Technologies
*   **Frontend Client**: React.js, TypeScript, Vite, Tailwind CSS, Radix UI (via shadcn/ui), TanStack React Query, Axios, React Router DOM, Recharts (for analytics and graphs), Socket.io-client.
*   **Backend Server**: Node.js, Express.js, TypeScript, MongoDB & Mongoose (ODM), Socket.io, JSON Web Token (JWT), BcryptJS.

---

### Features
*   **Dual-Role Access Control**: Secure login pages with dashboards that render differently depending on whether the user is an **Admin** or a **Resident**.
*   **Real-time Maintenance Ticketing**: Residents submit requests specifying category, urgency, and description. Admins assign technicians (with contact info) and update progress, pushing live st[...]
*   **Interactive Community Bulletin**:
    *   **Notices**: Building-wide text broadcasts from management.
    *   **Events**: Details and timings of community functions.
    *   **Polls**: Interactive voting forms allowing residents to submit votes and see real-time graphical result updates.
*   **Rent & Fee Payments Ledger**: Displays bills, tracks transaction status (Pending/Paid), and logs payment records (date, payment method, reference IDs).
*   **Analytics Control Center**: Admin dashboards display charts of service ticket frequencies and pending payment distributions.

---

### Keyboard Shortcuts
*   **Toggle Sidebar Navigation**: `Ctrl + B` (on Windows/Linux) or `Cmd + B` (on macOS) instantly collapses or expands the navigation sidebar.

---

### The Process
1.  **Mongoose Data Architecture**: Created separate schemas for `User`, `MaintenanceRequest`, `Payment`, `Notice`, `Event`, and `Poll`.
2.  **RESTful API Setup**: Designed controllers and protected endpoint routes. Integrated JWT checking middleware to ensure that administrative tasks (such as assigning technicians, deleting notic[...]
3.  **Real-Time Subscriptions**: Mounted Socket.io endpoints. On connection, the client subscribes to designated room channels (`user:userId` or `role:admin`). Triggering a status change on the ba[...]
4.  **Client-Side Query Optimization**: Leveraged TanStack Query for asynchronous HTTP states, utilizing automatic page cache invalidation on socket event triggers.

---

### What I Learned
*   **Dynamic WebSocket Coordination**: Creating authenticated client rooms based on JWT claims and syncing state seamlessly over ws channels.
*   **Client-Server Synchronization**: Using TanStack React Query's cache invalidation system (`queryClient.invalidateQueries`) to re-sync data immediately when the server pushes a websocket notif[...]
*   **Role-Based Security Guards**: Restricting private routes on the frontend via React Router components and enforcing access verification at the API layer.
*   **Flexible CORS Policies**: Creating dynamic CORS handlers to allow concurrent local endpoints on both hostnames (`localhost` and `127.0.0.1`) and variable port ranges in local environments.

---

### Overall Growth
*   **Full-Stack Development Integration**: Transitioned from creating basic frontend apps to architecting complete data-driven, real-time client-server systems.
*   **Robust Security Principles**: Learned to implement industry-standard hashing protocols (Bcrypt) and session handling (JWT).
*   **Real-time Thinking**: Mastered building user interfaces that react instantly to back-end event streams without requiring full page refetches.

---

### How It Can Be Improved
*   **Automated Payment Gateways**: Integrate a Stripe or PayPal sandbox gateway to process real-time mock transactions instead of manual logging.
*   **PDF Invoicing**: Add server-side receipt generators to let residents download official PDF transaction records.
*   **Push & SMS Alerts**: Incorporate Twilio or SendGrid APIs to notify residents of urgent maintenance completions or emergency building closures.
*   **Multi-Property SaaS**: Scale the schema design to support multiple apartment complexes under a single database deployment.

---

### Running the Project
#### 1. Installation
Install all dependencies in the root and server folders:
```bash
npm install
cd server
npm install
cd ..
```

#### 2. Local Service
Ensure MongoDB is running locally on port `27017`.

#### 3. Run Frontend & Backend
Run the concurrent script from the root folder to spin up both the Vite client and the Express backend:
```bash
npm run dev
```
*   **Client**: `http://localhost:8080`
*   **Backend Server**: `http://localhost:5000`

#### 4. Seed Logins
Log in with the default accounts (automatically generated on the first run):
*   **Admin Access**: Email: `admin@apt.com` / Password: `admin123`
*   **Resident Access**: Email: `resident@apt.com` / Password: `resident123`

#### 5. Demo Video

<div align="center">
  <h3>🎬 Watch Demo Video</h3>
  <a href="https://drive.google.com/file/d/1RVz8xbyl5wuQ7xJK277psLJrFTFMtiiH/view?usp=sharing" target="_blank">
    <img alt="Watch Demo Video" src="https://img.shields.io/badge/Watch%20Demo-Google%20Drive-red?style=for-the-badge&logo=googledrive" />
  </a>
  <p><em>Full platform walkthrough showing admin and resident features</em></p>
</div>

---
