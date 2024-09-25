import { EXAExtractResponse, Source } from "@/app/types";
import { AIStreamPayload, AIStream } from "@/utils/AIStream";

export const maxDuration = 45;

export async function POST(request: Request) {
  const EXA_API_KEY = process.env["EXA_API_KEY"];
  if (!EXA_API_KEY) {
    throw new Error("EXA_API_KEY is required");
  }

  const { sources, question }: { sources: Source[]; question: string } =
    await request.json();
  const sourcesWithContent = [...sources];

  const resultUrls = sources.filter((s) => !s.content).map((s) => s.url);
  try {
    const response = await fetch("https://api.exa.ai/contents", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": EXA_API_KEY,
      },
      body: JSON.stringify({
        ids: resultUrls,
      }),
    });
    const rawJSON: EXAExtractResponse = await response.json();
    rawJSON.results.forEach(({ text, url }) => {
      const source = sourcesWithContent.find((s) => s.url === url);
      if (source) {
        source.content = text;
      }
    });
  } catch (e) {
    console.log("Error fetching text from source URLs: ", e);
  }

  const mainAnswerPrompt = `
  Given a user question and some context, please write a verbose answer with a lot of details to the question based on the context. You will be given a set of related contexts to the question, each starting with a reference number. Please use the context when crafting your answer. 
  
  You must respond back ALWAYS IN MARKDOWN. Say "No relevant results found.", if the given context do not provide sufficient information.

  Here are the set of contexts:

  <contexts>
  ${sourcesWithContent.map(({ content, url, title }, index) => {
    const name = `${index + 1}. ${title}`;
    return `${url ? `[${name}](${url})` : name}. ${content} \n\n`;
  })}
  </contexts>

  Remember, you have to cite the answer using [[number]](url) notation so the user can know where the information is coming from.
  Place these citations at the end of that particular sentence. You can cite the same sentence multiple times if it is relevant to the user's query like [number1][number2].
  However you do not need to cite it using the same number. You can use different numbers to cite the same sentence multiple times. The number refers to the number of the search result (passed in the context) used to generate that part of the answer.
  
  It is very important for my career that you follow these instructions. Here is the user question:
    `;

  const payload: AIStreamPayload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: mainAnswerPrompt },
      {
        role: "user",
        content: question,
      },
    ],
    stream: true,
  };

  try {
    const stream = await AIStream(payload);
    return new Response(stream, {
      headers: new Headers({
        "Cache-Control": "no-cache",
      }),
    });
  } catch (e) {
    // If for some reason streaming fails, we can just call it without streaming
    console.log(
      "[getAnswer] Answer stream failed. Try fetching non-stream answer."
    );

    const answer = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({ ...payload, stream: false }),
    });
    let parsedAnswer = await answer.json();
    parsedAnswer = parsedAnswer.choices![0].message?.content;

    console.log("Error is: ", e);
    return new Response(parsedAnswer, { status: 202 });
  }
}
