"""
Structured logging configuration for Lambda functions.
"""
import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional
from .env import config


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON."""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields from record
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
                          'filename', 'module', 'lineno', 'funcName', 'created',
                          'msecs', 'relativeCreated', 'thread', 'threadName',
                          'processName', 'process', 'getMessage', 'exc_info',
                          'exc_text', 'stack_info']:
                log_entry[key] = value
        
        return json.dumps(log_entry, default=str)


def setup_logging(level: str = 'INFO') -> logging.Logger:
    """
    Set up structured logging for Lambda functions.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        
    Returns:
        Configured logger instance
    """
    # Remove existing handlers
    root_logger = logging.getLogger()
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create new handler with structured formatter
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredFormatter())
    
    # Configure root logger
    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, level.upper()))
    
    # Suppress noisy AWS SDK logs
    logging.getLogger('boto3').setLevel(logging.WARNING)
    logging.getLogger('botocore').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    
    return root_logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the given name.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


def log_lambda_event(logger: logging.Logger, event: Dict[str, Any], context: Any) -> None:
    """
    Log Lambda event details for debugging.
    
    Args:
        logger: Logger instance
        event: Lambda event
        context: Lambda context
    """
    logger.info(
        "Lambda invocation started",
        extra={
            'request_id': context.aws_request_id,
            'function_name': context.function_name,
            'function_version': context.function_version,
            'remaining_time_ms': context.get_remaining_time_in_millis(),
            'http_method': event.get('requestContext', {}).get('http', {}).get('method'),
            'path': event.get('requestContext', {}).get('http', {}).get('path'),
            'stage': config.stage,
            'project': config.project_name
        }
    )


def log_lambda_response(logger: logging.Logger, response: Dict[str, Any], 
                       context: Any, duration_ms: float) -> None:
    """
    Log Lambda response details.
    
    Args:
        logger: Logger instance
        response: Lambda response
        context: Lambda context
        duration_ms: Execution duration in milliseconds
    """
    logger.info(
        "Lambda invocation completed",
        extra={
            'request_id': context.aws_request_id,
            'status_code': response.get('statusCode'),
            'duration_ms': duration_ms,
            'remaining_time_ms': context.get_remaining_time_in_millis()
        }
    )


# Initialize logging on module import
setup_logging()