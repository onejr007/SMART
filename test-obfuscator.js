import { obfuscateForLatentSpace } from './ai/obfuscator.js';

const code = `
function add(a, b) {
  return a + b;
}
console.log(add(5, 10));
`;

const obfuscated = obfuscateForLatentSpace(code);
console.log("Original:\n", code);
console.log("\nObfuscated:\n", obfuscated);
