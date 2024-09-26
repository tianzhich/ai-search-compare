import React, { FC } from "react";
import styles from "./index.module.css";
import { Skeleton } from "antd";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeExternalLinks from "rehype-external-links";

interface AnswerPanelProps {
  answer?: string;
}

const AnswerPanel: FC<AnswerPanelProps> = ({ answer }) => {
  return (
    <div className={styles.container}>
      {answer ? (
        <div className={styles["markdown-container"]}>
          <Markdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[
              rehypeKatex,
              rehypeRaw,
              [
                rehypeExternalLinks,
                { target: "_blank", rel: "noopener noreferrer" },
              ],
            ]}
          >
            {answer.trim()}
          </Markdown>
        </div>
      ) : (
        <Skeleton />
      )}
    </div>
  );
};

export default AnswerPanel;
