"""Common schemas: pagination, error envelopes, simple key/value types."""

from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str = Field(..., description="Machine-readable error code, e.g. 'VALIDATION_ERROR'")
    message: str = Field(..., description="Human-readable message")
    field: str | None = Field(default=None, description="Offending field, if applicable")


class ErrorResponse(BaseModel):
    error: ErrorDetail


class Pagination(BaseModel):
    page: int = Field(default=1, ge=1, description="1-indexed page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page (1-100)")
    total: int = Field(default=0, ge=0, description="Total matching items")


class Page(BaseModel, Generic[T]):
    items: list[T]
    pagination: Pagination
