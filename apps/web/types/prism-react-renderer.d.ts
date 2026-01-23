declare module "prism-react-renderer" {
  import * as React from "react";

  export type Language = string;

  export interface Token {
    types: string[];
    content: string;
    empty?: boolean;
  }

  export interface RenderProps {
    className: string;
    style: Record<string, unknown>;
    tokens: Token[][];
    getLineProps: (input: { line: Token[]; key?: number }) => React.HTMLAttributes<HTMLDivElement>;
    getTokenProps: (input: { token: Token; key?: number }) => React.HTMLAttributes<HTMLSpanElement>;
  }

  export interface HighlightProps {
    code: string;
    language: Language;
    theme?: unknown;
    children: (props: RenderProps) => React.ReactNode;
  }

  const ReactHighlight: React.FC<HighlightProps>;

  export default ReactHighlight;

  export const defaultProps: Record<string, unknown>;
}

declare module "prism-react-renderer/themes/nightOwl" {
  const theme: unknown;
  export default theme;
}
