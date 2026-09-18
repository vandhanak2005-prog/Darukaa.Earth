from typing import Optional

from pydantic import BaseModel, EmailStr, Field

# --------------------------------------------------
# USER
# --------------------------------------------------


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)

    email: EmailStr

    password: str = Field(min_length=6, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr

    password: str = Field(min_length=6, max_length=100)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


# --------------------------------------------------
# PROJECT
# --------------------------------------------------


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)

    description: Optional[str] = Field(default=None, max_length=500)

    carbon_score: float = Field(default=0, ge=0, le=100)

    biodiversity_score: float = Field(default=0, ge=0, le=100)


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    carbon_score: float
    biodiversity_score: float

    class Config:
        from_attributes = True


# --------------------------------------------------
# SITE
# --------------------------------------------------


class SiteCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)

    area_hectares: float = Field(default=0, ge=0)

    carbon_score: float = Field(default=0, ge=0, le=100)

    biodiversity_score: float = Field(default=0, ge=0, le=100)

    geometry: dict


class SiteResponse(BaseModel):
    id: int
    name: str
    area_hectares: float
    carbon_score: float
    biodiversity_score: float
    geometry: Optional[dict] = None

    class Config:
        from_attributes = True
