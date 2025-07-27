import React from 'react';

export const LoginScreen = ({ onSignIn }) => (
  <div className="w-screen h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
    <h1 className="text-4xl font-bold mb-2">Selamat Datang di Editor Online</h1>
    <p className="text-gray-400 mb-8">Silakan masuk untuk memulai proyek Anda.</p>
    <button 
      onClick={onSignIn}
      className="flex items-center gap-3 px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition-colors"
    >
      <svg className="w-6 h-6" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.9 0 6.8 1.6 8.4 3.2l6.3-6.3C34.9 2.8 30 .5 24 .5 14.9.5 7.7 6.1 4.4 14.5l7.4 5.8C13.4 14.5 18.2 9.5 24 9.5z"></path><path fill="#34A853" d="M46.2 25.4c0-1.7-.2-3.4-.5-5H24v9.3h12.5c-.5 3-2.1 5.6-4.6 7.3l7.4 5.8c4.3-4 6.9-10 6.9-17.4z"></path><path fill="#FBBC05" d="M11.8 20.3C11.3 18.8 11 17.2 11 15.5s.3-3.3.8-4.8l-7.4-5.8C1.5 8.8.5 12 .5 15.5s1 6.7 4.4 10.6l7.4-5.8z"></path><path fill="#EA4335" d="M24 47.5c5.9 0 10.9-2 14.5-5.4l-7.4-5.8c-2 1.3-4.5 2.1-7.1 2.1-5.8 0-10.6-5-12.2-11.5l-7.4 5.8C7.7 41.9 14.9 47.5 24 47.5z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
      Masuk dengan Google
    </button>
  </div>
);
