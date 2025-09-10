import asyncio
from collections import defaultdict
from typing import TYPE_CHECKING

from app import wildosnode
from .grpclib import WildosNodeGRPCLIB
from ..models.node import NodeConnectionBackend
from ..models.user import User
from ..utils.system_monitor import check_disk_space_before_operation
from ..utils.logging_config import node_connection_logger

if TYPE_CHECKING:
    from app.db import User as DBUser


@check_disk_space_before_operation()
def update_user(
    user: "DBUser", old_inbounds: set | None = None, remove: bool = False
):
    """updates a user on all related nodes"""
    if old_inbounds is None:
        old_inbounds = set()
    
    node_connection_logger.info(f"Updating user {user.username} on nodes")

    node_inbounds = defaultdict(list)
    if remove:
        for inb in user.inbounds:
            node_inbounds[inb.node_id]
    else:
        for inb in user.inbounds:
            node_inbounds[inb.node_id].append(inb.tag)

    for inb in old_inbounds:
        node_inbounds[inb[0]]

    for node_id, tags in node_inbounds.items():
        if wildosnode.nodes.get(node_id):
            asyncio.ensure_future(
                wildosnode.nodes[node_id].update_user(
                    user=User.model_validate(user), inbounds=tags
                )
            )


async def remove_user(user: "DBUser"):
    node_ids = set(inb.node_id for inb in user.inbounds)

    for node_id in node_ids:
        if wildosnode.nodes.get(node_id):
            asyncio.ensure_future(
                wildosnode.nodes[node_id].update_user(user=user, inbounds=[])
            )


async def remove_node(node_id: int):
    if node_id in wildosnode.nodes:
        await wildosnode.nodes[node_id].stop()
        del wildosnode.nodes[node_id]


async def add_node(db_node, certificate):
    """Add a node with improved error handling and logging"""
    try:
        node_connection_logger.info(f"Adding node {db_node.id} ({db_node.address}:{db_node.port})")
        
        await remove_node(db_node.id)
        
        # Проверить наличие сертификата для GRPCLIB
        if certificate and hasattr(certificate, 'key') and hasattr(certificate, 'certificate'):
            node = WildosNodeGRPCLIB(
                db_node.id,
                db_node.address,
                db_node.port,
                certificate.key,
                certificate.certificate,
                usage_coefficient=db_node.usage_coefficient,
            )
        else:
            # Ошибка: сертификат обязателен для grpclib
            raise ValueError(f"Certificate is required for node {db_node.id} with grpclib connection")
        
        wildosnode.nodes[db_node.id] = node
        node_connection_logger.info(f"Successfully added node {db_node.id}")
        
    except Exception as e:
        node_connection_logger.error(f"Failed to add node {db_node.id}: {str(e)}")
        raise


__all__ = ["update_user", "add_node", "remove_node"]
