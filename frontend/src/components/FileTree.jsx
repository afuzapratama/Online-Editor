import React, { useRef } from 'react';
import { DiHtml5, DiCss3, DiJavascript1 } from 'react-icons/di';
import { FaFolder, FaRegFileAlt } from 'react-icons/fa';

const FileIcon = ({ fileName }) => {
  const extension = fileName.split('.').pop();
  switch (extension) {
    case 'html': return <DiHtml5 size="1.2em" className="text-orange-500" />;
    case 'css': return <DiCss3 size="1.2em" className="text-blue-500" />;
    case 'js': return <DiJavascript1 size="1.2em" className="text-yellow-400" />;
    default: return <FaRegFileAlt className="text-gray-400" />;
  }
};

export const FileTree = ({ tree, onFileClick, onContextMenu, activePath }) => {
  const longPressTimer = useRef();

  const handleMouseDown = (e, item) => {
    longPressTimer.current = setTimeout(() => {
      onContextMenu(e, item);
    }, 500);
  };

  const handleMouseUp = () => {
    clearTimeout(longPressTimer.current);
  };
  
  return (
    <ul className="list-none pl-4">
      {tree.map((item) => {
        const isActive = item.path === activePath;
        return (
          <li key={item.path}>
            <div 
              className={`flex justify-between items-center py-0.5 group rounded ${isActive ? 'bg-blue-600/30' : ''}`}
              onContextMenu={(e) => onContextMenu(e, item)}
              onTouchStart={(e) => handleMouseDown(e, item)}
              onTouchEnd={handleMouseUp}
            >
              <span 
                className={`cursor-pointer flex-grow hover:bg-gray-700 rounded px-1 flex items-center gap-2 ${isActive ? 'text-white' : ''}`}
                // PERBAIKAN: Hapus parameter 'e' yang tidak terpakai
                onClick={() => { if (item.type === 'file') onFileClick(item) }}
              >
                {item.type === 'folder' ? <FaFolder className="text-yellow-500" /> : <FileIcon fileName={item.name} />}
                {item.name}
              </span>
            </div>
            {item.type === 'folder' && item.children && (
              <FileTree tree={item.children} onFileClick={onFileClick} onContextMenu={onContextMenu} activePath={activePath} />
            )}
          </li>
        );
      })}
    </ul>
  );
};
