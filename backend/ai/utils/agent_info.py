from typing import Dict, Any
import json
from prisma import Prisma
from .errors import AgentNotFoundError, PromptNotFoundError

class AgentInfo:
    @staticmethod
    async def get_agent_info(prisma: Prisma, agent_id: str) -> Dict[str, Any]:
        """Get agent info from database"""
        agent = await prisma.user.find_unique(
            where={'id': agent_id}
        )

        if not agent or agent.roles != 'role_agent':
            raise AgentNotFoundError(agent_id)

        # Parse the about JSON which contains the prompt
        about = json.loads(agent.about) if agent.about else {}

        return {
            'name': agent.name,
            'icon': agent.icon,
            'prompt': about.get('prompt', {})
        }

    @staticmethod
    async def get_agent_prompt(prisma: Prisma, agent_id: str, prompt_type: str) -> str:
        """Get agent's prompt template from about field"""
        agent_info = await AgentInfo.get_agent_info(prisma, agent_id)
        prompt = agent_info.get('prompt', {})

        if prompt_type not in prompt:
            raise PromptNotFoundError(agent_id, prompt_type)

        return prompt[prompt_type]

    @staticmethod
    async def update_agent_info(prisma: Prisma, agent_id: str, updates: Dict[str, Any]) -> None:
        """Update agent information in database"""
        agent = await prisma.user.find_unique(
            where={'id': agent_id}
        )

        if not agent:
            raise AgentNotFoundError(agent_id)

        current_about = json.loads(agent.about) if agent.about else {}

        # Update prompt if provided
        if 'prompt' in updates:
            current_about['prompt'] = updates['prompt']

        # Update agent
        await prisma.user.update(
            where={'id': agent_id},
            data={
                'name': updates.get('name', agent.name),
                'icon': updates.get('icon', agent.icon),
                'about': json.dumps(current_about)
            }
        )
