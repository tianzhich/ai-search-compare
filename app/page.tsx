"use client";
import { Input, Menu } from "antd";
import styles from "./page.module.css";
import DragCollapse from "@/components/DragCollapse";
import ResponsiveSider from "@/components/ResponsiveSider";
import { SearchEngine, Source } from "./types";
import SourcePanel from "@/components/SourcePanel";
import { useState } from "react";

const SEARCH_ENGINE: SearchEngine[] = ["exa", "serper", "jina", "tavily"];
const { Search } = Input;

export default function Home() {
  const [loadingMap, setLoadingMap] = useState<Record<SearchEngine, boolean>>({
    exa: false,
    serper: false,
    jina: false,
    tavily: false,
  });
  const [question, setQuestion] = useState("");
  const [sourcesMap, setSourcesMap] = useState<Record<SearchEngine, Source[]>>({
    exa: [],
    serper: [],
    jina: [],
    tavily: [],
  });

  const [activeKey, setActiveKey] = useState<string[]>([]);

  const fetchSources = async () => {
    const requests = SEARCH_ENGINE.map((engine) => {
      setLoadingMap((prev) => ({ ...prev, [engine]: true }));
      return fetch(`/api/getSources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, engine }),
      })
        .then((res) => res.json())
        .then((res) => {
          setActiveKey((prev) => [...prev, engine]);
          return res.data;
        })
        .finally(() => setLoadingMap((prev) => ({ ...prev, [engine]: false })));
    });

    const responses = await Promise.all(requests);
    const sourcesMap: Record<string, Source[]> = {};
    responses.forEach((sources, index) => {
      sourcesMap[SEARCH_ENGINE[index]] = sources;
    });

    setSourcesMap(sourcesMap);
  };

  return (
    <div className={styles.page}>
      <ResponsiveSider>
        <Menu
          className={styles.menu}
          mode="inline"
          defaultSelectedKeys={["1"]}
          items={[
            { key: "1", label: "Option 1" },
            { key: "2", label: "Option 2" },
            { key: "3", label: "Option 3" },
          ]}
        />
      </ResponsiveSider>
      <div className={styles.main}>
        <Search
          size="large"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onSearch={fetchSources}
          className={styles.search}
          placeholder="Ask anything..."
        />
        <DragCollapse
          activeKey={activeKey}
          onChange={setActiveKey}
          items={SEARCH_ENGINE.map((engine) => ({
            id: engine,
            label: engine,
            children: (
              <SourcePanel
                key="source"
                sources={sourcesMap[engine]}
                loading={loadingMap[engine]}
              />
            ),
          }))}
        />
      </div>
    </div>
  );
}
