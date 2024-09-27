import React from "react";
import { Card, Col, Row, Skeleton } from "antd";
import Image from "next/image";
import styles from "./index.module.css";
import { Source } from "@/app/types";

export interface SourcePanelProps {
  sources?: Source[];
  loading?: boolean;
  sourceCount: number;
}

const SourcePanel = ({
  sources,
  loading,
  sourceCount,
}: SourcePanelProps) => {
  const renderLoading = () => {
    return Array.from({ length: sourceCount }).map((_, index) => (
      <Col key={index} xs={24} sm={12} md={8} lg={6}>
        <Card className={styles.card} hoverable>
          <Skeleton active paragraph={{ rows: 1, width: "100%" }} />
        </Card>
      </Col>
    ));
  };

  const renderContent = (sources: Source[]) => {
    return sources.map(({ title, url }, index) => (
      <Col key={index} xs={24} sm={12} md={8} lg={6}>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Card hoverable={!loading} className={styles.card}>
            <Card.Meta
              title={title}
              description={
                <>
                  <Image
                    unoptimized
                    src={`https://www.google.com/s2/favicons?domain=${url}&sz=128`}
                    alt={url}
                    width={16}
                    height={16}
                  />
                  <span>{new URL(url).hostname}</span>
                </>
              }
            />
          </Card>
        </a>
      </Col>
    ));
  };

  return (
    <div className={styles.container}>
      {loading || (sources && sources.length > 0) ? (
        <Row gutter={[16, 16]}>
          {loading ? renderLoading() : renderContent(sources as Source[])}
        </Row>
      ) : !sources ? (
        "No sources found. Please search for something."
      ) : (
        "No sources found. Please try again."
      )}
    </div>
  );
};

export default SourcePanel;
