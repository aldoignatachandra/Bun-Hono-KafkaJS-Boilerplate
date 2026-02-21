import { BaseParanoidEntity } from '../../../helpers/schema/base-table';
export { roleEnum } from '../../../helpers/schema/enums';
export declare const users: any;
export declare const userSessions: any;
export declare const userActivityLogs: any;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type NewUserActivityLog = typeof userActivityLogs.$inferInsert;
export interface UserEntity extends BaseParanoidEntity {
    email: string;
    username: string;
    name: string | null;
    password: string;
    role: 'ADMIN' | 'USER';
}
export interface CreateUserRequest {
    email: string;
    username: string;
    name?: string;
    password: string;
    role?: 'ADMIN' | 'USER';
}
export interface UpdateUserRequest {
    email?: string;
    username?: string;
    name?: string;
    password?: string;
    role?: 'ADMIN' | 'USER';
}
export interface UserQueryOptions {
    includeProducts?: boolean;
    paranoid?: {
        includeDeleted?: boolean;
        onlyDeleted?: boolean;
        onlyActive?: boolean;
    };
    limit?: number;
    offset?: number;
    orderBy?: 'email' | 'createdAt' | 'updatedAt';
    orderDirection?: 'asc' | 'desc';
}
export interface UserResponse {
    id: string;
    email: string;
    username: string;
    name: string | null;
    role: 'ADMIN' | 'USER';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
export interface UserWithProductsResponse extends UserResponse {
    products: ProductResponse[];
}
interface ProductResponse {
    id: string;
    name: string;
    price: number;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
//# sourceMappingURL=schema.d.ts.map