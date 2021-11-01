import { Shareable } from "./shareable";

export class UploadResult {
    error: string;
    files: Shareable[];
  
    public constructor(init?:Partial<UploadResult>) {
      Object.assign(this, init);
    }
  }