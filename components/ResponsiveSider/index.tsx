import React, { useState, useEffect, PropsWithChildren } from "react";
import styles from "./index.module.css";
import { Button } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ResponsiveSiderProps {}

const ResponsiveSider = ({
  children,
}: PropsWithChildren<ResponsiveSiderProps>) => {
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      <Button
        onClick={toggleMenu}
        className={styles.toggleButton}
        icon={isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      />
      {!isCollapsed && children}
    </div>
  );
};

export default ResponsiveSider;
