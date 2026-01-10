# Ollama Integration - Offline LLM for AI Service
import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import httpx
import config

logger = logging.getLogger(__name__)


class OllamaClient:
    """Client for interacting with Ollama LLM service."""

    def __init__(self):
        self.config = config.OLLAMA_CONFIG
        self.base_url = self.config["base_url"]
        self.model = self.config["model"]
        self.timeout = self.config["request_timeout"]

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        context: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Generate response from Ollama LLM.
        
        Args:
            prompt: User prompt
            system_prompt: System instructions
            context: Conversation history
            
        Returns:
            Dict with response, tokens, and metadata
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        if context:
            messages.extend(context)

        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": self.config.get("temperature", 0.3),
                "num_predict": self.config.get("max_tokens", 2048),
            }
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()

                return {
                    "success": True,
                    "response": result.get("message", {}).get("content", ""),
                    "model": self.model,
                    "tokens": {
                        "prompt": result.get("prompt_eval_count", 0),
                        "response": result.get("eval_count", 0),
                    },
                    "created_at": datetime.now().isoformat(),
                }

        except httpx.TimeoutException:
            logger.error("Ollama request timed out")
            return {
                "success": False,
                "error": "Request timed out",
                "model": self.model,
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama HTTP error: {e}")
            return {
                "success": False,
                "error": f"HTTP error: {e.response.status_code}",
                "model": self.model,
            }
        except Exception as e:
            logger.error(f"Ollama request failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "model": self.model,
            }

    async def check_health(self) -> Dict[str, Any]:
        """Check Ollama service health."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                data = response.json()
                return {
                    "healthy": True,
                    "models": [m["name"] for m in data.get("models", [])],
                    "loaded_model": self.model if any(
                        self.model in m.get("name", "") for m in data.get("models", [])
                    ) else None,
                }
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return {
                "healthy": False,
                "error": str(e),
            }

    async def pull_model(self, model: Optional[str] = None) -> Dict[str, Any]:
        """Pull/download a model from Ollama registry."""
        target_model = model or self.model
        try:
            async with httpx.AsyncClient(timeout=300) as client:
                response = await client.post(
                    f"{self.base_url}/api/pull",
                    json={"name": target_model, "stream": False}
                )
                response.raise_for_status()
                return {
                    "success": True,
                    "model": target_model,
                    "message": "Model pulled successfully",
                }
        except Exception as e:
            logger.error(f"Failed to pull model {target_model}: {e}")
            return {
                "success": False,
                "model": target_model,
                "error": str(e),
            }


# System prompt for GoDAM AI Assistant
GODAM_SYSTEM_PROMPT = """You are GoDAM AI Assistant, an enterprise warehouse & logistics AI.

## User Interaction
- Call the user by their name when they introduce themselves
- Address the user personally throughout the conversation
- Remember and use the user's name in your responses
- Be helpful and friendly while maintaining professional warehouse focus

## Core Principles
- NEVER write to any database tables
- NEVER execute SQL directly
- NEVER modify existing data
- All responses must be based on provided data and instructions
- Follow the instruction memory system strictly

## Response Format
Every response MUST follow this structure:
1. Current system status
2. Detected issue or observation
3. Root cause (if data allows)
4. What the user should do
5. How to do it (steps)
6. Prevention or automation suggestion

## Response Style
- Short and clear
- Warehouse-focused
- No emojis
- No storytelling
- Use plain text
- Personalize with user's name when known

## Knowledge Scope
You can analyze and reason about:
- Stock levels and locations
- Stock movements and history
- Order workflows and statuses
- Delivery notes (DN)
- Pick and check operations
- Customer data
- Operational risks

## Instructions Priority
1. Load relevant instructions from ai_instructions table
2. Follow stored business rules
3. Never invent rules if instructions exist

## Safety Rules
- Block any request to modify data
- Warn if admin access is required
- Never expose credentials
- Report security concerns"""


class GoDAMPromptBuilder:
    """Builds prompts for GoDAM AI context."""

    def __init__(self, db_manager):
        self.db = db_manager

    async def build_chat_prompt(
        self,
        user_query: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Build prompt for chat interaction."""
        # Fetch relevant instructions
        instructions = self.db.fetch_ai_instructions(active_only=True)

        # Build instruction context
        instruction_context = self._format_instructions(instructions)

        # Build data context
        data_context = ""
        if context:
            data_context = self._format_data_context(context)

        # Build the full prompt
        full_prompt = f"""## User Query
{user_query}

## Available Data
{data_context if data_context else 'No specific data provided. Use general knowledge.'}

## Relevant Instructions
{instruction_context if instruction_context else 'No specific instructions available.'}

## Analysis Required
Analyze the above information and provide:
- Current status summary
- Any issues detected
- Recommended actions (if any)
"""

        return {
            "system_prompt": GODAM_SYSTEM_PROMPT,
            "user_prompt": full_prompt,
            "instructions_count": len(instructions),
        }

    def _format_instructions(self, instructions: List[Dict]) -> str:
        """Format instructions for the prompt."""
        if not instructions:
            return ""

        formatted = []
        for inst in instructions[:10]:  # Limit to 10 instructions
            formatted.append(f"- [{inst.get('category', 'general')}] {inst.get('title')}: {inst.get('content', '')[:200]}")
        return "\n".join(formatted)

    def _format_data_context(self, context: Dict[str, Any]) -> str:
        """Format data context for the prompt."""
        lines = []

        if "orders" in context:
            orders = context["orders"]
            lines.append(f"### Orders ({len(orders)} records)")
            for order in orders[:5]:
                lines.append(f"- {order.get('outbound_number')}: {order.get('picking_status')}, {order.get('customer_name', 'N/A')}")

        if "stock" in context:
            stock = context["stock"]
            lines.append(f"### Stock ({len(stock)} records)")
            for item in stock[:5]:
                lines.append(f"- {item.get('part_number')}: Qty {item.get('qty')}, Rack {item.get('rack', 'N/A')}")

        if "movements" in context:
            movements = context["movements"]
            lines.append(f"### Recent Movements ({len(movements)} records)")
            for mov in movements[:3]:
                lines.append(f"- {mov.get('movement_type')}: {mov.get('part_number')} ({mov.get('qty_change')})")

        return "\n".join(lines) if lines else ""

    async def build_report_prompt(
        self,
        report_type: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build prompt for report generation."""
        # Get report template
        templates = self.db.execute_query(
            "SELECT * FROM ai_report_templates WHERE report_type = %s AND is_active = true",
            {"report_type": report_type}
        )

        template = templates[0] if templates else None

        system_prompt = GODAM_SYSTEM_PROMPT + f"""

## Report Context
You are generating a {report_type} report for warehouse operations.
Follow the report template instructions if available.
Provide clear, manager-friendly summary.
"""

        user_prompt = f"""## Report Type: {report_type}

## Data
{json.dumps(data, indent=2, default=str)}

## Report Template Instructions
{template.get('analysis_instructions', 'Provide comprehensive analysis with actionable insights.') if template else 'Provide comprehensive analysis.'}

## Output Required
Generate a professional report with:
1. Executive Summary
2. Key Metrics
3. Issues and Exceptions
4. Recommendations
"""

        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "report_type": report_type,
        }


# Singleton instances
ollama_client = OllamaClient()

