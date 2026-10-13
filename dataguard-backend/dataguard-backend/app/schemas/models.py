from pydantic import BaseModel, Field
from typing import Optional, Any

class AnalyzeRequest(BaseModel):
    target_column: Optional[str] = None
    id_columns: list[str] = Field(default_factory=list)
    run_ml: bool = True

class SimulationRequest(BaseModel):
    actions: list[str] = Field(default_factory=list)

class ApplyRequest(BaseModel):
    actions: list[str] = Field(default_factory=list)
    approved_by: str = "user"

class DecisionRequest(BaseModel):
    reason: str = ""
