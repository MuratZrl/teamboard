import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = [
    {
      id: 'tpl-sprint',
      name: 'Sprint Board',
      description: 'Agile sprint planning with backlog, sprint, and done columns',
      columns: JSON.stringify(['Backlog', 'Sprint Todo', 'In Progress', 'Review', 'Done']),
      icon: 'zap',
    },
    {
      id: 'tpl-bug-tracker',
      name: 'Bug Tracker',
      description: 'Track and resolve bugs with triage workflow',
      columns: JSON.stringify(['New', 'Triaged', 'In Progress', 'Testing', 'Resolved']),
      icon: 'bug',
    },
    {
      id: 'tpl-marketing',
      name: 'Marketing Campaign',
      description: 'Plan and execute marketing campaigns',
      columns: JSON.stringify(['Ideas', 'Planning', 'In Progress', 'Review', 'Published']),
      icon: 'megaphone',
    },
    {
      id: 'tpl-kanban',
      name: 'Simple Kanban',
      description: 'Classic kanban board for any workflow',
      columns: JSON.stringify(['Todo', 'In Progress', 'Review', 'Done']),
      icon: 'layout-grid',
    },
    {
      id: 'tpl-content',
      name: 'Content Pipeline',
      description: 'Manage content creation from ideation to publication',
      columns: JSON.stringify(['Ideas', 'Drafting', 'Editing', 'Scheduled', 'Published']),
      icon: 'file-text',
    },
  ];

  for (const tpl of templates) {
    await prisma.boardTemplate.upsert({
      where: { id: tpl.id },
      update: tpl,
      create: tpl,
    });
  }

  console.log('Seeded board templates');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
