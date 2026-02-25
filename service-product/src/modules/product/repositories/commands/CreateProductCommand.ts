import { Service } from 'typedi';
import { RequestMetadata } from '../../../../helpers/request-metadata';
import { CreateProductWithVariantsRequest } from '../../domain/types';
import { productCreatedProducer } from '../../events/product-events';
import { ProductRepository } from '../ProductRepository';

@Service()
export class CreateProductCommand {
  constructor(private productRepository: ProductRepository) {}

  async execute(data: CreateProductWithVariantsRequest, metadata?: RequestMetadata) {
    // Create product with potential variants
    let product;
    if (
      (data.variants && data.variants.length > 0) ||
      (data.attributes && data.attributes.length > 0)
    ) {
      product = await this.productRepository.createWithVariants(data);
    } else {
      product = await this.productRepository.create({
        name: data.name,
        price: data.price,
        ownerId: data.ownerId,
        stock: data.stock,
      });
    }

    // [Kafka] Send 'product.created' event to message broker
    await productCreatedProducer({
      id: product.id,
      name: product.name,
      price: typeof product.price === 'number' ? product.price : product.price.min, // Simplified for event
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
