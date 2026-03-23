// Module declarations for packages without @types support
declare module 'pdf-parse' {
  function pdfParse(data: any): Promise<any>;
  export = pdfParse;
}

declare module 'markdown-it' {
  class MarkdownIt {
    render(md: string): string;
    parse(md: string, env?: any): any[];
  }
  function markdownIt(preset?: string, options?: any): MarkdownIt;
  export = markdownIt;
}

declare module 'docx' {
  export interface IDocumentOptions {
    sections: ISection[];
  }
  export interface ISection {
    children: any[];
  }
  export class Document {
    constructor(options: IDocumentOptions);
  }
  export class Packer {
    static toBuffer(doc: Document): Promise<Buffer>;
    static toStream(writer: any, doc: Document): Promise<void>;
  }
  export function File(options: any): any;
}
