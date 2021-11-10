export class Shareable {
  name: string;
  path: string;
  isFile: boolean;
  created: number;
  lastModified: number;
  size: number;

  type: string;
  icon: string;

  public constructor(init?:Partial<Shareable>) {
    Object.assign(this, init);
  }
}
