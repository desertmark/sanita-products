import { injectable } from "inversify";
import { createLogger, Logger as WinstonLogger, transports, format } from "winston";
@injectable()
export class Logger {
  private logger: WinstonLogger;
  constructor() {
    this.logger = createLogger({
      transports: new transports.Console({
        format: format.combine(
          format.colorize({ all: true }),
          format.simple(),
        )
      }),
    });
  }

  debug(msg: string, meta?: any) {
    this.logger.debug(msg, meta);
  }

  info(msg: string, meta?: any) {
    this.logger.info(msg, meta);
  }

  warn(msg: string, meta?: any) {
    this.logger.warn(msg, meta);
  }

  error(msg: string, meta?: any) {
    this.logger.error(msg, meta);
  }
}
