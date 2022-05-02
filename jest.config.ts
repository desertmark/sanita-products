import type {Config} from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import {compilerOptions} from './tsconfig.json';
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  preset: 'ts-jest',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/src/' }),
  // testMatch: ["__tests__/e2e/*.test.ts"]
};
export default config;

// // Or async function
// export default async (): Promise<Config.InitialOptions> => {
//   return {
//     verbose: true,
//   };
// };