import 'reflect-metadata';
import { Container } from 'typedi';

// Set up dependency injection container
Container.set({
  global: true,
});

// Register Drizzle repositories (will be available when @cqrs/drizzle is imported)
// These are placeholder registrations - actual implementation would be in the drizzle package
// or in the services that use these repositories

// Example repository registrations (commented out until actual repositories are available)
// Container.set('userRepository', {
//   factory: () => require('@cqrs/drizzle').userRepository,
// });

// Container.set('productRepository', {
//   factory: () => require('@cqrs/drizzle').productRepository,
// });

// Container.set('transactionManager', {
//   factory: () => require('@cqrs/drizzle').transactionManager,
// });

// Database connection registration
// Container.set('db', {
//   factory: () => require('./db').default,
// });

export { Container };

// Helper function to get repository from container
export const getRepository = <T>(name: string): T => {
  return Container.get<T>(name);
};

// Helper function to register repository dynamically
export const registerRepository = <T>(name: string, repository: T): void => {
  Container.set(name, repository);
};
