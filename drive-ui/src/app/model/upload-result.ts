import { Shareable } from "./shareable";

export class UploadResult {
  error: string | undefined
  files: Shareable[] | undefined

  public constructor(init?:Partial<UploadResult>) {
    Object.assign(this, init)
  }
}