import { Service } from 'typedi';
import { RequestMetadata } from '../../../../helpers/request-metadata';
import { UpdateProductWithVariantsRequest } from '../../domain/types';
import { productUpdatedProducer } from '../../events/product-events';
import { ProductRepository } from '../ProductRepository';

@Service()
export class UpdateProductCommand {
  constructor(private productRepository: ProductRepository) {}

  async execute(
    id: string,
    data: UpdateProductWithVariantsRequest,
    ownerId: string,
    metadata?: RequestMetadata
  ) {
    // 1. Verify ownership
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct || existingProduct.ownerId !== ownerId) {
      throw new Error('Product not found or access denied');
    }

    // Update product (supports variants)
    const product = await this.productRepository.updateWithVariants(id, data);

    if (!product) {
      throw new Error('Product not found or access denied');
    }

    // [Kafka] Send 'product.updated' event
    await productUpdatedProducer({
      id: product.id,
      name: product.name,
      price: typeof product.price === 'number' ? product.price : product.price.min,
      ownerId: product.ownerId,
      stock: product.stock,
      hasVariant: product.hasVariant,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      deletedAt: product.deletedAt,
      ...metadata,
    });

    return product;
  }
}
