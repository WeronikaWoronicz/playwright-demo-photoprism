import { faker } from '@faker-js/faker';

export interface PhotoMetadata {
  title: string;
  description: string;
  tags: string[];
}

export function generatePhotoMetadata(seed?: number): PhotoMetadata {
  if (seed !== undefined) {
    faker.seed(seed);
  }
  return {
    title: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    tags: [faker.word.noun(), faker.word.noun()],
  };
}
