import React, { useEffect, useRef } from 'react';

export const ContextMenu = ({ x, y, items, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bg-gray-700 text-white rounded-md shadow-lg py-2 z-50"
      style={{ top: y, left: x }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="px-4 py-2 hover:bg-blue-600 cursor-pointer text-sm"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};