export class BaseError extends Error {
  constructor(public status: number, public message: string, public type: string) {
    super(message);
  }
}
export class BulkProcessInProgressError extends BaseError {
  constructor() {
    super(
      409,
      "A bulk process is already running. Please wait for it to finish before running another bulk process.",
      BulkProcessInProgressError.name
    );
  }
}
