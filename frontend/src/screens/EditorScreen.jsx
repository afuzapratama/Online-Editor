import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
// PERBAIKAN: Hapus 'auth' dari import karena sudah tidak digunakan di sini
import { Modal, InputDialog, ConfirmDialog } from "../components/Modal";
import { ContextMenu } from "../components/ContextMenu";
import { FileTree } from "../components/FileTree";
import { ConsolePanel } from "../components/ConsolePanel";
import { EditorWelcomeScreen } from "../components/WelcomeScreen";
import { DiHtml5, DiCss3, DiJavascript1 } from "react-icons/di";
import { FaFolder, FaRegFileAlt, FaPencilAlt, FaPlay } from "react-icons/fa";
import { apiRequest } from "../utils/api";
import { useFileManager } from "../hooks/useFileManager";

const FileIcon = ({ fileName }) => {
  const extension = fileName.split(".").pop();
  switch (extension) {
    case "html":
      return <DiHtml5 size="1.2em" className="text-orange-500" />;
    case "css":
      return <DiCss3 size="1.2em" className="text-blue-500" />;
    case "js":
      return <DiJavascript1 size="1.2em" className="text-yellow-400" />;
    default:
      return <FaRegFileAlt className="text-gray-400" />;
  }
};

export const EditorScreen = ({
  user,
  onSignOut,
  onUpdateProfile,
  isAdmin,
  onGoToAdmin,
}) => {
  const {
    fileTree,
    openTabs,
    activeTabPath,
    setActiveTabPath,
    fileContents,
    dirtyFiles,
    setDirtyFiles,
    handleFileClick,
    handleEditorChange,
    closeTabAction,
    showApiResult,
    fetchFileTree,
  } = useFileManager(user);

  const [isRunLoading, setIsRunLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: null, props: {} });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  });
  const [consoleMessages, setConsoleMessages] = useState([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (dirtyFiles.size > 0) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirtyFiles]);

  const handleRunScript = (scriptContent) => {
    if (!scriptContent) {
      toast.error("Tidak ada kode untuk dijalankan.");
      return;
    }
    setConsoleMessages([]);
    setIsConsoleOpen(true);

    const tempConsole = {
      log: (...args) =>
        setConsoleMessages((prev) => [
          ...prev,
          {
            type: "log",
            message: args.map((arg) => JSON.stringify(arg, null, 2)).join(" "),
          },
        ]),
      error: (...args) =>
        setConsoleMessages((prev) => [
          ...prev,
          {
            type: "error",
            message: args
              .map((arg) => arg.stack || JSON.stringify(arg, null, 2))
              .join(" "),
          },
        ]),
      warn: (...args) =>
        setConsoleMessages((prev) => [
          ...prev,
          {
            type: "warn",
            message: args.map((arg) => JSON.stringify(arg, null, 2)).join(" "),
          },
        ]),
    };

    try {
      const originalConsole = window.console;
      window.console = tempConsole;
      new Function(scriptContent)();
      window.console = originalConsole;
    } catch (error) {
      tempConsole.error(error);
    }
  };

  const handleCloseTab = (e, path) => {
    e.stopPropagation();
    if (dirtyFiles.has(path)) {
      setModal({
        isOpen: true,
        type: "confirm",
        props: {
          title: "Perubahan Belum Disimpan",
          message: `File "${
            openTabs.find((t) => t.path === path)?.name
          }" memiliki perubahan yang belum disimpan. Tetap tutup?`,
          onCancel: () => setModal({ isOpen: false }),
          onConfirm: () => {
            closeTabAction(path);
            setModal({ isOpen: false });
          },
        },
      });
    } else {
      closeTabAction(path);
    }
  };

  const handleCreateFile = (parentPath = "") =>
    setModal({
      isOpen: true,
      type: "input",
      props: {
        title: "Buat File Baru",
        onCancel: () => setModal({ isOpen: false }),
        onConfirm: (fileName) => {
          if (!fileName) return;
          const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;
          const promise = apiRequest("/create-file", "POST", {
            path: fullPath,
          });
          showApiResult(promise, {
            loading: "Membuat file...",
            success: `File ${fileName} dibuat!`,
          });
          setModal({ isOpen: false });
        },
      },
    });
  const handleCreateFolder = (parentPath = "") =>
    setModal({
      isOpen: true,
      type: "input",
      props: {
        title: "Buat Folder Baru",
        onCancel: () => setModal({ isOpen: false }),
        onConfirm: (folderName) => {
          if (!folderName) return;
          const fullPath = parentPath
            ? `${parentPath}/${folderName}`
            : folderName;
          const promise = apiRequest("/create-folder", "POST", {
            path: fullPath,
          });
          showApiResult(promise, {
            loading: "Membuat folder...",
            success: `Folder ${folderName} dibuat!`,
          });
          setModal({ isOpen: false });
        },
      },
    });
  const handleFileDelete = (file) =>
    setModal({
      isOpen: true,
      type: "confirm",
      props: {
        title: "Hapus File",
        message: `Apakah Anda yakin ingin menghapus file "${file.name}"?`,
        onCancel: () => setModal({ isOpen: false }),
        onConfirm: () => {
          const promise = apiRequest("/delete-file", "DELETE", {
            path: file.path,
          });
          showApiResult(
            promise,
            {
              loading: "Menghapus file...",
              success: `File ${file.name} dihapus!`,
            },
            () => closeTabAction(file.path)
          );
          setModal({ isOpen: false });
        },
      },
    });
  const handleFolderDelete = (folder) =>
    setModal({
      isOpen: true,
      type: "confirm",
      props: {
        title: "Hapus Folder",
        message: `PERINGATAN: Anda akan menghapus folder "${folder.name}" dan SEMUA ISINYA. Lanjutkan?`,
        onCancel: () => setModal({ isOpen: false }),
        onConfirm: () => {
          const promise = apiRequest("/delete-folder", "DELETE", {
            path: folder.path,
          });
          showApiResult(
            promise,
            {
              loading: "Menghapus folder...",
              success: `Folder ${folder.name} dihapus!`,
            },
            () => fetchFileTree()
          );
          setModal({ isOpen: false });
        },
      },
    });
  const handleSave = () => {
    if (!activeTabPath) return;
    const promise = apiRequest("/save-file", "POST", {
      path: activeTabPath,
      content: fileContents[activeTabPath],
    });
    showApiResult(
      promise,
      { loading: "Menyimpan...", success: "File berhasil disimpan!" },
      () => {
        setDirtyFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(activeTabPath);
          return newSet;
        });
      }
    );
  };
  const handleRun = async () => {
    setIsRunLoading(true);
    try {
      const data = await apiRequest("/run", "POST");
      if (data.url) {
        window.open(window.location.origin + data.url, "_blank");
      } else if (data.message) {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsRunLoading(false);
    }
  };
  const handleRename = (item) => {
    setModal({
      isOpen: true,
      type: "input",
      props: {
        title: `Ganti Nama ${item.name}`,
        initialValue: item.name,
        onCancel: () => setModal({ isOpen: false }),
        onConfirm: (newName) => {
          if (!newName || item.name === newName) {
            setModal({ isOpen: false });
            return;
          }
          const promise = apiRequest("/rename", "POST", {
            oldPath: item.path,
            newName,
          });
          showApiResult(
            promise,
            { loading: "Mengganti nama...", success: "Berhasil diganti nama!" },
            () => fetchFileTree()
          );
          setModal({ isOpen: false });
        },
      },
    });
  };

  const handleContextMenu = (event, item) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      item: item,
    });
  };
  const buildContextMenuItems = () => {
    const { item } = contextMenu;
    if (!item) return [];
    let items = [];

    if (item.type === "file" && item.name.endsWith(".js")) {
      items.push({
        label: "Jalankan JavaScript",
        onClick: () => handleRunScript(fileContents[item.path]),
      });
    }

    if (item.type === "folder") {
      items.push({
        label: "Buat File Baru...",
        onClick: () => handleCreateFile(item.path),
      });
      items.push({
        label: "Buat Folder Baru...",
        onClick: () => handleCreateFolder(item.path),
      });
    }
    items.push({ label: "Ganti Nama...", onClick: () => handleRename(item) });
    items.push({
      label: "Hapus",
      onClick: () =>
        item.type === "file"
          ? handleFileDelete(item)
          : handleFolderDelete(item),
    });
    return items;
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addAction({
      id: "select-all",
      label: "Pilih Semua (Select All)",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: (ed) => {
        const model = ed.getModel();
        if (model) {
          ed.setSelection(model.getFullModelRange());
        }
      },
    });
    editor.addAction({
      id: "copy-selection",
      label: "Salin Pilihan (Copy)",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.6,
      run: (ed) => {
        if (!ed.getSelection().isEmpty()) {
          ed.focus();
          document.execCommand("copy");
          toast.success("Teks disalin ke clipboard!");
        } else {
          toast("Tidak ada teks yang dipilih.", { icon: "ℹ️" });
        }
      },
    });
  };
  const baseButtonClass =
    "px-4 py-2 rounded text-white font-semibold focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors text-sm";

  return (
    <div className="w-screen h-screen bg-gray-900 text-gray-300 font-sans flex overflow-hidden">
      {modal.isOpen && modal.type === "input" && (
        <InputDialog {...modal.props} />
      )}
      {modal.isOpen && modal.type === "confirm" && (
        <ConfirmDialog {...modal.props} />
      )}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildContextMenuItems()}
          onClose={() => setContextMenu({ visible: false })}
        />
      )}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <div
        className={` absolute top-0 left-0 h-full z-20 w-64 bg-gray-800 p-3 border-r border-gray-700 overflow-y-auto flex flex-col transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 `}
      >
        <div className="flex justify-between items-center mb-2">
          {" "}
          <h3 className="text-lg font-bold">File Explorer</h3>{" "}
          <button
            className="md:hidden text-2xl text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            &times;
          </button>{" "}
        </div>
        <div className="flex gap-2 mb-2">
          {" "}
          <button
            onClick={() => handleCreateFile()}
            className={`${baseButtonClass} flex-1 bg-blue-600 hover:bg-blue-500 focus:ring-blue-400`}
          >
            Buat File
          </button>{" "}
          <button
            onClick={() => handleCreateFolder()}
            className={`${baseButtonClass} flex-1 bg-yellow-600 hover:bg-yellow-500 focus:ring-yellow-400`}
          >
            Buat Folder
          </button>{" "}
        </div>
        <hr className="border-gray-700 mb-2" />
        <div className="flex-grow">
          {" "}
          <FileTree
            tree={fileTree}
            onFileClick={handleFileClick}
            onContextMenu={handleContextMenu}
            activePath={activeTabPath}
          />{" "}
        </div>
        <div className="mt-auto pt-2 border-t border-gray-700">
          {isAdmin && (
            <button
              onClick={onGoToAdmin}
              className={`${baseButtonClass} w-full mb-2 bg-purple-600 hover:bg-purple-500 focus:ring-purple-400`}
            >
              Dashboard Admin
            </button>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src={user.photoURL}
                alt="User"
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <span className="text-sm font-medium truncate">
                {user.displayName}
              </span>
            </div>
            <button
              onClick={onUpdateProfile}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white flex-shrink-0"
            >
              <FaPencilAlt />
            </button>
          </div>
          <button
            onClick={onSignOut}
            className={`${baseButtonClass} w-full mt-2 bg-red-600 hover:bg-red-500 focus:ring-red-400`}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-gray-700 p-2 flex items-center gap-3">
          <button
            className="md:hidden p-1 text-white text-2xl"
            onClick={() => setIsSidebarOpen(true)}
          >
            {" "}
            &#9776;{" "}
          </button>
          <button
            onClick={handleSave}
            disabled={!activeTabPath}
            className={`${baseButtonClass} bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-400 disabled:bg-gray-500 disabled:cursor-not-allowed`}
          >
            Save File
          </button>
          <button
            onClick={handleRun}
            disabled={isRunLoading}
            className={`${baseButtonClass} bg-green-600 hover:bg-green-500 focus:ring-green-400 disabled:bg-gray-500 disabled:cursor-not-allowed`}
          >
            {" "}
            {isRunLoading ? "Running..." : "Run Project"}{" "}
          </button>
          {activeTabPath && activeTabPath.endsWith(".js") && (
            <button
              onClick={() => handleRunScript(fileContents[activeTabPath])}
              className={`${baseButtonClass} bg-blue-500 hover:bg-blue-400 focus:ring-blue-300 flex items-center gap-2`}
              title="Jalankan Script JavaScript Ini"
            >
              <FaPlay /> <span>Run Script</span>
            </button>
          )}
        </div>
        <div
          className={`bg-gray-900 flex overflow-x-auto flex-nowrap ${
            openTabs.length > 0 ? "min-h-[40px]" : "h-0"
          } transition-all duration-200`}
        >
          {" "}
          {openTabs.map((tab) => {
            const isDirty = dirtyFiles.has(tab.path);
            return (
              <div
                key={tab.path}
                onClick={() => setActiveTabPath(tab.path)}
                className={`flex items-center cursor-pointer py-2 px-4 text-sm whitespace-nowrap border-r border-gray-800 ${
                  activeTabPath === tab.path
                    ? "bg-gray-700 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span className="mr-2 flex-shrink-0">
                  <FileIcon fileName={tab.name} />
                </span>
                <span>{tab.name}</span>
                <button
                  onClick={(e) => handleCloseTab(e, tab.path)}
                  className="ml-3 text-gray-500 hover:text-white rounded-full hover:bg-gray-600 w-5 h-5 flex items-center justify-center"
                >
                  {" "}
                  {isDirty ? "●" : "×"}{" "}
                </button>{" "}
              </div>
            );
          })}{" "}
        </div>

        <div className="flex-grow flex flex-col relative min-h-0">
          <div className="flex-grow relative min-h-0">
            {activeTabPath ? (
              <Editor
                height="100%"
                width="100%"
                path={activeTabPath}
                value={fileContents[activeTabPath] || ""}
                theme="vs-dark"
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 14,
                  padding: { top: 15 },
                  minimap: { enabled: false },
                  wordWrap: "on",
                  lineNumbersMinChars: 3,
                  glyphMargin: false,
                }}
              />
            ) : (
              <EditorWelcomeScreen />
            )}
          </div>
          <ConsolePanel
            messages={consoleMessages}
            onClear={() => setConsoleMessages([])}
            isOpen={isConsoleOpen}
            setIsOpen={setIsConsoleOpen}
          />
        </div>
      </div>
    </div>
  );
};
