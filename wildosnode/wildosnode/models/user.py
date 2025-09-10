from typing import TYPE_CHECKING

from pydantic import BaseModel

if TYPE_CHECKING:
    from wildosnode.models import Inbound


class User(BaseModel):
    id: int
    username: str
    key: str
    inbounds: list["Inbound"] = []
