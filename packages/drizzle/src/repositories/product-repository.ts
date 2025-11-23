import type {
  NewProduct,
  Product,
  ProductResponse,
  UpdateProduct,
} from '../schema/entities/products';
import { products } from '../schema/entities/products';
import { BaseRepository } from './base-repository';

/**
 * Simplified Product Repository
 * Only essential CRUD operations needed for APIs
 */
export class ProductRepository extends BaseRepository<Product, NewProduct, UpdateProduct> {
  protected table = products;

  constructor(db?: any) {
    super(db);
  }

  /**
   * Find product by ID
   */
  async findById(id: string): Promise<ProductResponse | null> {
    return this.findOne({ id });
  }

  /**
   * Find products by owner ID
   */
  async findByOwner(ownerId: string): Promise<ProductResponse[]> {
    return this.findMany({ owner_id: ownerId });
  }

  /**
   * Create a new product
   */
  async create(productData: NewProduct): Promise<ProductResponse> {
    // Validate price
    if (productData.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }

    return this.create(productData);
  }

  /**
   * Update a product
   */
  async update(id: string, productData: UpdateProduct): Promise<ProductResponse | null> {
    // Validate price if provided
    if (productData.price !== undefined && productData.price <= 0) {
      throw new Error('Product price must be greater than 0');
    }

    return this.update(id, productData);
  }

  /**
   * Delete a product (soft delete by default)
   */
  async delete(id: string, force: boolean = false): Promise<boolean> {
    return this.delete(id, force);
  }

  /**
   * Restore a soft-deleted product
   */
  async restore(id: string): Promise<boolean> {
    return this.restore(id);
  }
}

// Export singleton instance
export const productRepository = new ProductRepository();
