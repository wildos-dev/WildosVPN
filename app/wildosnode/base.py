from abc import ABC


class WildosNodeBase(ABC):
    async def stop(self):
        """stops all operations"""

    async def update_user(
        self, user, inbounds: set[str] | None = None
    ) -> None:
        """updates a user on the node"""

    async def fetch_users_stats(self):
        """get user stats from the node"""

    async def get_logs(self, name: str, include_buffer: bool):
        """Return async generator for log lines"""
        if False:  # Make this a generator
            yield

    async def restart_backend(
        self, name: str, config: str, config_format: int
    ):
        pass

    async def get_backend_config(self, name: str) -> tuple[str, str]:
        pass

    async def get_backend_stats(self, name: str):
        pass
