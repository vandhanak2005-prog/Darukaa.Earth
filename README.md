# Darukaa.Earth



Darukaa.Earth is a full-stack geospatial environmental intelligence platform for managing and analyzing carbon and biodiversity projects.



The platform allows users to create environmental projects, add multiple geographical sites by drawing polygons on an interactive map, and view carbon and biodiversity analytics for each site.



\## Features



\- Project creation and management

\- Multiple geographical sites per project

\- Interactive Mapbox map

\- Polygon drawing for geographical sites

\- Site-level carbon and biodiversity scores

\- Analytics and performance visualization

\- JWT-based authentication

\- PostgreSQL database

\- PostGIS spatial data support

\- REST API using FastAPI

\- React-based frontend

\- Ruff code quality checks

\- Pre-commit hooks



\## Technology Stack



\### Frontend



\- React

\- Vite

\- Mapbox GL JS

\- Mapbox Draw

\- Chart.js



\### Backend



\- Python

\- FastAPI

\- Uvicorn

\- SQLAlchemy

\- GeoAlchemy2

\- Pydantic

\- JWT authentication



\### Database



\- PostgreSQL

\- PostGIS



\### Code Quality



\- Ruff

\- Pre-commit

\- GitHub Actions



\## Project Structure



```text

Darukaa.Earth/

│

├── backend/

│   ├── auth.py

│   ├── database.py

│   ├── main.py

│   ├── models.py

│   └── schemas.py

│

├── frontend/

│   ├── public/

│   ├── src/

│   │   ├── Analytics.jsx

│   │   ├── App.jsx

│   │   ├── App.css

│   │   ├── index.css

│   │   ├── main.jsx

│   │   └── Map.jsx

│   ├── package.json

│   ├── package-lock.json

│   └── vite.config.js

│

├── .env.example

├── .gitignore

├── .pre-commit-config.yaml

├── pyproject.toml

└── requirements.txt





┌──────────────────────────────┐

│        React Frontend        │

│                              │

│  Dashboard • Map • Analytics │

└──────────────┬───────────────┘

\&#x20;              │ REST API

\&#x20;              ▼

┌──────────────────────────────┐

│       FastAPI Backend        │

│                              │

│ Authentication • Projects    │

│ Sites • Spatial Analytics    │

└──────────────┬───────────────┘

\&#x20;              │ SQLAlchemy

\&#x20;              ▼

┌──────────────────────────────┐

│       PostgreSQL + PostGIS   │

│                              │

│ Users • Projects • Sites     │

│ Polygon Geometries           │

└──────────────────────────────┘



Database Schema

Users



Stores application users.



Fields:



id

name

email

password

Projects



Stores environmental projects.



Fields:



id

name

description

carbon\\\_score

biodiversity\\\_score

created\\\_at

owner\\\_id

Sites



Stores geographical sites belonging to projects.



Fields:



id

name

area\\\_hectares

carbon\\\_score

biodiversity\\\_score

geometry

project\\\_id



The geometry field uses PostGIS POLYGON geometry with SRID 4326.



Spatial Data



Sites are created by drawing polygons on the Mapbox map.



The backend stores the polygon geometry using PostGIS.



Site area is calculated from the stored geometry and converted to hectares.



Mapbox Polygon

\&#x20;     ↓

GeoJSON Geometry

\&#x20;     ↓

FastAPI API

\&#x20;     ↓

PostGIS POLYGON

\&#x20;     ↓

Spatial Area Calculation

\&#x20;     ↓

Site Analytics

Authentication



The backend uses JWT-based authentication.



Users can:



Register an account

Log in

Receive a JWT access token

Use the token to access protected API endpoints



Passwords are stored using bcrypt hashing.



Environment Variables



Create a local .env file using .env.example as a reference.



DB\\\_PASSWORD=your\\\_postgresql\\\_password

SECRET\\\_KEY=your\\\_secret\\\_key

VITE\\\_MAPBOX\\\_TOKEN=your\\\_mapbox\\\_token



Do not commit real passwords, tokens, or secrets to GitHub.



Backend Setup



Open PowerShell in the project directory.



Create and activate the virtual environment:



cd backend

python -m venv venv

.\\\\venv\\\\Scripts\\\\Activate.ps1



Install dependencies:



pip install -r ..\\\\requirements.txt



Make sure PostgreSQL is running and the darukaa database exists with PostGIS enabled.



Start the backend:



uvicorn main:app --reload



The API will be available at:



http://127.0.0.1:8000



FastAPI interactive documentation:



http://127.0.0.1:8000/docs

Frontend Setup



Open another PowerShell terminal:



cd frontend

npm install

npm run dev



The Vite development server will provide the frontend URL in the terminal.



The frontend requires the Mapbox token through:



VITE\\\_MAPBOX\\\_TOKEN

Running the Application



Start the backend:



cd backend

.\\\\venv\\\\Scripts\\\\Activate.ps1

uvicorn main:app --reload



In another terminal, start the frontend:



cd frontend

npm run dev



Then open the frontend URL shown by Vite.



Code Quality



The project uses Ruff for Python linting and formatting.



Run:



ruff check .



Format Python code:



ruff format .



Pre-commit hooks are configured to automatically run code quality checks.



Run all hooks manually:



pre-commit run --all-files



Install the hooks:



pre-commit install

API Overview



Main API functionality includes:



User registration

User login

Project creation

Project listing

Site creation

Site listing

Site analytics

Spatial polygon processing



Interactive API documentation is available through FastAPI Swagger UI:



http://127.0.0.1:8000/docs

Carbon and Biodiversity Analytics



Each geographical site contains carbon and biodiversity scores.



The dashboard displays these values through analytical visualizations to help users understand environmental performance over time.



The current prototype uses an illustrative scoring model for demonstration purposes. It is not intended to represent scientifically validated carbon accounting or biodiversity assessment.



CI/CD



The project is designed to use GitHub Actions for automated code quality checks and continuous integration.



The intended workflow includes:



Code Push

\&#x20;  ↓

GitHub Repository

\&#x20;  ↓

GitHub Actions

\&#x20;  ↓

Install Dependencies

\&#x20;  ↓

Run Ruff Checks

\&#x20;  ↓

Run Tests

\&#x20;  ↓

Build / Deployment

Security



The repository does not intentionally contain:



Database passwords

Mapbox access tokens

JWT secrets

Python virtual environments

Python cache files



Environment-specific secrets should be stored outside the repository.



Future Improvements



Potential future improvements include:



Scientific carbon accounting integrations

Real biodiversity datasets

Satellite imagery analysis

Time-series environmental data

Role-based access control

Advanced spatial filtering

Automated environmental reports

Production deployment

Automated backend testing

Project



Darukaa.Earth is a full-stack geospatial environmental intelligence platform combining modern web development, spatial databases, and environmental analytics.


