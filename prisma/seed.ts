import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 12)
  const demoPassword = await bcrypt.hash('demo123', 12)

  // Create or update admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@buyerapp.com' },
    update: {
      password: adminPassword,
    },
    create: {
      email: 'admin@buyerapp.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create or update demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      password: demoPassword,
    },
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: demoPassword,
      role: 'USER',
    },
  })

  console.log('✅ Users created successfully:')
  console.log('Admin User:', adminUser)
  console.log('Demo User:', demoUser)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
