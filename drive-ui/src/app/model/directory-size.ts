export class DirectorySize {
    size: number;
  
    public constructor(init?:Partial<DirectorySize>) {
      Object.assign(this, init);
    }
  }