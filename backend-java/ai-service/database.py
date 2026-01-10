# Database Mole - Read-only access for AI
import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

import config

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages read-only database connections for AI service."""

    def __init__(self):
        self.config = config.DATABASE_CONFIG

    @contextmanager
    def get_connection(self, readonly: bool = True):
        """Context manager for database connections."""
        conn = None
        try:
            conn = psycopg2.connect(
                host=self.config["host"],
                port=self.config["port"],
                database=self.config["database"],
                user=self.config["user"],
                password=self.config["password"],
                connect_timeout=10,
                options=f"-c statement_timeout={self.config.get('statement_timeout', 30000)}"
            )
            # Set to read-only mode if possible
            if readonly:
                with conn.cursor() as cursor:
                    cursor.execute("SET transaction_read_only = ON")
            yield conn
        except psycopg2.Error as e:
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            if conn:
                conn.close()

    def execute_query(
        self,
        query: str,
        params: Optional[Dict[str, Any]] = None,
        fetch: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Execute a SELECT query and return results.
        Only allows read operations.
        """
        # Security check - block dangerous operations at the start of query
        query_upper = query.upper().strip()
        blocked_starts = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "EXECUTE", "CREATE"]
        
        for keyword in blocked_starts:
            if query_upper.startswith(keyword):
                raise ValueError(f"Blocked operation: {keyword}")

        # Limit query length
        if len(query) > config.SECURITY_CONFIG["max_query_length"]:
            raise ValueError("Query too long")

        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    if fetch:
                        results = cursor.fetchall()
                        # Convert to list of dicts
                        return [dict(row) for row in results]
                    return []
        except Exception as e:
            logger.warning(f"Database query failed: {e}")
            # Return empty results for database failures
            return []

    def fetch_stock_data(
        self,
        warehouse_no: Optional[str] = None,
        part_number: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Fetch stock data with optional filters."""
        try:
            conditions = ["deleted_at IS NULL"]
            params = {"limit": limit}

            if warehouse_no:
                conditions.append("warehouse_no = %(warehouse_no)s")
                params["warehouse_no"] = warehouse_no

            if part_number:
                conditions.append("part_number LIKE %(part_number)s")
                params["part_number"] = f"%{part_number}%"

            query = f"""
                SELECT id, warehouse_no, storage_location, part_number, description,
                       qty, uom, rack, bin, combine_rack, vendor_name, category,
                       updated_at, created_at
                FROM "Stock"
                WHERE {' AND '.join(conditions)}
                ORDER BY updated_at DESC
                LIMIT %(limit)s
            """
            return self.execute_query(query, params)
        except Exception as e:
            logger.warning(f"Failed to fetch stock data: {e}")
            return []

    def fetch_orders_data(
        self,
        picking_status: Optional[str] = None,
        days: int = 7,
        limit: int = 500
    ) -> List[Dict[str, Any]]:
        """Fetch order workflows with optional filters."""
        try:
            conditions = ["created_at >= NOW() - INTERVAL '%(days)s days'"]
            params = {"days": days, "limit": limit}

            if picking_status:
                conditions.append("picking_status = %(picking_status)s")
                params["picking_status"] = picking_status

            query = f"""
                SELECT id, outbound_number, invoice_number, gapp_po, customer_po,
                       customer_name, picking_status, checking_status, dn_created,
                       delivery_status, upload_status, total_qty, item_count,
                       created_at, updated_at
                FROM "OrderWorkflows"
                WHERE {' AND '.join(conditions)}
                ORDER BY created_at DESC
                LIMIT %(limit)s
            """
            return self.execute_query(query, params)
        except Exception as e:
            logger.warning(f"Failed to fetch orders data: {e}")
            return []

    def fetch_order_items(self, order_id: int) -> List[Dict[str, Any]]:
        """Fetch items for a specific order."""
        try:
            query = """
                SELECT id, part_number, description, qty, picked_by, picked_rack,
                       is_picked, created_at
                FROM "OrderItems"
                WHERE order_id = %(order_id)s
                ORDER BY id
            """
            return self.execute_query(query, {"order_id": order_id})
        except Exception as e:
            logger.warning(f"Failed to fetch order items: {e}")
            return []

    def fetch_stock_movements(
        self,
        part_number: Optional[str] = None,
        days: int = 7,
        limit: int = 500
    ) -> List[Dict[str, Any]]:
        """Fetch stock movements."""
        try:
            conditions = ["created_at >= NOW() - INTERVAL '%(days)s days'"]
            params = {"days": days, "limit": limit}

            if part_number:
                conditions.append("part_number = %(part_number)s")
                params["part_number"] = part_number

            query = f"""
                SELECT id, movement_type, warehouse_no, part_number, qty_change,
                       dn_number, invoice_number, rack, actual_rack, status,
                       created_at
                FROM "StockMovements"
                WHERE {' AND '.join(conditions)}
                ORDER BY created_at DESC
                LIMIT %(limit)s
            """
            return self.execute_query(query, params)
        except Exception as e:
            logger.warning(f"Failed to fetch stock movements: {e}")
            return []

    def fetch_ai_instructions(
        self,
        category: Optional[str] = None,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """Fetch AI instructions from database."""
        try:
            conditions = ["is_active = true"] if active_only else []
            params = {}

            if category:
                conditions.append("category = %(category)s")
                params["category"] = category

            query = """
                SELECT id, instruction_key, category, priority, title, content,
                       conditions, is_active, created_at
                FROM ai_instructions
            """
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
            query += " ORDER BY priority ASC, category ASC"

            return self.execute_query(query, params)
        except Exception as e:
            logger.warning(f"Failed to fetch AI instructions: {e}")
            # Return default instructions if database is unavailable
            return [
                {
                    "id": 1,
                    "instruction_key": "default_warehouse",
                    "category": "warehouse",
                    "priority": 1,
                    "title": "Warehouse Operations",
                    "content": "Follow standard warehouse procedures for picking, checking, and delivery operations.",
                    "conditions": None,
                    "is_active": True,
                    "created_at": datetime.now().isoformat()
                }
            ]

    def fetch_daily_reports(
        self,
        report_type: Optional[str] = None,
        days: int = 30,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Fetch previously generated daily reports."""
        try:
            conditions = ["created_at >= NOW() - INTERVAL '%(days)s days'"]
            params = {"days": days, "limit": limit}

            if report_type:
                conditions.append("report_type = %(report_type)s")
                params["report_type"] = report_type

            query = f"""
                SELECT id, report_type, report_date, title, summary, details,
                       exceptions, generated_by, is_reviewed, created_at
                FROM daily_reports
                WHERE {' AND '.join(conditions)}
                ORDER BY created_at DESC
                LIMIT %(limit)s
            """
            return self.execute_query(query, params)
        except Exception as e:
            logger.warning(f"Failed to fetch daily reports: {e}")
            return []

    def get_order_summary(self) -> Dict[str, Any]:
        """Get summary statistics for orders."""
        try:
            query = """
                SELECT 
                    COUNT(*) as total_orders,
                    COUNT(*) FILTER (WHERE picking_status = 'COMPLETED') as completed_picking,
                    COUNT(*) FILTER (WHERE picking_status = 'PENDING') as pending_picking,
                    COUNT(*) FILTER (WHERE picking_status = 'PICK_REQUESTED') as pick_requested,
                    COUNT(*) FILTER (WHERE checking_status = 'COMPLETED') as completed_checking,
                    COUNT(*) FILTER (WHERE dn_created = true) as dn_created,
                    SUM(total_qty) as total_qty
                FROM "OrderWorkflows"
                WHERE created_at >= NOW() - INTERVAL '7 days'
            """
            results = self.execute_query(query)
            return results[0] if results else {}
        except Exception as e:
            logger.warning(f"Failed to get order summary: {e}")
            return {}

    def get_stock_summary(self) -> Dict[str, Any]:
        """Get summary statistics for stock."""
        try:
            query = """
                SELECT 
                    COUNT(DISTINCT part_number) as unique_parts,
                    SUM(qty) as total_qty,
                    COUNT(*) as total_locations,
                    COUNT(*) FILTER (WHERE qty < 10) as low_stock_items,
                    COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '7 days') as inactive_items
                FROM "Stock"
                WHERE deleted_at IS NULL
            """
            results = self.execute_query(query)
            return results[0] if results else {}
        except Exception as e:
            logger.warning(f"Failed to get stock summary: {e}")
            return {}


# Singleton instance
db = DatabaseManager()
