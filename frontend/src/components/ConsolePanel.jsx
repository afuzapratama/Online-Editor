import React from 'react';
import { FaChevronUp, FaChevronDown, FaTrash } from 'react-icons/fa';

export const ConsolePanel = ({ messages, onClear, isOpen, setIsOpen }) => {
  const getMessageColor = (type) => {
    if (type === 'error') return 'text-red-400';
    if (type === 'warn') return 'text-yellow-400';
    return 'text-gray-300';
  };

  return (
    <div className={`bg-gray-800 border-t-2 border-gray-700 transition-all duration-300 ease-in-out ${isOpen ? 'h-1/3' : 'h-10'} flex flex-col flex-shrink-0`}>
      <div 
        className="flex justify-between items-center p-2 cursor-pointer bg-gray-700 hover:bg-gray-600 flex-shrink-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-semibold text-sm">Konsol</h3>
        <div className="flex items-center gap-4">
          <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-gray-400 hover:text-white" title="Bersihkan Konsol">
            <FaTrash />
          </button>
          {isOpen ? <FaChevronDown /> : <FaChevronUp />}
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-2 font-mono text-xs">
        {messages.map((msg, index) => (
          <div key={index} className={`whitespace-pre-wrap ${getMessageColor(msg.type)}`}>
            {'>'} {msg.message}
          </div>
        ))}
         {messages.length === 0 && <div className="text-gray-500">{'>'} Output konsol akan muncul di sini...</div>}
      </div>
    </div>
  );
};
