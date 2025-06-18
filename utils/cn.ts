
// utils/cn.ts
type ClassValue = string | number | boolean | undefined | null;
type ClassDictionary = Record<string, any>;
type ClassArray = ClassValue[];

export function cn(...inputs: (ClassValue | ClassDictionary | ClassArray)[]): string {
  const classList: string[] = [];

  for (const input of inputs) {
    if (typeof input === 'string' || typeof input === 'number') {
      if (input) {
        classList.push(String(input));
      }
    } else if (Array.isArray(input)) {
      if (input.length) {
        const inner = cn(...input);
        if (inner) {
          classList.push(inner);
        }
      }
    } else if (typeof input === 'object' && input !== null) {
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key) && input[key]) {
          classList.push(key);
        }
      }
    }
  }
  return classList.join(' ');
}
