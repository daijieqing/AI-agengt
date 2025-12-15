
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
  Copy,
  Database,
  Wifi,
  WifiOff,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Annotation } from '../types';
import { MOCK_ANNOTATIONS } from '../mockData';

// From metadata.json
const PROJECT_NAME = "需求合规行检查定稿+智能体中心";
const API_BASE_URL = '/api/d1/markers'; // Hypothetical Cloudflare Worker Endpoint

interface AnnotationLayerProps {
  viewId: string;
  pageName: string;
}

const STORAGE_KEY = 'system_center_annotations_v2';
type StorageStatus = 'LOCAL' | 'D1_CONNECTING' | 'D1_CONNECTED' | 'D1_ERROR';

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({ viewId, pageName }) => {
  // --- STATE ---
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [status, setStatus] = useState<StorageStatus>('D1_CONNECTING');
  const [lastError, setLastError] = useState<string>('');
  
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

  // --- D1 / STORAGE LOGIC ---

  // Helper: Get data from local storage as fallback
  const getLocalData = (): Annotation[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed[viewId] || MOCK_ANNOTATIONS[viewId] || [];
      }
      return MOCK_ANNOTATIONS[viewId] || [];
    } catch (e) {
      return [];
    }
  };

  // Helper: Save data to local storage as fallback
  const saveLocalData = (newNotes: Annotation[]) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : { ...MOCK_ANNOTATIONS };
      parsed[viewId] = newNotes;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error("Local Save Error", e);
    }
  };

  const fetchMarkers = async () => {
    let isMounted = true;
    setStatus('D1_CONNECTING');
    setLastError('');
    try {
      // Construct query params for isolation
      const params = new URLSearchParams({
        project_name: PROJECT_NAME,
        page_context: viewId
      });
      
      const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
      
      if (!response.ok) {
         // Fix: Read text once to avoid "body stream already read"
         const errorText = await response.text();
         let errMsg = `API Error ${response.status}`;
         try {
            const errJson = JSON.parse(errorText);
            if (errJson.error) errMsg = errJson.error;
            else errMsg += `: ${errorText.substring(0, 50)}...`;
         } catch(e) {
            errMsg += `: ${errorText.substring(0, 50)}...`;
         }
         throw new Error(errMsg);
      }

      const data = await response.json();
      if (isMounted) {
        const loadedAnnotations: Annotation[] = data.map((row: any) => ({
           id: String(row.id),
           x: row.x,
           y: row.y,
           content: row.content,
           author: row.author,
           created_at: row.created_at,
           is_resolved: row.is_resolved,
           project_name: row.project_name,
           page_context: row.page_context,
           isOpen: false 
        }));
        setAnnotations(loadedAnnotations);
        setStatus('D1_CONNECTED');
      }
    } catch (error: any) {
      console.warn("D1 Fetch Failed, falling back to LocalStorage:", error);
      if (isMounted) {
        // Truncate long error messages (like HTML 500 pages)
        const msg = error.message.length > 100 ? error.message.substring(0, 100) + '...' : error.message;
        setLastError(msg);
        setAnnotations(getLocalData());
        setStatus('D1_ERROR');
      }
    }
    return () => { isMounted = false; };
  };

  // 1. Fetch Logic
  useEffect(() => {
    fetchMarkers();
  }, [viewId]);

  // 2. Create Logic
  const handleSaveNewAnnotation = async () => {
    if (pendingText.trim() && pendingPoint) {
      const tempId = Date.now().toString();
      const newNote: Annotation = {
        id: tempId,
        x: pendingPoint.x,
        y: pendingPoint.y,
        content: pendingText,
        isOpen: true,
        author: '张小六', // Mock User
        created_at: new Date().toISOString(),
        is_resolved: 0,
        project_name: PROJECT_NAME,
        page_context: viewId
      };

      // Optimistic UI Update
      setAnnotations(prev => [...prev, newNote]);
      setPendingPoint(null);
      setPendingText('');

      if (status === 'D1_CONNECTED' || status === 'D1_CONNECTING') {
         try {
            const res = await fetch(API_BASE_URL, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  x: newNote.x,
                  y: newNote.y,
                  content: newNote.content,
                  author: newNote.author,
                  created_at: newNote.created_at,
                  is_resolved: newNote.is_resolved,
                  project_name: newNote.project_name,
                  page_context: newNote.page_context
               })
            });
            if (!res.ok) {
                // Fix: Read text once
                const errorText = await res.text();
                let errMsg = `Save Failed ${res.status}`;
                try {
                    const errJson = JSON.parse(errorText);
                    if (errJson.error) errMsg = errJson.error;
                } catch(e) {
                    errMsg += `: ${errorText.substring(0, 50)}...`;
                }
                throw new Error(errMsg);
            }
            
            // If D1 returns the new ID, update the optimistic note
            const savedData = await res.json();
            if (savedData && savedData.id) {
               setAnnotations(prev => prev.map(a => a.id === tempId ? { ...a, id: String(savedData.id) } : a));
            }
         } catch (e: any) {
            console.error("Save to D1 failed", e);
            setStatus('D1_ERROR');
            setLastError(e.message || "Save Failed");
            // Fallback save locally
            saveLocalData([...annotations, newNote]);
         }
      } else {
         saveLocalData([...annotations, newNote]);
      }
    }
  };

  // 3. Delete Logic
  const handleDeleteAnnotation = async (id: string) => {
    // Optimistic Delete
    const prevAnnotations = [...annotations];
    const newAnnotations = annotations.filter(a => a.id !== id);
    setAnnotations(newAnnotations);

    if (status === 'D1_CONNECTED') {
       try {
          await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
       } catch (e: any) {
          console.error("Delete from D1 failed", e);
          setStatus('D1_ERROR');
          setLastError(e.message);
          setAnnotations(prevAnnotations); // Revert
          saveLocalData(newAnnotations); // Fallback
       }
    } else {
       saveLocalData(newAnnotations);
    }
  };

  // 4. Update Logic
  const handleSaveEdit = async (id: string) => {
    const prevAnnotations = [...annotations];
    const newAnnotations = annotations.map(a => 
      a.id === id ? { ...a, content: editText } : a
    );
    setAnnotations(newAnnotations);
    setEditingId(null);

    if (status === 'D1_CONNECTED') {
      try {
         const target = newAnnotations.find(a => a.id === id);
         await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editText, is_resolved: target?.is_resolved })
         });
      } catch (e: any) {
         console.error("Update D1 failed", e);
         setStatus('D1_ERROR');
         setLastError(e.message);
         saveLocalData(newAnnotations);
      }
    } else {
      saveLocalData(newAnnotations);
    }
  };

  const handleReset = () => {
     if (confirm('确定要重置当前页面的标注吗？')) {
        setAnnotations([]);
        if (status !== 'D1_CONNECTED') {
           localStorage.removeItem(STORAGE_KEY);
        }
     }
  };

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    setShowExportModal(true);
    setCopied(false);
  };

  const getExportCode = () => {
    return `// D1 Database Migration Export
// Project: ${PROJECT_NAME}
// Page: ${viewId}
export const ANNOTATIONS = ${JSON.stringify(annotations, null, 2)};`;
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

  // --- INTERACTION LOGIC ---
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isEditMode || pendingPoint || editingId) return;
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    setPendingPoint({ x, y });
    setPendingText('');
  };

  const toggleMarkerOpen = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAnnotations(prev => prev.map(a => 
      a.id === id ? { ...a, isOpen: !a.isOpen } : { ...a, isOpen: false }
    ));
    setEditingId(null);
  };

  const startEditing = (note: Annotation) => {
    setEditingId(note.id);
    setEditText(note.content);
  };

  // Helper to render Status Icon
  const renderStatusIcon = () => {
     switch(status) {
        case 'D1_CONNECTED': 
           return <div title="已连接 Cloudflare D1 数据库" className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold border border-emerald-100"><Database size={12}/><Wifi size={12}/> D1</div>;
        case 'D1_CONNECTING': 
           return <div title="正在连接数据库..." className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold border border-blue-100"><Loader2 size={12} className="animate-spin"/> 连接中</div>;
        case 'D1_ERROR': 
           return <div title={`连接失败: ${lastError}`} className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-bold border border-red-100 max-w-[150px] truncate cursor-help"><AlertTriangle size={12}/> {lastError || 'Error'}</div>;
        case 'LOCAL':
           return <div title="D1 连接失败，使用本地存储" className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs font-bold border border-orange-100"><WifiOff size={12}/> Local</div>;
     }
  };

  return (
    <>
      {/* 1. EDIT MODE OVERLAY */}
      {isEditMode && (
        <div 
          onClick={handleCanvasClick}
          className={`fixed inset-0 z-[9000] cursor-crosshair transition-colors duration-200 ${pendingPoint ? 'bg-black/10' : 'bg-transparent'}`}
        >
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

      {/* 2. DRAGGABLE TOOLBAR */}
      <div 
        style={{ left: position.x, top: position.y }}
        className="fixed z-[9999] bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center h-12 select-none animate-in fade-in zoom-in duration-300 min-w-[500px]"
      >
        <div 
          onMouseDown={handleMouseDown}
          className="cursor-move h-full px-3 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors rounded-l-full"
        >
          <GripVertical size={16} />
        </div>

        <div className="w-px h-6 bg-gray-200"></div>

        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`flex items-center gap-2 px-4 h-full text-sm transition-colors hover:bg-gray-50
             ${!isVisible ? 'text-slate-400' : 'text-slate-700'}
          `}
        >
          {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{isVisible ? '已显示' : '已隐藏'}</span>
        </button>

        <div className="w-px h-6 bg-gray-200"></div>

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

         <div className="w-px h-6 bg-gray-200"></div>

         <button
            onClick={handleReset}
            className="flex items-center justify-center px-3 h-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="清空当前页面标注"
         >
            <RotateCcw size={14} />
         </button>
         
         <div className="w-px h-6 bg-gray-200"></div>

         <button
            onClick={handleExport}
            className={`flex items-center justify-center px-3 h-full transition-colors ${status === 'D1_ERROR' ? 'text-red-500 bg-red-50' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
            title="数据与设置"
         >
            {status === 'D1_ERROR' ? <AlertTriangle size={16}/> : <Code size={16} />}
         </button>

        <div className="w-px h-6 bg-gray-200"></div>

        <div className="flex items-center gap-3 px-5 h-full text-sm text-slate-500 whitespace-nowrap flex-1 justify-end pr-6">
          {/* Storage Status Indicator */}
          {renderStatusIcon()}
          
          <div className="flex items-center gap-1.5 pl-2 border-l border-gray-100">
             <MapPin size={14} />
             <span className="max-w-[100px] truncate">{pageName}</span>
          </div>
        </div>
      </div>

      {/* 3. EXPORT / SETTINGS MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Code size={20} className="text-blue-600"/> 数据与设置
              </h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                 <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-6 flex-1">
               {/* DB STATUS SECTION */}
               <div className={`text-sm p-4 rounded-lg border flex flex-col gap-3
                  ${status === 'D1_ERROR' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}
               `}>
                  <div className="flex items-start gap-3">
                     <div className="mt-0.5">
                        {status === 'D1_ERROR' ? <AlertTriangle size={16} className="text-red-600"/> : <Database size={16} className="text-blue-600"/>}
                     </div>
                     <div className="flex-1">
                       <div className={`font-bold mb-1 ${status === 'D1_ERROR' ? 'text-red-800' : 'text-blue-800'}`}>
                          {status === 'D1_CONNECTED' ? 'D1 数据库已连接' : status === 'D1_ERROR' ? '数据库连接错误' : '连接中...'}
                       </div>
                       <div className="text-slate-600 break-words">
                          {status === 'D1_CONNECTED' && <span>当前正在使用 Cloudflare D1。项目: {PROJECT_NAME}</span>}
                          {status === 'D1_ERROR' && <span className="font-mono text-xs">{lastError}</span>}
                          {status === 'LOCAL' && <span>当前使用本地存储 (Local Storage)</span>}
                       </div>
                     </div>
                  </div>
               </div>

               {/* EXPORT DATA SECTION */}
               <div className="flex-1 flex flex-col">
                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase">导出数据 (JSON)</div>
                  <div className="relative flex-1 border border-gray-200 rounded-lg overflow-hidden bg-[#1e1e1e] shadow-inner min-h-[200px]">
                     <textarea 
                        readOnly
                        className="w-full h-full p-4 bg-transparent text-gray-300 font-mono text-xs outline-none resize-none leading-relaxed"
                        value={getExportCode()}
                        spellCheck={false}
                     />
                     <div className="absolute top-2 right-2 text-[10px] text-gray-500 font-mono">JSON</div>
                  </div>
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
                  {copied ? '已复制' : '复制数据'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MARKERS & POPOVERS */}
      {isVisible && (
        <div className="fixed inset-0 z-[9001] pointer-events-none overflow-hidden">
          {annotations.map(note => (
            <div 
              key={note.id}
              style={{ left: `${note.x}%`, top: `${note.y}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
            >
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
                 {!note.isOpen && (
                   <div className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-75 -z-10 duration-1000"></div>
                 )}
              </div>

              {note.isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto animate-in slide-in-from-top-2 fade-in z-30">
                   {editingId === note.id ? (
                      <div className="p-3">
                         <textarea 
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full text-sm p-3 border border-gray-200 rounded-lg mb-2 focus:ring-2 focus:ring-violet-100 focus:border-violet-500 outline-none h-24 resize-none bg-gray-50 text-slate-700"
                            autoFocus
                         />
                         <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-md transition-colors">取消</button>
                            <button onClick={() => handleSaveEdit(note.id)} className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors shadow-sm">保存更新</button>
                         </div>
                      </div>
                   ) : (
                      <>
                        <div className="p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                           {note.content}
                        </div>
                        <div className="bg-gray-50/80 px-4 py-2 flex justify-between items-center border-t border-gray-100">
                           <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-medium">创建人: {note.author || '未知'}</span>
                           </div>
                           <div className="flex gap-1">
                              <button onClick={() => startEditing(note)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="编辑">
                                 <Edit3 size={14} />
                              </button>
                              <div className="w-px h-4 bg-gray-200 my-auto mx-1"></div>
                              <button onClick={() => handleDeleteAnnotation(note.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="删除">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                      </>
                   )}
                   <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-gray-100 transform rotate-45"></div>
                </div>
              )}
            </div>
          ))}

          {/* CREATION POPOVER */}
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
                         onClick={handleSaveNewAnnotation}
                         disabled={!pendingText.trim()}
                         className="px-4 py-1.5 text-xs bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 font-medium flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
                      >
                         <Check size={14} /> 确认保存
                      </button>
                   </div>
                </div>
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-violet-600 transform rotate-45"></div>
             </div>
          )}
        </div>
      )}
    </>
  );
};
