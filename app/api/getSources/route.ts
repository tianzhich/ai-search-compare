import {
  EXAResponse,
  SearchEngine,
  SerperResponse,
  Source,
  TavilyResponse,
} from "@/app/types";
import { NUM_RESULTS } from "@/utils/constant";
import { NextResponse } from "next/server";

function parseJinaResponseText(input: string) {
  const regex =
    /\[\d+\] Title: (.*?)\n\[\d+\] URL Source: (.*?)\n(?:\[\d+\] Description: .*?\n)?(?:\[\d+\] Published Time: .*?\n)?\[\d+\] Markdown Content:\s*([\s\S]*?)(?=\n{2,}\[\d+\] Title:|\n{2,}$|$)|\[\d+\] Title: (.*?)\n\[\d+\] URL Source: (.*?)(?=\n{2,}\[\d+\] Title:|\n{2,}$|$)/g;

  const result: Source[] = [];

  let match;
  while ((match = regex.exec(input)) !== null) {
    const [, title, url, content] = match;
    result.push({
      title: title.trim(),
      url: url.trim(),
      content: content.trim(),
    });
  }

  return result;
}

// async function delay(time: number) {
//   return new Promise((resolve) => setTimeout(resolve, time));
// }

export async function POST(request: Request) {
  const {
    question,
    engine,
    jinaApiKey,
  }: {
    question: string;
    engine: SearchEngine;
    jinaApiKey?: string;
  } = await request.json();
  let results: Source[] = [];

  // results = JSON.parse(JSON.stringify(fakeData[engine]));
  // await delay(2000);
  // return NextResponse.json({ data: results, msg: "", code: 0 });

  try {
    if (engine === "exa") {
      const EXA_API_KEY = process.env["EXA_API_KEY"];
      if (!EXA_API_KEY) {
        throw new Error("EXA_API_KEY is required");
      }

      const response = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": EXA_API_KEY,
        },
        body: JSON.stringify({
          query: question,
          type: "keyword",
          numResults: NUM_RESULTS,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch from Exa");
      }

      const data: EXAResponse = await response.json();

      results = data.results.map(({ title, url }) => ({
        title,
        url,
      }));
    } else if (engine === "serper") {
      const SERPER_API_KEY = process.env["SERPER_API_KEY"];
      if (!SERPER_API_KEY) {
        throw new Error("SERPER_API_KEY is required");
      }

      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: question,
          num: NUM_RESULTS,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch from Serper");
      }

      const data: SerperResponse = await response.json();

      results = data.organic.map(({ title, link }) => ({
        title,
        url: link,
      }));
    } else if (engine === "tavily") {
      const TAVILY_API_KEY = process.env["TAVILY_API_KEY"];
      if (!TAVILY_API_KEY) {
        throw new Error("TAVILY_API_KEY is required");
      }

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: question,
          max_results: NUM_RESULTS,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch from Tavily");
      }

      const data: TavilyResponse = await response.json();

      results = data.results.map(({ title, url }) => ({
        title,
        url,
      }));
    } else if (engine === "jina") {
      const JINA_API_KEY = jinaApiKey || process.env["JINA_API_KEY"];
      if (!JINA_API_KEY) {
        throw new Error("JINA_API_KEY is required");
      }

      const response = await fetch(`https://s.jina.ai/${question}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${JINA_API_KEY}`,
        },
      });

      const text = await response.text();
      results = parseJinaResponseText(text);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ data: [], msg: error.message, code: 1 });
  }

  return NextResponse.json({ data: results, msg: "", code: 0 });
}
