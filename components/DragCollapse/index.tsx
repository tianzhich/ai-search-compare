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

interface DragCollapseProps extends CollapseProps {
  items: (NonNullable<CollapseProps["items"]>[number] & {
    id: string;
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

    setOrder(reorderedItems.map((i) => i.id));
  };

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
              const { id } = item;
              const active = activeKey.includes(id);

              return (
                <Draggable key={id} draggableId={id} index={index}>
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
                              <DragOutlined {...provided.dragHandleProps} />
                            ),
                          },
                        ]}
                        defaultActiveKey={active ? [id] : []}
                        onChange={() => {
                          const newActiveKeys = active
                            ? activeKey.filter((key) => key !== id)
                            : [...activeKey, id];
                          onChange?.(newActiveKeys as string[]);
                        }}
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
