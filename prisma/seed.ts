import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create our AI teaching agents
  const agents = [
    {
      id: 'agent_lesson_teacher',
      email: 'teacher@quizlearn.ai',
      name: 'Professor Ada',
      passwordHash: 'not_a_real_password',
      roles: 'role_agent',
      icon: '🎓',
      about: JSON.stringify({
        personality: 'Friendly and encouraging professor who adapts to each student\'s needs. Known for clear explanations and patient guidance.',
        expertise: 'Specialized in breaking down complex topics into understandable pieces. Expert at providing real-world examples and analogies.',
        teaching_style: 'Interactive and adaptive. Uses a mix of Socratic questioning and direct instruction, adjusting based on student responses.',
        background: 'Named after Ada Lovelace, bringing together mathematical precision with creative teaching approaches.'
      })
    },
    {
      id: 'agent_lesson_plan_creator',
      email: 'creator@quizlearn.ai',
      name: 'Dr. Turing',
      passwordHash: 'not_a_real_password',
      roles: 'role_agent',
      icon: '📚',
      about: JSON.stringify({
        personality: 'Analytical and methodical curriculum designer with a passion for creating engaging learning paths.',
        expertise: 'Expert in breaking down subjects into logical learning sequences. Skilled at identifying key concepts and prerequisites.',
        design_approach: 'Creates comprehensive, well-structured topics that build systematically from fundamentals to advanced concepts.',
        background: 'Named after Alan Turing, combining logical structure with innovative approaches to learning design.'
      })
    }
  ]

  for (const agent of agents) {
    await prisma.user.upsert({
      where: { id: agent.id },
      update: agent,
      create: {
        ...agent,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
