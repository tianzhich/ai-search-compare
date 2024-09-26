import React, { useEffect, useMemo, useState } from "react";
import { Collapse, CollapseProps } from "antd";
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "react-beautiful-dnd";
import styles from "./index.module.css";
import { DragOutlined } from "@ant-design/icons";
import { ENGINE_ORDER_PREF_KEY, getPref, setPref } from "@/utils/storage";

interface DragCollapseProps extends CollapseProps {
  items: (NonNullable<CollapseProps["items"]>[number] & {
    key: string;
  })[];
}

const DragCollapse = ({
  items,
  activeKey: _activeKey,
  onChange,
  ...props
}: DragCollapseProps) => {
  const activeKey = Array.isArray(_activeKey)
    ? _activeKey
    : typeof _activeKey !== "undefined"
    ? [_activeKey]
    : [];
  const [order, setOrder] = useState(items ? items.map((i) => i.id) : []);

  const orderedItems = useMemo(() => {
    return order.map(
      (id) =>
        items.find((i) => i.id === id) as DragCollapseProps["items"][number]
    );
  }, [items, order]);

  const onDragEnd: OnDragEndResponder = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const reorderedItems = Array.from(orderedItems);
    const [removed] = reorderedItems.splice(source.index, 1);
    reorderedItems.splice(destination.index, 0, removed);

    const newOrder = reorderedItems.map((i) => i.id);
    setOrder(newOrder);
    setPref(ENGINE_ORDER_PREF_KEY, newOrder);
  };

  useEffect(() => {
    async function initOrder() {
      const prefOrder = await getPref(ENGINE_ORDER_PREF_KEY);
      if (prefOrder) {
        setOrder(prefOrder as string[]);
      }
    }

    initOrder();
  }, []);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="collapse">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={styles.droppable}
          >
            {orderedItems.map((item, index) => {
              const { key } = item;
              const active = activeKey.includes(key);

              return (
                <Draggable key={key} draggableId={key} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={styles.draggable}
                      style={{
                        ...provided.draggableProps.style,
                        boxShadow: snapshot.isDragging
                          ? "0 2px 8px rgba(0, 0, 0, 0.15)"
                          : "none",
                      }}
                    >
                      <Collapse
                        {...props}
                        items={[
                          {
                            ...item,
                            extra: (
                              <>
                                {item.extra}
                                <DragOutlined {...provided.dragHandleProps} />
                              </>
                            ),
                          },
                        ]}
                        activeKey={active ? key : undefined}
                        onChange={() => {
                          const newActiveKeys = active
                            ? activeKey.filter((k) => k !== key)
                            : [...activeKey, key];
                          onChange?.(newActiveKeys as string[]);
                        }}
                        className={styles.collapse}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DragCollapse;
