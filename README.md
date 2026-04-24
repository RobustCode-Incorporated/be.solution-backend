# be.solution-backend

**Backend API for Municipal Administrative Services Platform**

---

##  Project Information

- **Project Name**: be.solution-backend
- **Description**: A comprehensive Node.js/Express backend API for managing municipal administrative services
- **Author**: Jean-Luc Luzemba
- **Language**: JavaScript (Node.js)
- **Database**: PostgreSQL with Sequelize ORM (NEON)


---

##  Architecture

### Core Structure

be.solution-backend/ ├── server.js # Main application entry point ├── config.js # JWT configuration ├── config/config.js # Database configuration (dev/test/prod) ├── controllers/ # Business logic handlers ├── routes/ # API endpoint definitions ├── models/ # Database models (Sequelize) ├── middleware/ # Authentication & request processing ├── utils/ # Helper utilities (email, etc.) ├── public/uploads/ # User uploaded files ├── documents/ # Static documents └── migrations/ # Database schema versions

Code

---

##  Data Models

The system manages **9 core entities**:

| Entity | Description |
|--------|-------------|
| **Citoyen** | End users registering for services |
| **Administrateur** | Municipal administrators (Bourgmestre) |
| **AdministrateurGeneral** | Provincial-level administrators |
| **Agent** | Service agents processing requests |
| **Commune** | Municipal administrative divisions |
| **Province** | Provincial administrative divisions |
| **Demande** | Citizen service requests |
| **Statut** | Request status types |

---

##  Program Flow

### 1. Authentication Flow

User Credentials → authController.loginUser() ↓ Validate username/password (bcrypt) ↓ Generate JWT Token (24h expiry) ↓ Return token to client

Code

**Process**:
- User provides username and password
- System validates credentials against hashed passwords
- JWT token is generated with 24-hour expiration
- Token is returned to client for subsequent requests

---

### 2. Request Processing Flow

API Request → authMiddleware (JWT verification) ↓ Verify token & attach user context (req.user) ↓ Check role-based authorization ↓ Route to appropriate controller ↓ Process business logic ↓ Return JSON response

Code

**Process**:
- All requests pass through `authMiddleware`
- JWT token is extracted from Authorization header
- Token is verified and decoded
- User role is validated against route requirements
- Request is processed only if authorized
- Response is returned with appropriate HTTP status

---

### 3. Service Request Flow (Demandes)

Citizen creates request → demandeController.createDemande() ↓ Store in database ↓ Agent reviews (getDemandesToValidate) ↓ Agent generates document (generateDocument) ↓ Admin validates & signs (validateDocument) ↓ Citizen receives confirmation email

Code

**Document Types Supported**:
- `acte_naissance` - Birth Certificate
- `acte_mariage` - Marriage Certificate
- `acte_residence` - Residence Certificate
- `carte_identite` - National ID Card

**Process**:
1. Citizen submits request with required data
2. Request stored in database with "pending" status
3. Agent reviews and validates the request
4. Document is generated using Puppeteer + Chromium
5. QR code and verification token are embedded
6. Admin signs document digitally
7. Status updated to "completed"
8. Confirmation email sent to citizen

---

### 4. User Registration Flow

New Citizen → authController.registerCitoyen() ↓ Generate NUC (Numéro Unique Citoyen) ↓ Hash password with bcrypt ↓ Create Citoyen record in database ↓ Send NUC via Brevo email service ↓ Return JWT token

Code

**NUC Generation Format**: `AAMMJJ + 5 random digits` (11 digits total)
- Example: `2501151234567` (born 25/01/2015)

**Process**:
1. Validate all required fields
2. Generate unique NUC based on birth date
3. Hash password with bcrypt (salt rounds: 10)
4. Create citizen record in database
5. Send NUC to citizen's email via Brevo
6. Return JWT token for immediate login

---

##  API Endpoints

### Authentication (`/api/auth`)
POST /login - Login for all user types POST /register - Citizen registration

Code

### Citizens (`/api/citoyens`)
GET / - List all citizens POST / - Create new citizen PUT /:id - Update citizen DELETE /:id - Delete citizen

Code

### Service Requests (`/api/demandes`)
GET /me - Get my requests (citizen only) GET /validation - Get requests to validate (agent/admin) POST /upload - Upload document image PUT /:id/generate-document - Generate official document PUT /:id/validate-document - Sign & validate document GET / - List all requests GET /:id - Get request details POST / - Create new request PUT /:id - Update request DELETE /:id - Delete request

Code

### Administrators (`/api/administrateurs`)
GET / - List all administrators POST / - Create new administrator PUT /:id - Update administrator DELETE /:id - Delete administrator

Code

### General Administrators (`/api/administrateurs-generaux`)
GET / - List all general administrators POST / - Create new general administrator PUT /:id - Update general administrator DELETE /:id - Delete general administrator

Code

### Agents (`/api/agents`)
GET / - List all agents POST / - Create new agent PUT /:id - Update agent DELETE /:id - Delete agent

Code

### Communes (`/api/communes`)
GET / - List all communes POST / - Create new commune PUT /:id - Update commune DELETE /:id - Delete commune

Code

### Provinces (`/api/provinces`)
GET / - List all provinces POST / - Create new province PUT /:id - Update province DELETE /:id - Delete province

Code

### Status (`/api/statuts`)
GET / - List all statuses POST / - Create new status PUT /:id - Update status DELETE /:id - Delete status

Code

### Dashboard (`/api/dashboard`)
GET / - Get dashboard analytics and statistics

Code

---

##  Key Features

 **Role-Based Access Control** - 4 user roles with specific permissions  
 **JWT Authentication** - Secure token-based authentication (24h expiry)  
 **Document Management** - Upload, generate, and validate documents  
 **PDF Generation** - Puppeteer + Chromium for server-side PDF rendering  
 **QR Code Integration** - Document verification via QR codes  
 **Email Notifications** - Automated NUC delivery via Brevo API  
 **File Serving** - Static document and upload access  
 **Database Relationships** - Proper ORM model associations  
 **Environment Configuration** - Dev/Test/Production support  
 **Password Security** - Bcrypt password hashing  
 **CORS Support** - Cross-origin request handling  
 **File Uploads** - Multer-based image upload management  

---

##  Role-Based Permissions

| Role | Permissions |
|------|-------------|
| **Citoyen** | Create requests, upload images, view own requests, register |
| **Agent** | View requests, generate documents, validate images |
| **Administrateur** | Full request management, document signing, agent oversight |
| **AdministrateurGeneral** | System-wide oversight, all admin privileges |

---

##  Middleware Stack

- **authMiddleware** - Protects routes, verifies JWT, enforces role-based access
- **CORS** - Cross-origin request handling
- **express.json()** - JSON body parsing
- **multer** - File upload handling
- **dotenv** - Environment variable management

---

##  Dependencies

### Core
- **Express.js** - Web framework
- **Sequelize** - ORM for database management
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### File & Document Management
- **Multer** - File upload handling
- **Puppeteer** - PDF generation
- **@sparticuz/chromium** - Chrome/Chromium for Puppeteer
- **qrcode** - QR code generation

### Email Service
- **@getbrevo/brevo** - Transactional email API

### Utilities
- **uuid** - Unique identifier generation
- **cors** - Cross-origin request support
- **dotenv** - Environment configuration

---

##  Installation & Setup

### Prerequisites
- Node.js v14.17.0+ or v16.13.0+ or >=v18.0.0
- PostgreSQL v12+
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/RobustCode-Incorporated/be.solution-backend.git
   cd be.solution-backend
Install dependencies

bash
npm install
Configure environment variables

bash
cp .env.example .env
Update .env with your configuration

env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/dbname
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=ma_commune_be
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DIALECT=postgres

# JWT Configuration
JWT_SECRET=your_super_secret_key_here

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key

# Environment
NODE_ENV=development
PORT=4001
RENDER_EXTERNAL_URL=https://your-render-url.onrender.com
Start the development server

bash
npm start
Server will start on http://localhost:4001

🗄️ Database Configuration
Development
JavaScript
{
  username: process.env.DB_USER || "johnluc",
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || "ma_commune_be",
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 5432,
  dialect: "postgres"
}
Production (Neon/Render)
Uses DATABASE_URL environment variable with SSL connection:

JavaScript
{
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  }
}
 Environment Variables Required
env
# PostgreSQL Connection
DATABASE_URL              # Neon/Render PostgreSQL connection string
DB_USER                   # Local database username
DB_PASSWORD               # Local database password
DB_NAME                   # Database name (default: ma_commune_be)
DB_HOST                   # Database host (default: 127.0.0.1)
DB_PORT                   # Database port (default: 5432)
DB_DIALECT                # Database dialect (default: postgres)

# JWT Configuration
JWT_SECRET                # Secret key for JWT signing (REQUIRED)

# Email Service
BREVO_API_KEY            # Brevo API key for transactional emails

# Application Configuration
NODE_ENV                  # Environment: development, test, or production
PORT                      # Server port (default: 4001)
RENDER_EXTERNAL_URL      # External URL for Render deployment
 API Response Format
Success Response
JSON
{
  "message": "Operation successful",
  "data": {
    "id": 1,
    "nom": "Doe",
    "prenom": "John"
  }
}
Error Response
JSON
{
  "message": "Error description",
  "error": "Detailed error information"
}
 Security Features
Password Hashing - Bcrypt with 10 salt rounds
JWT Tokens - 24-hour expiration
Role-Based Access Control - Middleware-level authorization
SQL Injection Prevention - Sequelize parameterized queries
CORS Protection - Configurable cross-origin requests
SSL Support - Production database SSL connections
Environment Secrets - No hardcoded credentials
 Document Generation
The system generates official documents using:

Puppeteer for HTML-to-PDF conversion
Chromium headless browser execution
QR Codes for document verification
Digital Signatures with Bourgmestre name
DRC Flag Colors - Gradient footer (Blue, Yellow, Red)
Supported Document Templates
ACTE DE NAISSANCE (Birth Certificate)

Child name, sex, date, and place of birth
Parent information
Bourgmestre signature
QR code verification
ACTE DE MARIAGE (Marriage Certificate)

Spouse information
Marriage date and location
Bourgmestre signature
QR code verification
CERTIFICAT DE RÉSIDENCE (Residence Certificate)

Citizen address confirmation
Residence validation
Bourgmestre signature
QR code verification
CARTE D'IDENTITÉ (National ID Card)

Profile photo
Personal details
QR code
Compact card format (336x204px)
 Testing
To run tests:

bash
npm test
 Contributing
Contributions are welcome! Please follow these guidelines:

Create a feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request
 License
This project is licensed under the MIT License - see the LICENSE file for details.

 Author
Jean-Luc Luzemba
RobustCode-Incorporated
 GitHub: @RobustCode-Incorporated

 Support
For support, issues, or questions:

Open an issue on GitHub
Contact the development team
Check the project documentation
 Version History
v1.0.0 - Initial Release (April 24, 2026)
Core authentication system with JWT
Municipal request management (Demandes)
Document generation and validation
Role-based access control (4 roles)
Email notifications via Brevo
Dashboard analytics
PDF generation with Puppeteer
QR code verification
File upload management
