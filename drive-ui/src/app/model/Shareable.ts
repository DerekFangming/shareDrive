export class Shareable {
  name: string;
  path: string;
  isFile: boolean;
  created: Number;
  lastModified: Number;
  size: Number;

  type: string;
  icon: string;

  public constructor(init?:Partial<Shareable>) {
    Object.assign(this, init);
  }
}