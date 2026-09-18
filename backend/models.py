from database import Base
from geoalchemy2 import Geometry
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)

    projects = relationship("Project", back_populates="owner")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(String(500))
    carbon_score = Column(Float, default=0)
    biodiversity_score = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="projects")
    sites = relationship("Site", back_populates="project", cascade="all, delete-orphan")


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    area_hectares = Column(Float, default=0)
    carbon_score = Column(Float, default=0)
    biodiversity_score = Column(Float, default=0)

    # Stores the geographical polygon using PostGIS
    geometry = Column(Geometry("POLYGON", srid=4326))

    project_id = Column(Integer, ForeignKey("projects.id"))

    project = relationship("Project", back_populates="sites")
