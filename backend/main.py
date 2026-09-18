import json
import math

import models
import schemas
from auth import (
    create_access_token,
    hash_password,
    verify_password,
    verify_token,
)
from database import engine, get_db
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from geoalchemy2 import Geometry
from sqlalchemy import cast, func
from sqlalchemy.orm import Session

# --------------------------------------------------
# DATABASE
# --------------------------------------------------

models.Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# FASTAPI APP
# --------------------------------------------------

app = FastAPI(
    title="Darukaa.Earth API",
    description="Environmental Intelligence Platform",
    version="1.0.0",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://darukaa-earth-ten.vercel.app",
        "https://darukaa-earth-git-master-vandhanak2005-prog.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# JWT AUTHENTICATION
# --------------------------------------------------

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    user_id = verify_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


# --------------------------------------------------
# SCORE CALCULATIONS
# --------------------------------------------------


def calculate_carbon_score(area_hectares: float):
    """
    Prototype/demo calculation.

    This is an illustrative score based on area.
    It is NOT a scientific carbon measurement.
    """

    score = 40 + math.log10(area_hectares + 1) * 30

    return round(min(score, 100), 2)


def calculate_biodiversity_score(area_hectares: float):
    """
    Prototype/demo calculation.

    This is an illustrative score based on area.
    It is NOT a scientific biodiversity measurement.
    """

    score = 45 + math.log10(area_hectares + 1) * 28

    return round(min(score, 100), 2)


def calculate_project_scores(project):
    """
    Calculate project scores as the average
    of its site scores.
    """

    if not project.sites:
        return 0, 0

    carbon_scores = [site.carbon_score for site in project.sites]

    biodiversity_scores = [site.biodiversity_score for site in project.sites]

    carbon_average = sum(carbon_scores) / len(carbon_scores)

    biodiversity_average = sum(biodiversity_scores) / len(biodiversity_scores)

    return (
        round(carbon_average, 2),
        round(biodiversity_average, 2),
    )


# --------------------------------------------------
# ROOT
# --------------------------------------------------


@app.get("/")
def root():
    return {"message": "Darukaa.Earth API is running"}


# --------------------------------------------------
# DATABASE TEST
# --------------------------------------------------


@app.get("/database-test")
def database_test(db: Session = Depends(get_db)):
    try:
        db.query(models.User).count()

        return {
            "database": "connected",
            "message": "PostgreSQL database is working",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --------------------------------------------------
# REGISTER
# --------------------------------------------------


@app.post("/register", response_model=schemas.UserResponse)
def register(
    user: schemas.UserRegister,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(models.User).filter(models.User.email == user.email).first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# --------------------------------------------------
# LOGIN
# --------------------------------------------------


@app.post("/login")
def login(
    user: schemas.UserLogin,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(models.User).filter(models.User.email == user.email).first()
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(user.password, existing_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token({"user_id": existing_user.id})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email,
        },
    }


# --------------------------------------------------
# CREATE PROJECT
# --------------------------------------------------


@app.post("/projects", response_model=schemas.ProjectResponse)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
):
    new_project = models.Project(
        name=project.name,
        description=project.description,
        carbon_score=project.carbon_score,
        biodiversity_score=project.biodiversity_score,
        owner_id=1,
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


# --------------------------------------------------
# GET USER'S PROJECTS
# --------------------------------------------------


@app.get(
    "/projects",
    response_model=list[schemas.ProjectResponse],
)
def get_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    projects = (
        db.query(models.Project)
        .filter(models.Project.owner_id == current_user.id)
        .all()
    )

    for project in projects:
        carbon_score, biodiversity_score = calculate_project_scores(project)

        project.carbon_score = carbon_score
        project.biodiversity_score = biodiversity_score

    db.commit()

    return projects


# --------------------------------------------------
# GET SINGLE PROJECT
# --------------------------------------------------


@app.get(
    "/projects/{project_id}",
    response_model=schemas.ProjectResponse,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id,
            models.Project.owner_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    carbon_score, biodiversity_score = calculate_project_scores(project)

    project.carbon_score = carbon_score
    project.biodiversity_score = biodiversity_score

    db.commit()

    return project


# --------------------------------------------------
# CREATE SITE
# --------------------------------------------------


@app.post("/projects/{project_id}/sites", response_model=schemas.SiteResponse)
def create_site(
    project_id: int,
    site: schemas.SiteCreate,
    db: Session = Depends(get_db),
):
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id,
            models.Project.owner_id == 1,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    # --------------------------------------------------
    # GEOJSON VALIDATION
    # --------------------------------------------------

    geometry_data = site.geometry

    if not geometry_data:
        raise HTTPException(
            status_code=400,
            detail="Geometry is required",
        )

    if geometry_data.get("type") != "Polygon":
        raise HTTPException(
            status_code=400,
            detail="Only Polygon geometry is supported",
        )

    coordinates = geometry_data.get("coordinates")

    if not coordinates or not coordinates[0]:
        raise HTTPException(
            status_code=400,
            detail="Invalid polygon coordinates",
        )

    # --------------------------------------------------
    # CREATE POLYGON
    # --------------------------------------------------

    polygon_geojson = json.dumps(geometry_data)

    polygon = func.ST_GeomFromGeoJSON(polygon_geojson)

    # --------------------------------------------------
    # CALCULATE AREA
    #
    # EPSG:6933 = equal-area projection
    # Result converted from square metres to hectares
    # --------------------------------------------------

    area_result = db.query(
        func.ST_Area(
            func.ST_Transform(
                cast(
                    polygon,
                    Geometry("POLYGON", srid=4326),
                ),
                6933,
            )
        )
        / 10000
    ).scalar()

    area_hectares = float(area_result or 0)

    # --------------------------------------------------
    # AUTOMATIC SCORES
    # --------------------------------------------------

    carbon_score = calculate_carbon_score(area_hectares)

    biodiversity_score = calculate_biodiversity_score(area_hectares)

    # --------------------------------------------------
    # CREATE SITE
    # --------------------------------------------------

    new_site = models.Site(
        name=site.name,
        area_hectares=round(area_hectares, 2),
        carbon_score=carbon_score,
        biodiversity_score=biodiversity_score,
        geometry=polygon_geojson,
        project_id=project.id,
    )

    db.add(new_site)
    db.commit()
    db.refresh(new_site)

    # --------------------------------------------------
    # UPDATE PROJECT SCORES
    # --------------------------------------------------

    carbon_average, biodiversity_average = calculate_project_scores(project)

    project.carbon_score = carbon_average
    project.biodiversity_score = biodiversity_average

    db.commit()

    return {
        "id": new_site.id,
        "name": new_site.name,
        "area_hectares": new_site.area_hectares,
        "carbon_score": new_site.carbon_score,
        "biodiversity_score": new_site.biodiversity_score,
        "geometry": geometry_data,
    }


# --------------------------------------------------
# GET PROJECT SITES
# --------------------------------------------------


@app.get(
    "/projects/{project_id}/sites",
    response_model=list[schemas.SiteResponse],
)
def get_project_sites(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id,
            models.Project.owner_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    results = (
        db.query(
            models.Site,
            func.ST_AsGeoJSON(models.Site.geometry).label("geometry"),
        )
        .filter(models.Site.project_id == project_id)
        .all()
    )

    sites = []

    for site, geometry in results:
        geometry_data = None

        if geometry:
            geometry_data = json.loads(geometry)

        sites.append(
            {
                "id": site.id,
                "name": site.name,
                "area_hectares": site.area_hectares,
                "carbon_score": site.carbon_score,
                "biodiversity_score": site.biodiversity_score,
                "geometry": geometry_data,
            }
        )

    return sites


# --------------------------------------------------
# GET SINGLE SITE
# --------------------------------------------------


@app.get(
    "/sites/{site_id}",
    response_model=schemas.SiteResponse,
)
def get_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    result = (
        db.query(
            models.Site,
            func.ST_AsGeoJSON(models.Site.geometry).label("geometry"),
        )
        .join(
            models.Project,
            models.Site.project_id == models.Project.id,
        )
        .filter(
            models.Site.id == site_id,
            models.Project.owner_id == current_user.id,
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Site not found",
        )

    site, geometry = result

    geometry_data = None

    if geometry:
        geometry_data = json.loads(geometry)

    return {
        "id": site.id,
        "name": site.name,
        "area_hectares": site.area_hectares,
        "carbon_score": site.carbon_score,
        "biodiversity_score": site.biodiversity_score,
        "geometry": geometry_data,
    }
