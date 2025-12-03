import React, { useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getFieldTypeInfo } from '../../../config/fieldTypes';

const ItemType = 'FIELD';

const DraggableFieldItem = ({ field, index, onMove, onEdit, onDelete }) => {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: ItemType,
    hover(item, monitor) {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;
      
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: () => ({ id: field.fieldId, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));
  const fieldInfo = getFieldTypeInfo(field.type);

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm mb-2"
    >
      <div className="flex items-center">
        <span className="cursor-move pr-4 text-gray-400 hover:text-gray-600">
          &#x2630; {/* Drag handle icon */}
        </span>
        <span className="font-mono text-xs bg-gray-100 text-gray-600 rounded px-2 py-1 mr-3">
            {fieldInfo.label}
        </span>
        <strong className="text-gray-800">{field.label}</strong>
        {field.required && <span className="text-red-500 text-xs ml-2">*必填</span>}
      </div>
      <div className="flex items-center space-x-3">
         <div className="text-xs text-gray-400">
            ID: {field.fieldId}
         </div>
         <button onClick={() => onEdit(field)} className="text-sm text-indigo-600 hover:text-indigo-800">編輯</button>
         <button onClick={() => onDelete(field.fieldId)} className="text-sm text-red-600 hover:text-red-800">刪除</button>
      </div>
    </div>
  );
};

const DraggableFieldListComponent = ({ fields, onReorder, onEdit, onDelete }) => {
  const moveField = (dragIndex, hoverIndex) => {
    onReorder(dragIndex, hoverIndex);
  };

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <DraggableFieldItem
          key={field.fieldId}
          index={index}
          field={field}
          onMove={moveField}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {fields.length === 0 && (
        <div className="text-center py-6 px-4 border-2 border-dashed border-gray-300 rounded-md">
            <p className="text-gray-500">尚未配置任何欄位。</p>
            <p className="text-sm text-gray-400">點擊「新增欄位」開始。</p>
        </div>
      )}
    </div>
  );
};


// Wrap the component with DndProvider
const DraggableFieldList = (props) => (
    <DndProvider backend={HTML5Backend}>
        <DraggableFieldListComponent {...props} />
    </DndProvider>
);


export default DraggableFieldList;
