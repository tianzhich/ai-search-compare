import React from "react";
import { Card, Col, Row, Skeleton } from "antd";
import Image from "next/image";
import styles from "./index.module.css";
import { Source } from "@/app/types";

export interface SourcePanelProps {
  sources: Source[];
  loading?: boolean;
}

const SourcePanel = ({ sources, loading }: SourcePanelProps) => {
  const renderLoading = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <Col key={index} xs={24} sm={12} md={8} lg={6}>
        <Card className={styles.card} hoverable>
          <Skeleton active paragraph={{ rows: 1, width: "100%" }} />
        </Card>
      </Col>
    ));
  };

  const renderContent = () => {
    return sources.map(({ favIcon, title, url }, index) => (
      <Col key={index} xs={24} sm={12} md={8} lg={6}>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Card hoverable={!loading} className={styles.card}>
            {favIcon && (
              <Image alt="favicon" src={favIcon} className={styles.favicon} />
            )}
            <Card.Meta title={title} description={new URL(url).hostname} />
          </Card>
        </a>
      </Col>
    ));
  };

  return (
    <div className={styles.container}>
      <Row gutter={[16, 16]}>{loading ? renderLoading() : renderContent()}</Row>
    </div>
  );
};

export default SourcePanel;
