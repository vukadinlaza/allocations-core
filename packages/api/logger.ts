import pino from "pino";

const pinoOptions = {
  name: "core-api",
  dedupe: false,
  formatters: {
    level(level: any) {
      return { level };
    },
  },
};

const logger = () => {
  return pino(pinoOptions);
};

export default logger;
