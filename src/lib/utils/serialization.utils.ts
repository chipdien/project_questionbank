/**
 * Recursively converts BigInt fields in an object or array to a JSON-serializable format (number or string).
 * If the BigInt value is within the safe integer range, it is converted to a number;
 * otherwise, it is converted to a string.
 */
export function serializeBigInt<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    const num = Number(obj);
    return Number.isSafeInteger(num) ? num : obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj;
    }
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      newObj[key] = serializeBigInt((obj as any)[key]);
    }
    return newObj;
  }

  return obj;
}
