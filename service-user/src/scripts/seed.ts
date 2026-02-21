import { and, asc, eq, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { closeDatabaseConnection, drizzleDb } from '../db/connection';
import logger from '../helpers/logger';
import { hashPassword } from '../helpers/password';
import { users } from '../modules/user/domain/schema';

async function seed() {
  try {
    logger.info('Starting database seed...');

    // ============================================
    // 1. Create ADMIN user
    // ============================================
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin123!';
    const hashedAdminPassword = await hashPassword(adminPassword);

    const existingAdmin = await drizzleDb.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, adminEmail),
    });

    if (!existingAdmin) {
      await drizzleDb.insert(users).values({
        id: uuidv4(),
        email: adminEmail,
        username: 'admin',
        name: 'Admin',
        password: hashedAdminPassword,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info('✅ Admin user created successfully!');
      logger.info(`   Email: ${adminEmail}`);
      logger.info(`   Password: ${adminPassword}`);
    } else {
      logger.info('⚠️  Admin user already exists. Skipping...');
    }

    // ============================================
    // 2. Create USER (for product ownership)
    // ============================================
    const userEmail = 'user@example.com';
    const userPassword = 'User123!';
    const hashedUserPassword = await hashPassword(userPassword);

    const existingUser = await drizzleDb.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, userEmail),
    });

    if (!existingUser) {
      await drizzleDb.insert(users).values({
        id: uuidv4(),
        email: userEmail,
        username: 'testuser',
        name: 'Test User',
        password: hashedUserPassword,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info('✅ Test user created successfully!');
      logger.info(`   Email: ${userEmail}`);
      logger.info(`   Password: ${userPassword}`);
    } else {
      logger.info('⚠️  Test user already exists. Skipping...');
    }

    // ============================================
    // 3. Log the oldest active USER (for product seeder)
    // ============================================
    const oldestUser = await drizzleDb
      .select()
      .from(users)
      .where(and(eq(users.role, 'USER'), isNull(users.deletedAt)))
      .orderBy(asc(users.createdAt))
      .limit(1);

    if (oldestUser.length > 0) {
      logger.info('📋 Oldest active USER for product seeder:');
      logger.info(`   ID: ${oldestUser[0].id}`);
      logger.info(`   Email: ${oldestUser[0].email}`);
      logger.info(`   Created: ${oldestUser[0].createdAt}`);
    }

    await closeDatabaseConnection();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to seed database', { error });
    await closeDatabaseConnection();
    process.exit(1);
  }
}

seed();
