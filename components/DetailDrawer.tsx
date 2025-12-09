import React, { useState, useMemo } from 'react';
import { X, GitCompare, History, ArrowLeft, Clock, User, Bookmark, CheckCircle2, FileText, Plus, Trash2, Edit, Power } from 'lucide-react';
import { System, ComparisonResult, DiffType, FieldDiff, ResourceDiff, SystemDetail, DataResource } from '../types';

interface DetailDrawerProps {
  system: System | null;
  isOpen: boolean;
  onClose: () => void;
}

// Map keys to the Chinese labels from the screenshot
const FIELD_LABELS: Record<keyof SystemDetail, string> = {
  isNational: '是否国家建设省级使用',
  alias: '曾用名或别名',
  systemTag: '系统标识',
  cost: '总建设费用(万元)',
  runStatus: '运行情况',
  vendor: '承建厂商',
  isAccepted: '是否验收',
  firstBuiltAt: '首次建成时间',
  isConnectedToShandong: '是否接入爱山东',
  userLevel: '用户层级',
  domain: '应用领域',
  accessUrl: '访问地址',
  deployment: '部署云节点',
  userCount: '用户数量',
  userGroup: '使用群体',
  securityLevel: '安全保护等级',
  contactPhone: '联系电话',
  remark: '备注',
  responsibilityItems: '权责事项',
  serviceItems: '政务服务事项',
  contact: '联系人',
  relatedSystems: '对应系统',
  // Header fields
  constructionUnit: '建设单位',
  description: '系统功能描述',
};

// Order of fields in the grid to match screenshot layout roughly (3 columns)
const GRID_FIELD_ORDER: (keyof SystemDetail)[] = [
  'systemTag', 'accessUrl', 'runStatus', // Row 1
  'domain', 'userLevel', 'deployment', // Row 2
  'securityLevel', 'isNational', 'isConnectedToShandong', // Row 3
  'userGroup', 'userCount', 'isAccepted', // Row 4
  'firstBuiltAt', 'contact', 'cost', // Row 5
  'contactPhone', 'systemTag', // Row 6
  // Full width items
  'remark', 
  'responsibilityItems',
  'serviceItems',
  'relatedSystems'
];

export const DetailDrawer: React.FC<DetailDrawerProps> = ({ system, isOpen, onClose }) => {
  const [isComparing, setIsComparing] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState<string>('');
  
  // History Sidebar State
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);

  // Reset state when system changes
  React.useEffect(() => {
    if (isOpen && system) {
      setIsComparing(false);
      setShowHistorySidebar(false);
      setViewingVersionId(null);
      setCompareVersionId(system.history.length > 0 ? system.history[0].versionId : '');
    }
  }, [system, isOpen]);

  // Determine which version data to display (Latest or Snapshot)
  const displayVersion = useMemo(() => {
    if (!system) return null;
    if (viewingVersionId) {
      return system.history.find(v => v.versionId === viewingVersionId) || system.currentVersion;
    }
    return system.currentVersion;
  }, [system, viewingVersionId]);

  const comparisonResult: ComparisonResult | null = useMemo(() => {
    if (!system || !isComparing || !compareVersionId) return null;

    const oldVersion = system.history.find(v => v.versionId === compareVersionId);
    if (!oldVersion) return null;

    const currentVersion = system.currentVersion;
    const fieldDiffs: Record<string, FieldDiff> = {};
    const stats = { added: 0, removed: 0, modified: 0 };

    // Compare Details
    (Object.keys(currentVersion.detail) as Array<keyof SystemDetail>).forEach(key => {
      const newVal = currentVersion.detail[key];
      const oldVal = oldVersion.detail[key];

      if (newVal !== oldVal) {
        fieldDiffs[key] = {
          key,
          label: FIELD_LABELS[key] || key,
          oldValue: oldVal,
          newValue: newVal,
          type: DiffType.MODIFIED
        };
        stats.modified++;
      }
    });

    // Compare Resources
    const resourceDiffs: ResourceDiff[] = [];
    const currentResMap = new Map<string, DataResource>(currentVersion.resources.map(r => [r.id, r] as [string, DataResource]));
    const oldResMap = new Map<string, DataResource>(oldVersion.resources.map(r => [r.id, r] as [string, DataResource]));

    // Find Added and Modified
    currentVersion.resources.forEach(res => {
      if (!oldResMap.has(res.id)) {
        resourceDiffs.push({ resource: res, type: DiffType.ADDED });
        stats.added++;
      } else {
        const oldRes = oldResMap.get(res.id)!;
        if (oldRes.name !== res.name || oldRes.count !== res.count) {
             resourceDiffs.push({ resource: res, type: DiffType.MODIFIED });
             stats.modified++;
        } else {
             resourceDiffs.push({ resource: res, type: DiffType.UNCHANGED });
        }
      }
    });

    // Find Removed
    oldVersion.resources.forEach(res => {
      if (!currentResMap.has(res.id)) {
        resourceDiffs.push({ resource: res, type: DiffType.REMOVED });
        stats.removed++;
      }
    });

    return { stats, fieldDiffs, resourceDiffs };
  }, [system, isComparing, compareVersionId]);

  if (!system || !displayVersion) return null;

  const handleStartCompare = () => {
    if (viewingVersionId) {
      setCompareVersionId(viewingVersionId);
      setViewingVersionId(null); 
      setIsComparing(true);
    } else {
      const defaultHistory = system.history.length > 0 ? system.history[0].versionId : '';
      if (defaultHistory) {
         setCompareVersionId(defaultHistory);
         setIsComparing(true);
      }
    }
  };

  const handleToggleHistory = () => {
    setShowHistorySidebar(!showHistorySidebar);
  };

  const renderField = (key: keyof SystemDetail) => {
    const value = displayVersion.detail[key];
    const diff = !viewingVersionId && isComparing ? comparisonResult?.fieldDiffs[key] : null;
    const isRelatedSystems = key === 'relatedSystems';

    // NEW STYLE: Diff shown as a block below the current value
    if (diff) {
       return (
         <div className="flex flex-col items-start w-full group">
            <span className="text-slate-900 font-medium break-all">{diff.newValue || '-'}</span>
            <div className="mt-1.5 w-full bg-[#FFF7E6] border border-[#FFD591] px-2 py-1 rounded text-xs text-slate-600 flex items-start gap-1">
               <span className="text-[#FA8C16] font-medium shrink-0">修改前:</span>
               <span className="break-all text-[#D46B08]">{diff.oldValue || '空'}</span>
            </div>
         </div>
       );
    }

    if (isRelatedSystems) {
      return (
        <div className="flex flex-col gap-1 mt-1">
          {String(value).split('\n').map((line, i) => (
             <a key={i} href="#" className="text-blue-600 hover:underline text-sm block">{line}</a>
          ))}
        </div>
      );
    }

    return <span className="text-slate-700 break-all">{value || '-'}</span>;
  };

  // Prepare versions for the timeline
  const allVersions = [
    { ...system.currentVersion, isCurrent: true },
    ...system.history.map(h => ({ ...h, isCurrent: false }))
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 right-0 w-full md:w-[1200px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header - Adaptive based on mode */}
        <div className="bg-white border-b border-gray-200 z-20 shrink-0">
           <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                 <div className="text-lg font-bold text-slate-800">
                   {isComparing ? '差异对比详情' : '系统详情'}
                 </div>
                 {/* Diff Statistics Pills */}
                 {isComparing && comparisonResult && (
                    <div className="flex items-center gap-3 ml-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-1 px-3 py-0.5 rounded-full border border-[#B7EB8F] bg-[#F6FFED] text-[#389E0D] text-xs font-medium">
                           <Plus size={12} />
                           新增 {comparisonResult.stats.added} 处
                        </div>
                        <div className="flex items-center gap-1 px-3 py-0.5 rounded-full border border-[#FFD591] bg-[#FFF7E6] text-[#D46B08] text-xs font-medium">
                           <Edit size={12} />
                           修改 {comparisonResult.stats.modified} 处
                        </div>
                        <div className="flex items-center gap-1 px-3 py-0.5 rounded-full border border-[#FFA39E] bg-[#FFF1F0] text-[#CF1322] text-xs font-medium">
                           <Trash2 size={12} />
                           删除 {comparisonResult.stats.removed} 处
                        </div>
                    </div>
                 )}
              </div>
              
              <div className="flex items-center gap-4">
                 {/* Contrast Controls */}
                 {isComparing ? (
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-2 text-sm text-slate-600 bg-gray-50 px-3 py-1.5 rounded border border-gray-200">
                          <span className="text-slate-400">对比</span>
                          <select 
                             value={compareVersionId} 
                             onChange={(e) => setCompareVersionId(e.target.value)}
                             className="bg-transparent border-none outline-none font-bold text-blue-600 w-36 text-right cursor-pointer"
                          >
                             {system.history.map(v => (
                                <option key={v.versionId} value={v.versionId}>{v.versionName}</option>
                             ))}
                          </select>
                       </div>
                       <button 
                          onClick={() => setIsComparing(false)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                       >
                          <Power size={14} />
                          退出对比
                       </button>
                       <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    </div>
                 ) : (
                    // Regular Controls
                    <div className="flex items-center gap-3">
                        <button 
                          onClick={handleToggleHistory}
                          className={`flex items-center gap-2 px-3 py-1.5 border rounded text-sm transition-all shadow-sm
                             ${showHistorySidebar 
                                ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-blue-600'
                             }
                          `}
                        >
                          <History size={14} />
                          {showHistorySidebar ? '隐藏历史' : '历史版本'}
                        </button>
                        <button 
                            onClick={handleStartCompare}
                            disabled={system.history.length === 0}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all shadow-sm
                              ${system.history.length === 0 
                                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' 
                                : 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
                              }
                            `}
                          >
                            <GitCompare size={14} />
                            {viewingVersionId ? '对比当前' : '差异对比'}
                        </button>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    </div>
                 )}

                 <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors">
                   <X size={20} />
                 </button>
              </div>
           </div>
        </div>

        {/* Main Flex Container */}
        <div className="flex-1 flex overflow-hidden bg-white">
          
          {/* MAIN DETAIL CONTENT (Left Side, order-1) */}
          <div className="flex-1 overflow-y-auto bg-white order-1">
             
              {/* Snapshot Alert Banner */}
              {viewingVersionId && !isComparing && (
                 <div className="bg-amber-50 border-b border-amber-200 px-8 py-2 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2 text-amber-800 text-sm">
                       <History size={16} />
                       <span>当前正在查看历史版本快照: <b>{displayVersion.versionName}</b></span>
                    </div>
                    <button 
                       onClick={() => setViewingVersionId(null)}
                       className="text-xs bg-white border border-amber-300 px-3 py-1 rounded text-amber-800 hover:bg-amber-100 transition-colors shadow-sm"
                    >
                       返回最新版本
                    </button>
                 </div>
              )}

              {/* System Header Info */}
              <div className="px-8 py-6 bg-white border-b border-gray-100">
                 <div className="flex items-start gap-4 mb-2">
                    <div className="mt-1 p-2 bg-blue-50 rounded-lg border border-blue-100">
                       <FileText size={24} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                       <h1 className="text-xl font-bold text-slate-800 mb-3">{system.name}</h1>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                          <div className="flex items-center text-sm">
                             <span className="text-slate-500 w-20 shrink-0">建设单位:</span>
                             <span className="text-slate-800">{displayVersion.detail.constructionUnit}</span>
                          </div>
                          <div className="flex items-center text-sm">
                             <span className="text-slate-500 w-20 shrink-0">建设情况:</span>
                             <span className="text-slate-800">{system.status}</span>
                          </div>
                          
                          <div className="flex items-start text-sm col-span-2 mt-1">
                             <span className="text-slate-500 w-20 shrink-0">功能描述:</span>
                             <span className="text-slate-600 leading-relaxed">{displayVersion.detail.description}</span>
                             {isComparing && comparisonResult && comparisonResult.fieldDiffs['description'] && (
                                <div className="ml-2 bg-[#FFF7E6] border border-[#FFD591] px-2 py-0.5 rounded text-xs text-[#D46B08]">
                                   修改前: {comparisonResult.fieldDiffs['description'].oldValue}
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Tabs */}
              <div className="px-8 border-b border-gray-200 bg-white sticky top-0 z-10 pt-2 shadow-sm">
                 <div className="flex gap-8">
                    <button className="pb-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">系统信息</button>
                    <button className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 text-sm">资源信息</button>
                    <button className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 text-sm">云工单记录</button>
                 </div>
              </div>

              {/* Content Sections */}
              <div className="p-8 space-y-10 pb-20">
                 
                 {/* BASIC INFO */}
                 <section>
                    <div className="flex items-center mb-6 pl-2 border-l-4 border-blue-600">
                       <h3 className="font-bold text-slate-800 text-base">基本信息</h3>
                    </div>
                    
                    <div className="bg-white rounded-lg transition-all">
                       {/* Grid matching the screenshot (3 cols, inline fields) */}
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-12">
                          {GRID_FIELD_ORDER.map(key => (
                             <div key={key} className={`flex items-baseline gap-3 text-sm ${key === 'remark' || key === 'relatedSystems' || key === 'responsibilityItems' || key === 'serviceItems' ? 'col-span-1 md:col-span-3' : ''}`}>
                                <span className="text-slate-500 shrink-0 select-none text-right min-w-[80px]">{FIELD_LABELS[key]}:</span>
                                <div className="text-slate-700 font-medium flex-1 break-words leading-relaxed">
                                   {renderField(key)}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </section>
                 
                 <div className="w-full h-px bg-gray-100 my-4"></div>

                 {/* PROJECT INFO */}
                 <section>
                    <div className="flex items-center mb-6 pl-2 border-l-4 border-blue-600">
                       <h3 className="font-bold text-slate-800 text-base">项目信息</h3>
                    </div>
                    
                    {/* Project Card */}
                    <div className="flex gap-4">
                       <div className="bg-white border border-gray-200 rounded p-4 w-full md:w-96 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                           {isComparing && (
                              <div className="absolute top-2 right-2 p-1">
                                 <span className="bg-[#F6FFED] border border-[#B7EB8F] text-[#389E0D] text-[10px] px-1.5 py-0.5 rounded font-bold">新增</span>
                              </div>
                           )}
                           <div className="font-bold text-slate-800 text-sm mb-3">政务信息化项目管理项目</div>
                           <div className="space-y-2 text-xs text-slate-500">
                               <div className="flex justify-between">
                                  <span>立项时间:</span>
                                  <span className="text-slate-700 font-mono">2025-12-02 12:12:12</span>
                               </div>
                               <div className="flex justify-between">
                                  <span>批复金额:</span>
                                  <span className="text-slate-700">50 万元</span>
                               </div>
                           </div>
                       </div>
                    </div>
                 </section>

                 <div className="w-full h-px bg-gray-100 my-4"></div>

                 {/* DATA RESOURCES / FUNCTION MODULES TABLE */}
                 <section>
                    <div className="flex items-center mb-6 pl-2 border-l-4 border-blue-600 justify-between">
                       <h3 className="font-bold text-slate-800 text-base">功能模块/数据资源表格</h3>
                    </div>

                    <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                       <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                             <tr>
                                <th className="px-6 py-3 font-medium">序号</th>
                                <th className="px-6 py-3 font-medium">资源名称</th>
                                <th className="px-6 py-3 font-medium">类型</th>
                                <th className="px-6 py-3 font-medium">数据量</th>
                                <th className="px-6 py-3 font-medium text-right">备注</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                             {/* Show Diff Rows if comparing */}
                             {isComparing && comparisonResult ? (
                                <>
                                   {comparisonResult.resourceDiffs.map((diff, index) => {
                                      const isMod = diff.type === DiffType.MODIFIED;
                                      const isAdd = diff.type === DiffType.ADDED;
                                      const isRem = diff.type === DiffType.REMOVED;
                                      
                                      // Get old resource for modified display
                                      const oldRes = isMod ? system.history.find(v => v.versionId === compareVersionId)?.resources.find(r => r.id === diff.resource.id) : null;

                                      return (
                                         <tr key={diff.resource.id} 
                                            className={`
                                               ${isAdd ? 'bg-[#F6FFED]' : ''}
                                               ${isRem ? 'bg-[#FFF1F0]' : ''}
                                               ${isMod ? 'bg-[#FFF7E6]' : ''}
                                               ${diff.type === DiffType.UNCHANGED ? 'hover:bg-gray-50' : ''}
                                            `}
                                         >
                                            <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                                            <td className="px-6 py-4">
                                               <div className="font-medium text-slate-800">{diff.resource.name}</div>
                                               {isMod && oldRes && oldRes.name !== diff.resource.name && (
                                                  <div className="mt-1 bg-[#FFF7E6] px-1.5 py-0.5 rounded text-xs text-[#D46B08] border border-[#FFD591] inline-block">
                                                     修改前: {oldRes.name}
                                                  </div>
                                               )}
                                               {isAdd && <span className="ml-2 text-[10px] text-[#389E0D] border border-[#B7EB8F] px-1 rounded">新增</span>}
                                               {isRem && <span className="ml-2 text-[10px] text-[#CF1322] border border-[#FFA39E] px-1 rounded">已删除</span>}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{diff.resource.type}</td>
                                            <td className="px-6 py-4 font-mono text-slate-700">
                                                {diff.resource.count.toLocaleString()}
                                                {isMod && oldRes && oldRes.count !== diff.resource.count && (
                                                  <div className="mt-1 bg-[#FFF7E6] px-1.5 py-0.5 rounded text-xs text-[#D46B08] border border-[#FFD591] w-fit">
                                                     修改前: {oldRes.count.toLocaleString()}
                                                  </div>
                                               )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-400">
                                               {isAdd ? '新增' : isRem ? '已删除' : isMod ? '已变更' : '-'}
                                            </td>
                                         </tr>
                                      );
                                   })}
                                </>
                             ) : (
                                // Standard List View
                                displayVersion.resources.length > 0 ? (
                                   displayVersion.resources.map((res, index) => (
                                      <tr key={res.id} className="hover:bg-gray-50">
                                         <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                                         <td className="px-6 py-4 font-medium text-slate-800">{res.name}</td>
                                         <td className="px-6 py-4 text-slate-600">{res.type}</td>
                                         <td className="px-6 py-4 font-mono text-slate-700">{res.count.toLocaleString()}</td>
                                         <td className="px-6 py-4 text-right text-slate-400">-</td>
                                      </tr>
                                   ))
                                ) : (
                                   <tr>
                                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">暂无数据资源</td>
                                   </tr>
                                )
                             )}
                          </tbody>
                       </table>
                    </div>
                 </section>
              </div>
          </div>

          {/* HISTORY SIDEBAR (Collapsible) - RIGHT SIDE, ORDER-2 */}
          <div 
             className={`bg-white border-l border-gray-200 overflow-y-auto transition-all duration-300 ease-in-out flex-shrink-0 order-2
                ${showHistorySidebar ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}
             `}
          >
             <div className="p-4 w-80">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-2 text-blue-600 font-bold">
                      <Bookmark size={18} fill="currentColor" />
                      <span>历史版本</span>
                   </div>
                   <button 
                      onClick={() => setShowHistorySidebar(false)}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded transition-colors"
                   >
                      <X size={16} />
                   </button>
                </div>

                <div className="relative pl-3 ml-2 border-l border-blue-200 space-y-6 pb-10">
                   {allVersions.map((ver) => {
                      const isSelected = viewingVersionId === ver.versionId || (ver.isCurrent && !viewingVersionId);
                      
                      return (
                         <div key={ver.versionId} className="relative group">
                            {/* Dot */}
                            <div 
                              className={`absolute -left-[18.5px] top-1.5 w-3 h-3 rounded-full border-2 
                                ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-blue-400'}
                              `} 
                            />

                            {/* Content */}
                            <div className="pl-2">
                               <div 
                                  onClick={() => {
                                     if (ver.isCurrent) setViewingVersionId(null);
                                     else setViewingVersionId(ver.versionId);
                                     setIsComparing(false);
                                     setShowHistorySidebar(false); // Auto close sidebar
                                  }}
                                  className={`rounded-lg p-3 transition-all cursor-pointer border
                                     ${isSelected 
                                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                        : 'bg-transparent border-transparent hover:bg-gray-50'
                                     }
                                  `}
                               >
                                  <div className="flex justify-between items-start mb-2">
                                     <span className={`font-bold text-sm ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                                        {ver.versionName}
                                     </span>
                                     {ver.isCurrent ? (
                                        <span className="text-[10px] text-blue-500 font-medium">当前</span>
                                     ) : (
                                        isSelected && (
                                           <span className="text-xs text-blue-600 font-medium hover:underline">查看</span>
                                        )
                                     )}
                                  </div>

                                  <div className="space-y-2">
                                     <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <CheckCircle2 size={12} className="text-blue-400" />
                                        <span>{ver.changeType}</span>
                                     </div>
                                     <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Clock size={12} />
                                        <span>{ver.updatedAt}</span>
                                     </div>
                                     <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <User size={12} />
                                        <span>{ver.modifier}</span>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
          </div>

        </div>
      </div>
    </>
  );
};