import { HttpError } from "@allocations/service-common";

export class HttpErrorWithID extends HttpError {
  id: string;
  constructor(message: string, status: string, id: string) {
    super(message, status);
    this.id = id;
  }
}
