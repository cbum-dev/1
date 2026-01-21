"""Audio service has been removed.

This module is kept as a placeholder so existing imports do not break if
referenced elsewhere. All audio-related functionality has been disabled.
"""


class AudioService:  # pragma: no cover - legacy placeholder
    """Legacy placeholder for the removed audio pipeline."""

    def __init__(self, *_, **__):  # type: ignore[no-untyped-def]
        raise RuntimeError("Audio support is currently disabled.")