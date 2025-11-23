import { Service } from 'typedi';
import { productCreatedProducer } from '../events/product-events';
import { ProductRepository } from '../repositories/ProductRepository';
import { CreateProductInput } from '../validation/product';

@Service()
export class CreateProductCommand {
  constructor(private productRepository: ProductRepository) {}

  async execute(data: CreateProductInput & { ownerId: string }) {
    // Create product
    const product = await this.productRepository.create(data);

    // Emit Kafka event
    await productCreatedProducer(product);

    return product;
  }
}
