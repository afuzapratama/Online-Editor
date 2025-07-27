import React, { useState } from 'react';

// PERBAIKAN: Hapus properti `onClick={onClose}` dari div terluar (overlay).
// Ini akan mencegah modal tertutup saat area abu-abu di luarnya diklik.
// Penutupan modal sekarang hanya dikontrol oleh tombol di dalamnya.
export const Modal = ({ children }) => (
  <div 
    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
  >
    <div 
      className="bg-gray-800 text-gray-200 p-5 rounded-lg shadow-xl w-11/12 max-w-md"
      onClick={e => e.stopPropagation()} // Mencegah klik di dalam modal menyebar ke luar
    >
      {children}
    </div>
  </div>
);

export const InputDialog = ({ title, onConfirm, onCancel, initialValue = '' }) => {
  const [inputValue, setInputValue] = useState(initialValue);
  return (
    <Modal onClose={onCancel}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <input 
        type="text" 
        className="w-full p-2 mb-4 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        autoFocus
        onFocus={(e) => e.target.select()}
      />
      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white" onClick={onCancel}>Batal</button>
        <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white" onClick={() => onConfirm(inputValue)}>OK</button>
      </div>
    </Modal>
  );
};

export const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => (
  <Modal onClose={onCancel}>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-400 mb-4">{message}</p>
    <div className="flex justify-end gap-3">
      <button className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white" onClick={onCancel}>Tidak</button>
      <button className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white" onClick={onConfirm}>Ya, Lanjutkan</button>
    </div>
  </Modal>
);
