import { BulkStatus, ProcessCallBack } from "@models/common.models";
import { BulkProcessInProgressError } from "@models/errors.models";
import { CommonUtils } from "@utils/common.utils";
import { Logger } from "@utils/logger";
import { inject, injectable } from "inversify";
export interface BulkProcessOptions {
  chunkSize?: number;
  operationName: string;
}
@injectable()
export class BulkManager {
  private status: BulkStatus;
  get inProgress(): boolean {
    return this.status?.inProgress;
  }

  constructor(@inject(Logger) private logger: Logger) {}

  updateStatus(chunkSize: number): void {
    this.status.processed += chunkSize;
    this.status.completed = (this.status.processed / this.status.total) * 100;
    this.logger.info("bulk-manager.updateStatus: ", this.getStatus());
  }

  getStatus(): BulkStatus {
    return this.status;
  }

  async processByChunk<T>(items: T[], process: ProcessCallBack<T>, options: BulkProcessOptions): Promise<void> {
    if (this.inProgress) {
      throw new BulkProcessInProgressError();
    }
    this.startProgress(items.length, options);
    const chunks = CommonUtils.getChunks<T>(items, options.chunkSize);
    await this.processChunks<T>(chunks, process, options);
  }

  private startProgress(total: number, options: BulkProcessOptions): void {
    this.status = new BulkStatus(options.operationName);
    this.status.total = total;
    this.status.inProgress = true;
    this.logger.info(`Starting bulk process ${options.operationName}...`, options);
  }

  private clearStatus(): void {
    this.status = undefined;
  }

  private async processChunks<T>(
    chunks: T[][],
    process: ProcessCallBack<T>,
    options: BulkProcessOptions
  ): Promise<void> {
    try {
      const chunk = chunks.pop();
      await process(chunk);
      this.updateStatus(chunk?.length);
      if (chunks.length) {
        // setImmediate(() => this.processChunks(chunks, process, options));
        await this.processChunks(chunks, process, options);
        return;
      } else {
        this.clearStatus();
        this.logger.info(`Bulk operation completed: ${options.operationName} ✅ :)`);
      }
    } catch (error) {
      this.logger.error("bulk-manager.processChunk: Failed to process chunk", {
        error,
        status: this.status,
        options,
      });
      this.clearStatus();
    }
  }
}
