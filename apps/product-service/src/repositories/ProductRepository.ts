import {
  ProductRepository as DrizzleProductRepository,
  type NewProduct,
  type ProductRepositoryOptions,
  type ProductResponse,
  type UpdateProduct,
} from '@cqrs/drizzle';
import { Service } from 'typedi';

@Service()
export class ProductRepository {
  private drizzleProductRepo: DrizzleProductRepository;

  constructor() {
    this.drizzleProductRepo = new DrizzleProductRepository();
  }

  async create(data: { name: string; price: number; ownerId: string }): Promise<ProductResponse> {
    return this.drizzleProductRepo.createProduct(data as NewProduct);
  }

  async findById(
    id: string,
    options: ProductRepositoryOptions = {}
  ): Promise<ProductResponse | null> {
    return this.drizzleProductRepo.findById(id, {
      ...options,
      onlyActive: true, // Default to active records only
      select: {
        id: true,
        name: true,
        price: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    }) as Promise<ProductResponse | null>;
  }

  async findByOwner(
    ownerId: string,
    options: ProductRepositoryOptions = {}
  ): Promise<ProductResponse[]> {
    return this.drizzleProductRepo.findByOwner(ownerId, {
      ...options,
      onlyActive: true, // Default to active records only
      select: {
        id: true,
        name: true,
        price: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    }) as Promise<ProductResponse[]>;
  }

  async update(
    id: string,
    data: Partial<ProductResponse>,
    options: ProductRepositoryOptions = {}
  ): Promise<ProductResponse | null> {
    return this.drizzleProductRepo.updateProduct(id, data as UpdateProduct);
  }

  async delete(id: string, force: boolean = false): Promise<boolean> {
    return this.drizzleProductRepo.delete(id, force); // Soft delete by default
  }

  // Restore a soft-deleted product
  async restore(id: string): Promise<boolean> {
    return this.drizzleProductRepo.restore(id);
  }

  // Find a product including deleted records (needed for restore operation)
  async findByIdWithDeleted(id: string): Promise<ProductResponse | null> {
    return this.drizzleProductRepo.findById(id, {
      includeDeleted: true,
      select: {
        id: true,
        name: true,
        price: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    }) as Promise<ProductResponse | null>;
  }
}
