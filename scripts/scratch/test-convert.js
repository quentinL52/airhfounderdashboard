const { convertToModelMessages } = require('ai');

const uiMessages = [
  { role: 'user', parts: [{ type: 'text', text: 'hello world' }] }
];

const result = convertToModelMessages(uiMessages);

// Check if it's iterable
if (Symbol.iterator in result) {
  console.log('Is iterable');
  console.log([...result]);
} else {
  console.log('Not iterable, checking properties:');
  for (const key of Object.getOwnPropertyNames(result)) {
    console.log(key, ':', result[key]);
  }
  console.log('Prototype:', Object.getPrototypeOf(result));
  
  // Check if it's array-like
  console.log('length:', result.length);
  console.log('Array.from:', Array.from(result));
}

// Try with content format instead of parts
const oldFormat = [
  { role: 'user', content: 'hello world' }
];
const result2 = convertToModelMessages(oldFormat);
console.log('\nOld format result:', JSON.stringify(result2, null, 2));
console.log('Old format keys:', Object.keys(result2));
console.log('Old format Array.from:', Array.from(result2));
