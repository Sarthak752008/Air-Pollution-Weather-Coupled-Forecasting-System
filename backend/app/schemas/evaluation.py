"""Pydantic schemas for Phase 3 Model Evaluation, Benchmark Comparisons, and Model Management."""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class MetricValues(BaseModel):
    mae: float
    rmse: float
    r2: float
    mape: float


class HorizonMetric(BaseModel):
    horizon_hours: int
    mae: float
    rmse: float
    r2: float
    mape: float


class PeakEventMetric(BaseModel):
    threshold_pm25: float
    true_events: int
    detected_events: int
    precision: float
    recall: float
    f1_score: float


class ModelEvaluationSummary(BaseModel):
    model_id: str
    model_name: str
    architecture: str
    version: str
    parameters: str
    metrics_overall: MetricValues
    metrics_by_target: Dict[str, MetricValues]
    horizon_metrics: List[HorizonMetric]
    peak_event_detection: PeakEventMetric


class DatasetSplitInfo(BaseModel):
    total_hours: int
    start_time: str
    end_time: str
    train_ratio: float
    val_ratio: float
    test_ratio: float
    split_type: str
    lookahead_bias: str


class EvaluationBenchmarkResponse(BaseModel):
    experiment_id: str
    experiment_name: str
    created_at: str
    selected_model_id: str
    dataset_split: DatasetSplitInfo
    horizons_evaluated: List[int]
    targets_evaluated: List[str]
    models: List[ModelEvaluationSummary]


class SelectModelRequest(BaseModel):
    model_id: str


class SelectModelResponse(BaseModel):
    success: bool
    selected_model_id: str
    model_name: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)
