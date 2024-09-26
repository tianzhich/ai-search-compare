"use client";
import { Button, Collapse, Input, Menu, message, Tooltip } from "antd";
import styles from "./page.module.css";
import DragCollapse from "@/components/DragCollapse";
import ResponsiveSider from "@/components/ResponsiveSider";
import { SearchEngine, Source } from "./types";
import SourcePanel from "@/components/SourcePanel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AnswerPanel from "@/components/AnserPanel";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addRecord,
  getRecords,
  HistoryItem,
  updateRecordAnswer,
  updateRecordSources,
} from "@/utils/storage";
import { usePrevious } from "react-use";
import { CopyOutlined } from "@ant-design/icons";

const SEARCH_ENGINE: SearchEngine[] = ["exa", "serper", "jina", "tavily"];
const { Search } = Input;

export default function Home() {
  const [loadingMap, setLoadingMap] = useState<
    Partial<Record<SearchEngine, boolean>>
  >({});
  const [question, setQuestion] = useState("");
  const [sourcesMap, setSourcesMap] = useState<
    Partial<Record<SearchEngine, Source[]>>
  >({});

  const [answersMap, setAnswersMap] = useState<
    Partial<Record<SearchEngine, string>>
  >({});
  const streamingAnswerRef = useRef<Partial<Record<SearchEngine, string>>>({});
  const [showAnswerMap, setShowAnswerMap] = useState<
    Record<SearchEngine, boolean>
  >({ exa: false, serper: false, jina: false, tavily: false });

  const [activeKey, setActiveKey] = useState<string[]>([]);
  const initRef = useRef<boolean>(false);

  const [initRecordList, setInitRecordList] = useState<HistoryItem[]>();
  const [recordList, setRecordList] = useState<HistoryItem[]>([]);

  const searchParams = useSearchParams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initQuestionParam = useMemo(() => searchParams.get("q") ?? "", []);
  const recordParam = searchParams.get("record") ?? "";
  const prevRecordParam = usePrevious(recordParam);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initRecordParam = useMemo(() => searchParams.get("record") ?? "", []);

  const pathname = usePathname();
  const { replace } = useRouter();

  const updateSearchParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(key, value);
      replace(`${pathname}?${params.toString()}`);
    },
    [pathname, replace, searchParams]
  );

  const fetchSource = useCallback(
    (
      question: string,
      engine: SearchEngine,
      newSourcesMap: Partial<Record<SearchEngine, Source[]>>
    ) => {
      setLoadingMap((prev) => ({ ...prev, [engine]: true }));

      return fetch(`/api/getSources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, engine }),
      })
        .then((res) => res.json())
        .then((resp) => {
          setSourcesMap((prev) => ({ ...prev, [engine]: resp.data }));
          newSourcesMap[engine] = resp.data;
        })
        .catch((error) => {
          console.error(`Error fetching data from ${engine}:`, error);
          setSourcesMap((prev) => ({ ...prev, [engine]: [] }));
          newSourcesMap[engine] = [];
        })
        .finally(() => {
          setLoadingMap((prev) => ({ ...prev, [engine]: false }));
        });
    },
    []
  );

  const fetchSources = useCallback(
    async (question: string) => {
      setShowAnswerMap({
        exa: false,
        serper: false,
        jina: false,
        tavily: false,
      });
      setAnswersMap({ exa: "", serper: "", jina: "", tavily: "" });
      setActiveKey(["exa", "serper", "jina", "tavily"]);

      const newSourcesMap: Partial<Record<SearchEngine, Source[]>> = {};
      const requests = SEARCH_ENGINE.map((engine) =>
        fetchSource(question, engine, newSourcesMap)
      );

      await Promise.all(requests);

      const key = await addRecord(question, newSourcesMap);
      await fetchRecords();
      updateSearchParams("record", key);
    },
    [updateSearchParams, fetchSource]
  );

  const fetchAnswer = async (engine: SearchEngine) => {
    const response = await fetch(`/api/getAnswer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, sources: sourcesMap[engine] }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    if (response.status === 202) {
      const fullAnswer = await response.text();
      setAnswersMap((prev) => ({ ...prev, [engine]: fullAnswer }));

      if (recordParam) {
        updateRecordAnswer(recordParam, engine, fullAnswer);
        fetchRecords();
      }
      return;
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        const data = event.data;
        try {
          const text = JSON.parse(data).text ?? "";
          setAnswersMap((prev) => ({
            ...prev,
            [engine]: (prev[engine] || "") + text,
          }));
          streamingAnswerRef.current[engine] =
            (streamingAnswerRef.current[engine] || "") + text;
        } catch (e) {
          console.error(e);
        }
      }
    };

    // https://web.dev/streams/#the-getreader-and-read-methods
    const reader = data.getReader();
    const decoder = new TextDecoder();
    const parser = createParser(onParse);
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }

    if (done && recordParam && streamingAnswerRef.current[engine]) {
      updateRecordAnswer(
        recordParam,
        engine,
        streamingAnswerRef.current[engine]
      );
      fetchRecords();
      streamingAnswerRef.current[engine] = "";
    }
  };

  const fetchSourceAndUpdateRecord = async (engine: SearchEngine) => {
    const newSourcesMap: Partial<Record<SearchEngine, Source[]>> = {};
    await fetchSource(question, engine, newSourcesMap);

    if (newSourcesMap[engine]) {
      updateRecordSources(recordParam, engine, newSourcesMap[engine]);
      fetchRecords();
    }
  };

  async function fetchRecords(init = false) {
    const records = await getRecords();
    setRecordList(records);

    if (init) {
      setInitRecordList(records);
    }
  }

  useEffect(() => {
    if (initRef.current) return;

    function initUseQuestion(q: string) {
      setQuestion(q);
      fetchSources(q);
      initRef.current = true;
    }

    function initUseRecord(r: HistoryItem) {
      setQuestion(r.question);
      setSourcesMap(r.sources);
      setAnswersMap(r.answers);
      setActiveKey(["exa", "serper", "jina", "tavily"]);
      initRef.current = true;
    }

    if (!initRecordParam && initQuestionParam) {
      initUseQuestion(initQuestionParam);
    } else if (initRecordParam && initRecordList) {
      const record = initRecordList.find((r) => r.id === initRecordParam);
      if (record) {
        initUseRecord(record);
      } else if (initQuestionParam) {
        initUseQuestion(initQuestionParam);
      }
    }
  }, [fetchSources, initQuestionParam, initRecordParam, initRecordList]);

  useEffect(() => {
    if (recordParam && recordParam !== prevRecordParam) {
      const record = recordList.find((r) => r.id === recordParam);
      if (record) {
        setQuestion(record.question);
        updateSearchParams("q", record.question);
        setSourcesMap(record.sources);
        setAnswersMap(record.answers);
      }
    }
  }, [recordParam, recordList, updateSearchParams, prevRecordParam]);

  useEffect(() => {
    fetchRecords(true);
  }, []);

  return (
    <div className={styles.page}>
      <ResponsiveSider>
        <Menu
          className={styles.menu}
          mode="inline"
          items={
            recordList.map(({ id, question, createTime }) => ({
              key: id,
              label: (
                <Tooltip
                  title={`${question}（${createTime}）`}
                  placement="right"
                >
                  {question}（{createTime}）
                </Tooltip>
              ),
            })) ?? []
          }
          onClick={({ key }) => {
            updateSearchParams("record", key);
          }}
          selectedKeys={[recordParam]}
        />
      </ResponsiveSider>
      <div className={styles.main}>
        <h2
          className={styles.title}
          onClick={() => {
            replace(pathname);
            setSourcesMap({});
            setQuestion("");
            setActiveKey([]);
            setAnswersMap({});
          }}
        >
          AI Search Compare
        </h2>
        <Search
          size="large"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onSearch={(value) => {
            updateSearchParams("q", value);
            setQuestion(value);
            fetchSources(value);
          }}
          className={styles.search}
          placeholder="Ask anything..."
        />
        <DragCollapse
          activeKey={activeKey}
          onChange={setActiveKey}
          items={SEARCH_ENGINE.map((engine) => ({
            id: engine,
            key: engine,
            label: engine,
            extra: (
              <>
                <Button
                  disabled={loadingMap[engine] || !question}
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchSourceAndUpdateRecord(engine);
                  }}
                  type="text"
                  style={{ marginRight: 10 }}
                  size="small"
                >
                  Re Search
                </Button>
                <Button
                  disabled={
                    !sourcesMap[engine] ||
                    sourcesMap[engine].length === 0 ||
                    loadingMap[engine]
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchAnswer(engine);
                    setShowAnswerMap((prev) => ({ ...prev, [engine]: true }));
                    setAnswersMap((prev) => ({ ...prev, [engine]: "" }));
                  }}
                  type="text"
                  style={{ marginRight: 10 }}
                  size="small"
                >
                  Re Answer
                </Button>
              </>
            ),
            children: (
              <>
                <SourcePanel
                  key="source"
                  sources={sourcesMap[engine]}
                  loading={loadingMap[engine]}
                />
                {sourcesMap[engine] && sourcesMap[engine].length > 0 && (
                  <Collapse
                    ghost
                    items={[
                      {
                        key: "answer",
                        id: "answer",
                        label: "Answer",
                        children: <AnswerPanel answer={answersMap[engine]} />,
                        extra: answersMap[engine] && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(
                                answersMap[engine]!.trim()
                              );
                              message.success("Answer copied to clipboard");
                            }}
                            type="text"
                          >
                            <CopyOutlined />
                          </Button>
                        ),
                      },
                    ]}
                    activeKey={showAnswerMap[engine] ? ["answer"] : undefined}
                    onChange={(keys) => {
                      const active = keys.includes("answer");
                      setShowAnswerMap((prev) => ({
                        ...prev,
                        [engine]: active,
                      }));
                      if (active && !answersMap[engine]) {
                        fetchAnswer(engine);
                      }
                    }}
                    className={styles.answerCollapse}
                  />
                )}
              </>
            ),
          }))}
        />
      </div>
    </div>
  );
}
