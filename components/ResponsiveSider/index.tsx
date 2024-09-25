import React, { useState, useEffect, PropsWithChildren } from "react";
import styles from "./index.module.css";
import { Button } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

interface ResponsiveSiderProps {}

const ResponsiveSider = ({
  children,
}: PropsWithChildren<ResponsiveSiderProps>) => {
  const [isCollapsed, setIsCollapsed] = useState(false); // 控制菜单的展开/收起
  const [isSmallScreen, setIsSmallScreen] = useState(false); // 判断是否是小屏

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSmallScreen(true);
        setIsCollapsed(true); // 小屏时默认收起
      } else {
        setIsSmallScreen(false);
        setIsCollapsed(false); // 大屏时默认展开
      }
    };

    handleResize(); // 初始化检查屏幕宽度
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 切换菜单的展开与收起
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
