import React, { useState } from 'react';
import { 
  Search, 
  LayoutGrid, 
  ChevronDown, 
  Database, 
  Menu,
  Download,
  Link as LinkIcon,
  Layers,
  Activity,
  Home,
  FileText,
  Users,
  Map,
  Bot
} from 'lucide-react';
import { MOCK_SYSTEMS } from './mockData';
import { System } from './types';
import { DetailDrawer } from './components/DetailDrawer';
import { RequirementApproval } from './components/RequirementApproval';
import { SmartAgentCenter } from './components/SmartAgentCenter';
import { AnnotationLayer } from './components/AnnotationLayer';

type View = 'SYSTEM_CENTER' | 'REQUIREMENT_APPROVAL' | 'SMART_AGENT';

function App() {
  const [currentView, setCurrentView] = useState<View>('SYSTEM_CENTER');
  const [activeSystem, setActiveSystem] = useState<System | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter logic
  const filteredSystems = MOCK_SYSTEMS.filter(sys => 
    sys.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSystemClick = (sys: System) => {
    setActiveSystem(sys);
    setIsDrawerOpen(true);
  };

  const getStatusDotColor = (status: string) => {
      switch (status) {
      case '在用': return 'bg-green-500'; 
      case '已批未建': return 'bg-yellow-500'; 
      case '维护中': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  }

  const renderContent = () => {
    if (currentView === 'REQUIREMENT_APPROVAL') {
      return <RequirementApproval />;
    }
    
    if (currentView === 'SMART_AGENT') {
      return <SmartAgentCenter />;
    }

    // Default System Center Content
    return (
      <div className="flex flex-col h-full">
         {/* Search Area */}
          <div className="bg-white p-6 rounded-t-lg border-b border-gray-100 shadow-sm mb-4">
             <div className="flex gap-0">
                <input 
                  type="text" 
                  placeholder="请输入系统名称" 
                  className="flex-1 border border-r-0 border-gray-300 rounded-l-md px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="bg-blue-600 text-white px-6 py-2 rounded-r-md text-sm hover:bg-blue-700 transition-colors">
                   搜索
                </button>
             </div>
          </div>

          {/* Filters & Table Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] flex flex-col flex-1">
             
             {/* Toolbar */}
             <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
                <button className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                   <Download size={14} />
                   导出
                </button>
                <div className="flex gap-3">
                   <div className="relative">
                      <button className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-500 flex items-center gap-8 justify-between min-w-[140px]">
                         请选择建设单位 <ChevronDown size={14} />
                      </button>
                   </div>
                   <div className="relative">
                      <button className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-500 flex items-center gap-8 justify-between min-w-[140px]">
                         请选择建设情况 <ChevronDown size={14} />
                      </button>
                   </div>
                   <div className="relative">
                      <button className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-500 flex items-center gap-8 justify-between min-w-[140px]">
                         请选择是否级联 <ChevronDown size={14} />
                      </button>
                   </div>
                </div>
             </div>

             {/* Table */}
             <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-gray-50">
                      <tr>
                         <th className="px-6 py-3 text-xs font-medium text-gray-500">系统名称</th>
                         <th className="px-6 py-3 text-xs font-medium text-gray-500">建设单位</th>
                         <th className="px-6 py-3 text-xs font-medium text-gray-500">初次建成时间</th>
                         <th className="px-6 py-3 text-xs font-medium text-gray-500">建设情况</th>
                         <th className="px-6 py-3 text-xs font-medium text-gray-500">资料完整度</th>
                         <th className="px-6 py-3 text-xs font-medium text-gray-500">已关联数据</th>
                         <th className="px-6 py-3 text-xs font-medium text-gray-500">已关联事项</th>
                         <th className="px-6 py-3 text-xs font-medium text-gray-500">级联状态</th>
                         <th className="px-6 py-3 text-xs font-medium text-gray-500 text-right">操作</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {filteredSystems.map((sys) => (
                         <tr key={sys.id} className="hover:bg-gray-50 group">
                            <td className="px-6 py-4 max-w-xs">
                               <div>
                                  <div className="font-medium text-gray-900 mb-1">{sys.name}</div>
                                  <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                     {sys.currentVersion.detail.description}
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{sys.department}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{sys.createdAt}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                               <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${getStatusDotColor(sys.status)}`}></span>
                                  <span className="text-sm text-gray-600">{sys.status}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                     <div 
                                        className={`h-full rounded-full ${sys.completeness === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                                        style={{ width: `${sys.completeness}%` }}
                                     ></div>
                                  </div>
                                  <span className="text-xs text-gray-500">{sys.completeness}%</span>
                                  {sys.completeness === 100 && <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white">✓</div>}
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-1 text-blue-500 text-sm">
                                  <LinkIcon size={14} className="rotate-45"/>
                                  <span>{sys.linkedDataCount}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-1 text-blue-500 text-sm">
                                  <LinkIcon size={14} className="rotate-45"/>
                                  <span>{sys.linkedItemsCount}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                               {sys.isCascaded ? '是' : '否'}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                               <div className="space-x-2 text-sm">
                                  <button className="text-blue-600 hover:text-blue-800">维护</button>
                                  <span className="text-gray-300">|</span>
                                  <button className="text-blue-600 hover:text-blue-800">级联</button>
                                  <span className="text-gray-300">|</span>
                                  <button 
                                     className="text-blue-600 hover:text-blue-800"
                                     onClick={() => handleSystemClick(sys)}
                                  >
                                     详情
                                  </button>
                               </div>
                            </td>
                         </tr>
                      ))}
                      {filteredSystems.length === 0 && (
                         <tr>
                            <td colSpan={9} className="px-6 py-10 text-center text-gray-400">
                               暂无数据
                            </td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
      </div>
    );
  };

  const getPageTitle = () => {
    switch(currentView) {
      case 'SMART_AGENT': return '智能辅助';
      case 'REQUIREMENT_APPROVAL': return '需求审批';
      default: return '系统中心';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Sidebar - Matching screenshot dark blue theme */}
      <div className="w-64 bg-[#0f172a] text-slate-300 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
           <Activity className="text-blue-400 mr-2" size={24}/>
           <span className="text-xl font-bold text-white tracking-wide">云平台</span>
        </div>
        
        <nav className="flex-1 py-6 space-y-1">
          <button 
            className={`w-full flex items-center gap-4 px-6 py-3 text-sm transition-colors ${currentView === 'SYSTEM_CENTER' && false ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Home size={18} />
            领导桌面
          </button>
          
          <button 
            onClick={() => setCurrentView('REQUIREMENT_APPROVAL')}
            className={`w-full flex items-center gap-4 px-6 py-3 text-sm transition-colors ${currentView === 'REQUIREMENT_APPROVAL' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText size={18} />
            需求列表 (审批)
          </button>
          
          <button className="w-full flex items-center gap-4 px-6 py-3 text-sm hover:bg-slate-800 hover:text-white transition-colors">
            <Users size={18} />
            专家库
          </button>

          {/* New Smart Agent Menu Item */}
          <button 
            onClick={() => setCurrentView('SMART_AGENT')}
            className={`w-full flex items-center gap-4 px-6 py-3 text-sm transition-colors ${currentView === 'SMART_AGENT' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Bot size={18} />
            智能辅助
            <span className="ml-auto bg-blue-500 text-[10px] text-white px-1.5 py-0.5 rounded-full">New</span>
          </button>

          <button className="w-full flex items-center gap-4 px-6 py-3 text-sm hover:bg-slate-800 hover:text-white transition-colors">
            <Database size={18} />
            资料中心
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-3 text-sm hover:bg-slate-800 hover:text-white transition-colors">
            <LayoutGrid size={18} />
            项目库
          </button>
          
          <button 
            onClick={() => setCurrentView('SYSTEM_CENTER')}
            className={`w-full flex items-center gap-4 px-6 py-3 text-sm transition-colors ${currentView === 'SYSTEM_CENTER' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Layers size={18} />
            系统中心
          </button>
          
          <button className="w-full flex items-center gap-4 px-6 py-3 text-sm hover:bg-slate-800 hover:text-white transition-colors">
            <Map size={18} />
            一张图
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f1f5f9]">
        
        {/* Header - Simple white bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
           <div className="flex items-center gap-2">
              <Menu className="lg:hidden text-gray-500" size={20} />
              <h1 className="text-lg font-medium text-slate-800">
                {getPageTitle()}
              </h1>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-8 h-8 rounded-full" />
                 </div>
                 <span className="text-sm text-slate-600">张小六</span>
              </div>
           </div>
        </header>

        {/* Scrollable Content */}
        <main className={`flex-1 overflow-auto flex flex-col ${currentView === 'SMART_AGENT' ? 'p-0' : 'p-6'}`}>
          {renderContent()}
        </main>
      </div>

      {/* Detail Drawer (Only active for System Center view) */}
      <DetailDrawer 
        system={activeSystem} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
      
      {/* GLOBAL ANNOTATION LAYER with Data Isolation */}
      <AnnotationLayer viewId={currentView} pageName={getPageTitle()} />

    </div>
  );
}

export default App;