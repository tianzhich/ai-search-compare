import { SearchEngine, Source } from "@/app/types";
import localForage from "localforage";

export interface HistoryItem {
  id: string;
  createTime: string;
  updateTime: string;
  question: string;
  sources: Partial<Record<SearchEngine, Source[]>>;
  answers: Partial<Record<SearchEngine, string>>;
}

export const ENGINE_ORDER_PREF_KEY = "engine-order";
export const HISTORY_KEY = "history";
export const JINA_API_KEY = "jina-api-key";

export async function addRecord(
  question: string,
  data: HistoryItem["sources"]
) {
  const key = Date.now().toString(36);
  const id = `${HISTORY_KEY}-${key}`;
  await localForage.setItem(id, {
    id: key,
    createTime: new Date().toLocaleString(),
    updateTime: new Date().toLocaleString(),
    question,
    sources: data,
    answers: {},
  } as HistoryItem);
  return key;
}

export async function updateRecordAnswer(
  _id: string,
  engine: SearchEngine,
  answer: string
) {
  const id = `${HISTORY_KEY}-${_id}`;
  return localForage.getItem<HistoryItem>(id).then((item) => {
    if (!item) return;
    return localForage.setItem<HistoryItem>(id, {
      ...item,
      updateTime: new Date().toLocaleString(),
      answers: {
        ...item.answers,
        [engine]: answer,
      },
    });
  });
}

export async function updateRecordSources(
  _id: string,
  engine: SearchEngine,
  sources: Source[]
) {
  const id = `${HISTORY_KEY}-${_id}`;
  return localForage.getItem<HistoryItem>(id).then((item) => {
    if (!item) return;
    return localForage.setItem<HistoryItem>(id, {
      ...item,
      updateTime: new Date().toLocaleString(),
      sources: {
        ...item.sources,
        [engine]: sources,
      },
    });
  });
}

export async function getRecords() {
  return localForage.keys().then((keys) => {
    const reversedKeys = keys
      .filter((k) => k.startsWith(HISTORY_KEY))
      .reverse();
    return Promise.all(
      reversedKeys
        .map((key) => localForage.getItem<HistoryItem>(key))
        .filter((item) => !!item) as Promise<HistoryItem>[]
    );
  });
}

export async function setPref(key: string, value: unknown) {
  localForage.setItem(key, value);
}

export async function getPref(key: string) {
  return localForage.getItem(key);
}

export async function getJinaApiKey() {
  const key = await localForage.getItem<string>(JINA_API_KEY);
  return key || "";
}

export async function setJinaApiKey(value: string) {
  return localForage.setItem(JINA_API_KEY, value);
}
