import { faker } from '@faker-js/faker';
import { CustomerDetails } from '../tests/helpers/cartFlows';

export const generateTestEmail = (): string => {
  return faker.internet.email();
};

export const generateTestCustomer = (overrides?: Partial<CustomerDetails>): CustomerDetails => {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    zipCode: faker.location.zipCode(),
    ...overrides,
  };
};

export const generateUSCustomer = (): CustomerDetails => {
  return generateTestCustomer({
    city: 'New York',
    zipCode: '10001',
    state: 'New York',
  });
};

export const generateFrenchCustomer = (): CustomerDetails => {
  return generateTestCustomer({
    city: 'Lyon',
    zipCode: '69001',
  });
};
