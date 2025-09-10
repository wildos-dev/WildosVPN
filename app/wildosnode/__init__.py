"""stores nodes and provides entities to communicate with the nodes"""

from typing import Dict

from . import operations
from .base import WildosNodeBase
from .grpclib import WildosNodeGRPCLIB

nodes: Dict[int, WildosNodeBase] = {}


__all__ = [
    "nodes",
    "operations",
    "WildosNodeGRPCLIB",
    "WildosNodeBase",
]
