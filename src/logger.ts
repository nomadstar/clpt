const safe = (v: any) => {
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v, (_k, value) => typeof value === 'bigint' ? value.toString() : value);
    } catch {
      return String(v);
    }
  }
  return String(v);
};

export const log = {
  info: (...args: any[]) => {
    try { process.stdout.write('[info] ' + args.map(safe).join(' ') + '\n'); } catch { /* noop */ }
  },
  warn: (...args: any[]) => {
    try { process.stdout.write('[warn] ' + args.map(safe).join(' ') + '\n'); } catch { /* noop */ }
  },
  error: (...args: any[]) => {
    try { process.stderr.write('[error] ' + args.map(safe).join(' ') + '\n'); } catch { /* noop */ }
  },
};
