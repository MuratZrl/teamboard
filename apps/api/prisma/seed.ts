import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // --- Board Templates ---
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

  // --- Demo User & Data ---
  const DEMO_EMAIL = 'demo@teamboard.dev';
  const DEMO_PASSWORD = 'demo123456';

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Upsert demo user
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: 'Demo User', passwordHash },
    create: {
      email: DEMO_EMAIL,
      name: 'Demo User',
      passwordHash,
      emailVerified: true,
    },
  });

  // Create team members
  const memberData = [
    { email: 'alice@teamboard.dev', name: 'Alice Johnson' },
    { email: 'bob@teamboard.dev', name: 'Bob Smith' },
    { email: 'carol@teamboard.dev', name: 'Carol Williams' },
  ];

  const members = [];
  for (const m of memberData) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: { name: m.name },
      create: { email: m.email, name: m.name, emailVerified: true },
    });
    members.push(user);
  }

  // Clean up existing demo workspace if present
  const existingWs = await prisma.workspace.findUnique({ where: { slug: 'demo-workspace' } });
  if (existingWs) {
    await prisma.workspace.delete({ where: { id: existingWs.id } });
  }

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      ownerId: demoUser.id,
      members: {
        create: [
          { userId: demoUser.id, role: 'OWNER' },
          ...members.map((m) => ({ userId: m.id, role: 'MEMBER' as const })),
        ],
      },
    },
  });

  // Create labels
  const labelData = [
    { name: 'Bug', color: '#ef4444' },
    { name: 'Feature', color: '#3b82f6' },
    { name: 'Enhancement', color: '#8b5cf6' },
    { name: 'Documentation', color: '#06b6d4' },
    { name: 'Design', color: '#f59e0b' },
    { name: 'Urgent', color: '#dc2626' },
  ];

  const labels: Record<string, { id: string }> = {};
  for (const l of labelData) {
    const label = await prisma.label.create({
      data: { name: l.name, color: l.color, workspaceId: workspace.id },
    });
    labels[l.name] = label;
  }

  // --- Board 1: Product Roadmap ---
  const roadmapBoard = await prisma.board.create({
    data: { name: 'Product Roadmap', workspaceId: workspace.id },
  });

  const roadmapColumns = ['Backlog', 'In Progress', 'Review', 'Done'];
  const roadmapCols: Record<string, { id: string }> = {};
  for (let i = 0; i < roadmapColumns.length; i++) {
    roadmapCols[roadmapColumns[i]] = await prisma.column.create({
      data: { name: roadmapColumns[i], order: i, boardId: roadmapBoard.id },
    });
  }

  const allUsers = [demoUser, ...members];

  const roadmapTasks = [
    { title: 'User analytics dashboard', desc: 'Build a dashboard showing user engagement metrics, DAU/MAU, and retention charts.', col: 'Backlog', priority: 'MEDIUM', assignee: 0, labels: ['Feature'] },
    { title: 'Export boards to PDF', desc: 'Allow users to export their kanban boards as PDF documents for sharing.', col: 'Backlog', priority: 'LOW', assignee: 1, labels: ['Feature'] },
    { title: 'Keyboard shortcuts', desc: 'Add keyboard shortcuts for common actions: N for new task, E for edit, D for done.', col: 'Backlog', priority: 'LOW', assignee: null, labels: ['Enhancement'] },
    { title: 'OAuth with GitHub', desc: 'Add GitHub as a third OAuth provider alongside Google.', col: 'In Progress', priority: 'HIGH', assignee: 0, labels: ['Feature'] },
    { title: 'Drag & drop file attachments', desc: 'Support drag & drop file upload directly onto task cards.', col: 'In Progress', priority: 'MEDIUM', assignee: 2, labels: ['Enhancement'] },
    { title: 'Email notification preferences', desc: 'Let users configure which email notifications they receive.', col: 'Review', priority: 'HIGH', assignee: 1, labels: ['Feature'] },
    { title: 'Mobile responsive redesign', desc: 'Redesign the board view for mobile devices with swipeable columns.', col: 'Review', priority: 'HIGH', assignee: 3, labels: ['Design'] },
    { title: 'Setup CI/CD pipeline', desc: 'Configure GitHub Actions for automated testing and deployment.', col: 'Done', priority: 'HIGH', assignee: 0, labels: ['Enhancement'] },
    { title: 'Landing page design', desc: 'Design and implement the marketing landing page with hero, features, and pricing sections.', col: 'Done', priority: 'URGENT', assignee: 3, labels: ['Design'] },
  ];

  for (let i = 0; i < roadmapTasks.length; i++) {
    const t = roadmapTasks[i];
    const assignee = t.assignee !== null ? allUsers[t.assignee] : null;
    const daysAgo = Math.floor(Math.random() * 14) + 1;
    await prisma.task.create({
      data: {
        title: t.title,
        description: t.desc,
        priority: t.priority as any,
        order: i,
        columnId: roadmapCols[t.col].id,
        createdById: demoUser.id,
        assigneeId: assignee?.id || null,
        dueDate: t.col !== 'Done' ? new Date(Date.now() + (7 + i) * 86400000) : null,
        createdAt: new Date(Date.now() - daysAgo * 86400000),
        labels: { connect: t.labels.map((l) => ({ id: labels[l].id })) },
      },
    });
  }

  // --- Board 2: Sprint Board ---
  const sprintBoard = await prisma.board.create({
    data: { name: 'Sprint #14', workspaceId: workspace.id },
  });

  const sprintColumns = ['Todo', 'In Progress', 'Testing', 'Done'];
  const sprintCols: Record<string, { id: string }> = {};
  for (let i = 0; i < sprintColumns.length; i++) {
    sprintCols[sprintColumns[i]] = await prisma.column.create({
      data: { name: sprintColumns[i], order: i, boardId: sprintBoard.id },
    });
  }

  const sprintTasks = [
    { title: 'Fix login timeout on slow networks', col: 'Todo', priority: 'HIGH', assignee: 1, labels: ['Bug'] },
    { title: 'Add password strength indicator', col: 'Todo', priority: 'MEDIUM', assignee: 2, labels: ['Enhancement'] },
    { title: 'Refactor workspace settings page', col: 'In Progress', priority: 'MEDIUM', assignee: 0, labels: ['Enhancement'] },
    { title: 'Implement task due date reminders', col: 'In Progress', priority: 'HIGH', assignee: 1, labels: ['Feature'] },
    { title: 'Fix column reorder not persisting', col: 'Testing', priority: 'URGENT', assignee: 3, labels: ['Bug', 'Urgent'] },
    { title: 'Add bulk task selection', col: 'Todo', priority: 'LOW', assignee: null, labels: ['Feature'] },
    { title: 'Update API error responses', col: 'Done', priority: 'MEDIUM', assignee: 0, labels: ['Enhancement'] },
    { title: 'Write E2E tests for invite flow', col: 'Done', priority: 'HIGH', assignee: 2, labels: ['Documentation'] },
  ];

  for (let i = 0; i < sprintTasks.length; i++) {
    const t = sprintTasks[i];
    const assignee = t.assignee !== null ? allUsers[t.assignee] : null;
    await prisma.task.create({
      data: {
        title: t.title,
        priority: t.priority as any,
        order: i,
        columnId: sprintCols[t.col].id,
        createdById: allUsers[i % allUsers.length].id,
        assigneeId: assignee?.id || null,
        dueDate: t.col !== 'Done' ? new Date(Date.now() + (3 + i) * 86400000) : null,
        labels: { connect: t.labels.map((l) => ({ id: labels[l].id })) },
      },
    });
  }

  // --- Board 3: Bug Tracker ---
  const bugBoard = await prisma.board.create({
    data: { name: 'Bug Tracker', workspaceId: workspace.id },
  });

  const bugColumns = ['New', 'Triaged', 'In Progress', 'Resolved'];
  const bugCols: Record<string, { id: string }> = {};
  for (let i = 0; i < bugColumns.length; i++) {
    bugCols[bugColumns[i]] = await prisma.column.create({
      data: { name: bugColumns[i], order: i, boardId: bugBoard.id },
    });
  }

  const bugTasks = [
    { title: 'Board scrollbar appears on Safari', col: 'New', priority: 'LOW', assignee: null, labels: ['Bug'] },
    { title: 'Task modal closes on outside click during edit', col: 'New', priority: 'MEDIUM', assignee: null, labels: ['Bug'] },
    { title: 'Attachment upload fails for files > 5MB', col: 'Triaged', priority: 'HIGH', assignee: 2, labels: ['Bug', 'Urgent'] },
    { title: 'Dark mode text contrast on labels', col: 'In Progress', priority: 'MEDIUM', assignee: 3, labels: ['Bug', 'Design'] },
    { title: 'Invite email not rendering in Outlook', col: 'In Progress', priority: 'HIGH', assignee: 1, labels: ['Bug'] },
    { title: 'Fixed: Duplicate tasks on rapid drag', col: 'Resolved', priority: 'URGENT', assignee: 0, labels: ['Bug'] },
  ];

  for (let i = 0; i < bugTasks.length; i++) {
    const t = bugTasks[i];
    const assignee = t.assignee !== null ? allUsers[t.assignee] : null;
    await prisma.task.create({
      data: {
        title: t.title,
        priority: t.priority as any,
        order: i,
        columnId: bugCols[t.col].id,
        createdById: allUsers[(i + 1) % allUsers.length].id,
        assigneeId: assignee?.id || null,
        labels: { connect: t.labels.map((l) => ({ id: labels[l].id })) },
      },
    });
  }

  // --- Comments on some tasks ---
  const someTasks = await prisma.task.findMany({
    where: { column: { board: { workspaceId: workspace.id } } },
    take: 6,
    orderBy: { createdAt: 'desc' },
  });

  const commentTexts = [
    'I can take a look at this tomorrow morning.',
    'This is blocking the release. Can we prioritize it?',
    'Pushed a fix to the feature branch. Ready for review.',
    'Looks good! Just one small suggestion on the error handling.',
    'Added some screenshots to the description for reference.',
    'Checked on mobile and it works as expected now.',
  ];

  for (let i = 0; i < Math.min(someTasks.length, commentTexts.length); i++) {
    await prisma.comment.create({
      data: {
        content: commentTexts[i],
        taskId: someTasks[i].id,
        authorId: allUsers[(i + 1) % allUsers.length].id,
      },
    });
  }

  // --- Activity logs ---
  const activities = [
    { action: 'Created board "Product Roadmap"', userId: demoUser.id },
    { action: 'Added Alice Johnson to workspace', userId: demoUser.id },
    { action: 'Moved "Setup CI/CD pipeline" to Done', userId: demoUser.id },
    { action: 'Commented on "OAuth with GitHub"', userId: members[0].id },
    { action: 'Created board "Sprint #14"', userId: demoUser.id },
    { action: 'Assigned "Fix login timeout" to Alice', userId: members[1].id },
    { action: 'Created board "Bug Tracker"', userId: demoUser.id },
    { action: 'Moved "Landing page design" to Done', userId: members[2].id },
  ];

  for (let i = 0; i < activities.length; i++) {
    await prisma.activityLog.create({
      data: {
        action: activities[i].action,
        userId: activities[i].userId,
        workspaceId: workspace.id,
        createdAt: new Date(Date.now() - (activities.length - i) * 3600000),
      },
    });
  }

  console.log('Seeded demo user, workspace, 3 boards, 23 tasks, comments, and activity logs');
  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
