const isDev = import.meta.env.DEV;

export const debug = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    } else {
      // In production, only log the error message without sensitive details
      console.error(args[0]);
    }
  },
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  }
};
