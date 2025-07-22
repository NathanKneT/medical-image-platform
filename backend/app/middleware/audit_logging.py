import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """
    ASGI Middleware for logging user actions and other request details.

    This middleware intercepts every incoming request and outgoing response
    to create a comprehensive audit trail, which is crucial for security
    and compliance in medical applications.
    """
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """
        The core logic of the middleware.

        Args:
            request: The incoming HTTP request.
            call_next: A function that passes the request to the next
                       middleware or the actual endpoint.

        Returns:
            The HTTP response.
        """
        start_time = time.time()

        # --- Process the request and get the response ---
        response = await call_next(request)

        # --- After the response is generated, we can log everything ---
        process_time = (time.time() - start_time) * 1000  # in milliseconds

        # Placeholder for user identification.
        user_id = request.headers.get("X-User-ID", "anonymous")

        log_entry = (
            f"Audit Log: "
            f'User="{user_id}" | '
            f'Method="{request.method}" | '
            f'Path="{request.url.path}" | '
            f'StatusCode={response.status_code} | '
            f'ProcessingTime={process_time:.2f}ms'
        )

        logger.info(log_entry)

        return response