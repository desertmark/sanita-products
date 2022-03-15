import { Request, Response } from "express";
import {
  controller,
  httpGet,
  request,
  response,
} from "inversify-express-utils";

@controller("/health")
export class HealthController {
  @httpGet("/")
  async get(@request() req: Request, @response() res: Response): Promise<void> {
    res.send({
      ok: true,
      date: new Date(),
    });
  }
}
