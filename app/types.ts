export type SearchEngine = "serper" | "jina" | "exa" | "tavily";

export interface Source {
  title: string;
  url: string;
  content?: string;
  favIcon?: string;
}

export interface EXAResponse {
  results: {
    title: string;
    url: string;
  }[];
}

export interface SerperResponse {
  organic: { title: string; link: string }[];
}

export interface JinaResponse {
  data: {
    docs: {
      title: string;
      url: string;
    }[];
  };
}

export interface TavilyResponse {
  results: {
    title: string;
    url: string;
  }[];
}

export interface EXAExtractResponse {
  results: {
    text: string;
    url: string;
  }[];
}
