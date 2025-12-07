export function serializeForJson(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeForJson);
  if (typeof obj === 'object') {
    const out: any = {};
    for (const k of Object.keys(obj)) {
      try {
        out[k] = serializeForJson(obj[k]);
      } catch {
        out[k] = String(obj[k]);
      }
    }
    return out;
  }
  return obj;
}
