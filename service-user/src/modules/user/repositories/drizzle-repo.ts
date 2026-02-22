import { and, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import { drizzleDb } from '../../../db/connection';
import { users, type NewUser, type UpdateUser, type User } from '../domain/schema';

export class UserRepository {
  private db = drizzleDb;

  async findById(id: string, includeDeleted = false): Promise<User | null> {
    const where = includeDeleted
      ? eq(users.id, id)
      : and(eq(users.id, id), isNull(users.deletedAt));

    const result = await this.db.select().from(users).where(where).limit(1);
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);
    return result[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)))
      .limit(1);
    return result[0] || null;
  }

  async findAll(
    options: {
      includeDeleted?: boolean;
      limit?: number;
      offset?: number;
      search?: string;
    } = {}
  ): Promise<User[]> {
    const { includeDeleted = false, limit = 10, offset = 0, search } = options;

    const conditions = [includeDeleted ? undefined : isNull(users.deletedAt)];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(users.email, searchPattern),
          ilike(users.username, searchPattern),
          ilike(users.name, searchPattern)
        )
      );
    }

    const where = and(...conditions);

    return this.db.select().from(users).where(where).limit(limit).offset(offset);
  }

  async create(data: NewUser): Promise<User> {
    // Check for duplicate email or username
    const existing = await this.db.query.users.findFirst({
      where: (users, { or, eq }) =>
        or(eq(users.email, data.email), eq(users.username, data.username)),
    });

    if (existing) {
      if (existing.email === data.email) {
        throw new Error(`User with email ${data.email} already exists`);
      }
      throw new Error(`User with username ${data.username} already exists`);
    }

    const result = await this.db.insert(users).values(data).returning();
    return result[0];
  }

  async update(id: string, data: UpdateUser): Promise<User | null> {
    // Check for duplicates if updating email or username
    if (data.email || data.username) {
      const existing = await this.db.query.users.findFirst({
        where: (users, { or, eq, and, ne }) =>
          and(
            ne(users.id, id),
            or(
              data.email ? eq(users.email, data.email) : undefined,
              data.username ? eq(users.username, data.username) : undefined
            )
          ),
      });

      if (existing) {
        if (data.email && existing.email === data.email) {
          throw new Error(`Email ${data.email} is already in use`);
        }
        if (data.username && existing.username === data.username) {
          throw new Error(`Username ${data.username} is already in use`);
        }
      }
    }

    const result = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();
    return result[0] || null;
  }

  async softDelete(id: string): Promise<boolean> {
    await this.db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, id));
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    await this.db.delete(users).where(eq(users.id, id));
    return true;
  }

  async restore(id: string): Promise<boolean> {
    await this.db.update(users).set({ deletedAt: null }).where(eq(users.id, id));
    return true;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    return this.db
      .select()
      .from(users)
      .where(and(inArray(users.id, ids), isNull(users.deletedAt)));
  }

  async findByRole(role: 'ADMIN' | 'USER'): Promise<User[]> {
    return this.db
      .select()
      .from(users)
      .where(and(eq(users.role, role), isNull(users.deletedAt)));
  }
}

export const userRepository = new UserRepository();
