
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquarePlus, 
  Eye, 
  EyeOff, 
  GripVertical, 
  X, 
  Check, 
  Trash2, 
  Edit3, 
  MessageCircle,
  MousePointer2,
  MapPin,
  RotateCcw,
  Code,
  Copy
} from 'lucide-react';
import { Annotation } from '../types';
import { MOCK_ANNOTATIONS } from '../mockData';

interface AnnotationLayerProps {
  viewId: string;
  pageName: string;
}

const STORAGE_KEY = 'system_center_annotations_v2';

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({ viewId, pageName }) => {
  // --- STATE ---
  // Initialize store with robust merging strategy
  const [store, setStore] = useState<Record<string, Annotation[]>>(() => {
    let initialData = { ...MOCK_ANNOTATIONS };
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedData = JSON.parse(saved);
        // Merge saved data with mock data structure to ensure missing keys (new views) are handled
        // LocalStorage takes precedence for existing keys
        initialData = {
          ...MOCK_ANNOTATIONS,
          ...parsedData
        };
      }
    } catch (e) {
      console.error("Failed to load annotations from local storage", e);
    }
    
    return initialData;
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Toolbar Position
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 240, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Creating New Note
  const [pendingPoint, setPendingPoint] = useState<{x: number, y: number} | null>(null);
  const [pendingText, setPendingText] = useState('');

  // Editing Existing Note
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get current view's annotations (safe access)
  const annotations = store[viewId] || [];

  // --- PERSISTENCE ---
  // Save to localStorage whenever store changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.error("Failed to save annotations to local storage", e);
    }
  }, [store]);

  // Helper to update current view's annotations
  const setAnnotations = (newAnnotations: Annotation[]) => {
    setStore(prev => ({
      ...prev,
      [viewId]: newAnnotations
    }));
  };

  // Reset to default mock data
  const handleReset = () => {
    if (confirm('确定要重置所有标注为默认状态吗？您的自定义标注将丢失。')) {
      setStore({ ...MOCK_ANNOTATIONS });
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    setShowExportModal(true);
    setCopied(false);
  };

  const getExportCode = () => {
    return `// 将此代码复制到 src/mockData.ts 文件中，替换原有的 MOCK_ANNOTATIONS 定义
export const MOCK_ANNOTATIONS: Record<string, Annotation[]> = ${JSON.stringify(store, null, 2)};`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getExportCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- DRAGGABLE TOOLBAR LOGIC ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // --- ANNOTATION CREATION LOGIC ---
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isEditMode || pendingPoint || editingId) return;

    // Calculate percentage coordinates to be responsive
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    setPendingPoint({ x, y });
    setPendingText('');
  };

  const saveNewAnnotation = () => {
    if (pendingText.trim() && pendingPoint) {
      const newNote: Annotation = {
        id: Date.now().toString(),
        x: pendingPoint.x,
        y: pendingPoint.y,
        content: pendingText,
        isOpen: true
      };
      // Use functional update to ensure we have the latest state of annotations for this view
      setStore(prev => {
        const currentViewNotes = prev[viewId] || [];
        return {
          ...prev,
          [viewId]: [...currentViewNotes, newNote]
        };
      });
    }
    setPendingPoint(null);
    setPendingText('');
    // Optional: Keep edit mode on for multiple additions
  };

  // --- ANNOTATION MANAGEMENT ---
  const toggleMarkerOpen = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newAnnotations = annotations.map(a => 
      a.id === id ? { ...a, isOpen: !a.isOpen } : { ...a, isOpen: false }
    );
    setAnnotations(newAnnotations);
    setEditingId(null);
  };

  const deleteAnnotation = (id: string) => {
    const newAnnotations = annotations.filter(a => a.id !== id);
    setAnnotations(newAnnotations);
  };

  const startEditing = (note: Annotation) => {
    setEditingId(note.id);
    setEditText(note.content);
  };

  const saveEdit = (id: string) => {
    const newAnnotations = annotations.map(a => 
      a.id === id ? { ...a, content: editText } : a
    );
    setAnnotations(newAnnotations);
    setEditingId(null);
  };

  return (
    <>
      {/* 1. EDIT MODE OVERLAY (Captures Clicks) */}
      {isEditMode && (
        <div 
          onClick={handleCanvasClick}
          className={`fixed inset-0 z-[9000] cursor-crosshair transition-colors duration-200 ${pendingPoint ? 'bg-black/10' : 'bg-transparent'}`}
        >
          {/* Guide Text */}
          {!pendingPoint && (
             <div 
               className="fixed pointer-events-none px-3 py-1.5 bg-slate-800/80 text-white text-xs rounded-full backdrop-blur-sm shadow-lg transform -translate-x-1/2 -translate-y-1/2 mt-[-20px] animate-in fade-in slide-in-from-bottom-2"
               style={{ left: '50%', top: '5%' }}
             >
               点击屏幕任意位置添加备注
             </div>
          )}
        </div>
      )}

      {/* 2. DRAGGABLE TOOLBAR - NEW DESIGN */}
      <div 
        style={{ left: position.x, top: position.y }}
        className="fixed z-[9999] bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center h-12 select-none animate-in fade-in zoom-in duration-300 min-w-[500px]"
      >
        {/* Drag Handle */}
        <div 
          onMouseDown={handleMouseDown}
          className="cursor-move h-full px-3 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors rounded-l-full"
        >
          <GripVertical size={16} />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200"></div>

        {/* Visibility Toggle */}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`flex items-center gap-2 px-4 h-full text-sm transition-colors hover:bg-gray-50
             ${!isVisible ? 'text-slate-400' : 'text-slate-700'}
          `}
        >
          {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{isVisible ? '已显示' : '已隐藏'}</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200"></div>

        {/* Edit Mode Toggle */}
        <button
          onClick={() => {
            setIsEditMode(!isEditMode);
            if (!isEditMode) setIsVisible(true);
          }}
          className={`flex items-center gap-2 px-4 h-full text-sm transition-all hover:bg-gray-50
            ${isEditMode 
              ? 'text-violet-600 bg-violet-50 font-medium' 
              : 'text-slate-700'
            }`}
        >
          <MousePointer2 size={16} className={isEditMode ? "fill-current" : ""} />
          <span>{isEditMode ? '标注中' : '开启标注'}</span>
        </button>

         {/* Divider */}
         <div className="w-px h-6 bg-gray-200"></div>

         {/* Reset Button */}
         <button
            onClick={handleReset}
            className="flex items-center justify-center px-3 h-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="重置为默认数据"
         >
            <RotateCcw size={14} />
         </button>
         
         {/* Divider */}
         <div className="w-px h-6 bg-gray-200"></div>

         {/* Export Button */}
         <button
            onClick={handleExport}
            className="flex items-center justify-center px-3 h-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="保存到代码 (Export)"
         >
            <Code size={16} />
         </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200"></div>

        {/* Page Context Info */}
        <div className="flex items-center gap-2 px-5 h-full text-sm text-slate-500 whitespace-nowrap flex-1 justify-end pr-6">
          <MapPin size={14} />
          <span className="max-w-[120px] truncate">{pageName}</span>
          {annotations.length > 0 && (
             <span className="bg-gray-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-md font-medium min-w-[20px] text-center">
               {annotations.length}
             </span>
          )}
        </div>
      </div>

      {/* 3. EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Code size={20} className="text-blue-600"/> 导出标注配置 (Save to Code)
              </h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                 <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-hidden flex flex-col gap-4 flex-1">
               <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                  <div className="mt-0.5"><MessageSquarePlus size={16} /></div>
                  <div>
                    <div className="font-bold mb-1">如何永久保存我的标注？</div>
                    由于浏览器安全限制，网页无法直接修改源码文件。请点击下方“复制配置代码”按钮，然后将代码粘贴到项目中的 <b>src/mockData.ts</b> 文件，替换原有的 <b>MOCK_ANNOTATIONS</b> 定义。
                  </div>
               </div>
               <div className="relative flex-1 border border-gray-200 rounded-lg overflow-hidden bg-[#1e1e1e] shadow-inner">
                  <textarea 
                     readOnly
                     className="w-full h-full p-4 bg-transparent text-gray-300 font-mono text-xs outline-none resize-none leading-relaxed"
                     value={getExportCode()}
                     spellCheck={false}
                  />
                  <div className="absolute top-2 right-2 text-[10px] text-gray-500 font-mono">TypeScript</div>
               </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
               <button onClick={() => setShowExportModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-200 rounded-lg transition-colors">关闭</button>
               <button 
                 onClick={copyToClipboard} 
                 className={`px-4 py-2 text-sm text-white rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium
                    ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                 `}
               >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? '已复制到剪贴板' : '复制配置代码'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MARKERS & POPOVERS */}
      {isVisible && (
        <div className="fixed inset-0 z-[9001] pointer-events-none overflow-hidden">
          {/* A. EXISTING MARKERS */}
          {annotations.map(note => (
            <div 
              key={note.id}
              style={{ left: `${note.x}%`, top: `${note.y}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
            >
              {/* The Dot Icon */}
              <div className="relative group pointer-events-auto">
                 <button 
                    onClick={(e) => toggleMarkerOpen(note.id, e)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-2
                       ${note.isOpen 
                          ? 'bg-white border-violet-600 text-violet-600 scale-110 z-20' 
                          : 'bg-violet-600 border-white text-white z-10 hover:scale-110'
                       }
                    `}
                 >
                    <MessageCircle size={16} fill="currentColor" />
                 </button>
                 
                 {/* Ripple Effect */}
                 {!note.isOpen && (
                   <div className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-75 -z-10 duration-1000"></div>
                 )}
              </div>

              {/* Detail Popover */}
              {note.isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto animate-in slide-in-from-top-2 fade-in z-30">
                   {editingId === note.id ? (
                      // Edit Mode inside Popover
                      <div className="p-3">
                         <textarea 
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full text-sm p-3 border border-gray-200 rounded-lg mb-2 focus:ring-2 focus:ring-violet-100 focus:border-violet-500 outline-none h-24 resize-none bg-gray-50 text-slate-700"
                            autoFocus
                         />
                         <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-md transition-colors">取消</button>
                            <button onClick={() => saveEdit(note.id)} className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors shadow-sm">保存更新</button>
                         </div>
                      </div>
                   ) : (
                      // View Mode inside Popover
                      <>
                        <div className="p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                           {note.content}
                        </div>
                        <div className="bg-gray-50/80 px-4 py-2 flex justify-between items-center border-t border-gray-100">
                           <span className="text-[10px] text-gray-400 font-medium">刚刚</span>
                           <div className="flex gap-1">
                              <button onClick={() => startEditing(note)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="编辑">
                                 <Edit3 size={14} />
                              </button>
                              <div className="w-px h-4 bg-gray-200 my-auto mx-1"></div>
                              <button onClick={() => deleteAnnotation(note.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="删除">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                      </>
                   )}
                   {/* Arrow */}
                   <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-gray-100 transform rotate-45"></div>
                </div>
              )}
            </div>
          ))}

          {/* B. CREATION POPOVER (Pending) */}
          {pendingPoint && (
             <div 
               style={{ left: `${pendingPoint.x}%`, top: `${pendingPoint.y}%` }}
               className="absolute transform -translate-x-1/2 mt-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200 z-[9002]"
             >
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 flex justify-between items-center">
                   <span className="text-xs font-bold text-white flex items-center gap-2">
                      <MessageSquarePlus size={14} className="text-white/90"/> 新建备注
                   </span>
                   <button onClick={() => setPendingPoint(null)} className="text-white/70 hover:text-white transition-colors">
                      <X size={14} />
                   </button>
                </div>
                <div className="p-4">
                   <textarea 
                      placeholder="请输入备注内容..."
                      className="w-full h-24 text-sm p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-500 outline-none resize-none bg-gray-50 text-slate-700 placeholder:text-slate-400"
                      value={pendingText}
                      onChange={(e) => setPendingText(e.target.value)}
                      autoFocus
                   />
                   <div className="flex justify-end gap-3 mt-4">
                      <button 
                         onClick={() => setPendingPoint(null)}
                         className="px-3 py-1.5 text-xs text-slate-500 hover:bg-gray-100 rounded-md font-medium transition-colors"
                      >
                         取消
                      </button>
                      <button 
                         onClick={saveNewAnnotation}
                         disabled={!pendingText.trim()}
                         className="px-4 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 font-medium flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
                      >
                         <Check size={14} /> 确认保存
                      </button>
                   </div>
                </div>
                {/* Arrow pointing up */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-violet-600 transform rotate-45"></div>
             </div>
          )}
        </div>
      )}
    </>
  );
};
