
import React, { useState } from 'react';
import { Search, RotateCcw, ChevronDown, Download } from 'lucide-react';
import { MOCK_REQUIREMENTS } from '../mockData';
import { Requirement } from '../types';
import { RequirementDrawer } from './RequirementDrawer';

export const RequirementApproval: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleApproveClick = (req: Requirement) => {
    setSelectedRequirement(req);
    setIsDrawerOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb / Title */}
      <div className="mb-4 text-sm text-slate-500">
        审批 / <span className="text-slate-800 font-medium">需求审批</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-4">
         <button 
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('pending')}
         >
            待审批 (1)
         </button>
         <button 
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'approved' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('approved')}
         >
            已审批 (22)
         </button>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 rounded border border-gray-200 mb-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-600">
               <span className="whitespace-nowrap">需求单位:</span>
               <div className="relative w-48">
                  <button className="w-full text-left px-3 py-1.5 border border-gray-300 rounded text-slate-400 text-sm flex items-center justify-between bg-white">
                     <span>请选择需求单位</span>
                     <ChevronDown size={14} />
                  </button>
               </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
               <span className="whitespace-nowrap">需求名称:</span>
               <input 
                  type="text" 
                  placeholder="请输入需求名称" 
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm w-64 outline-none focus:border-blue-500"
               />
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:bg-gray-100 rounded border border-gray-300">
               <ChevronDown size={16} />
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-slate-600 hover:bg-gray-50">
               <RotateCcw size={14} />
               重置
            </button>
            <button className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 rounded text-sm text-white hover:bg-blue-700">
               <Search size={14} />
               查询
            </button>
         </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded flex-1 flex flex-col shadow-sm">
         <div className="p-4 border-b border-gray-100">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm text-slate-600 hover:bg-gray-50 hover:text-blue-600 transition-colors">
               <Download size={14} />
               导出
            </button>
         </div>

         <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50 text-slate-500 text-xs font-medium">
                  <tr>
                     <th className="px-6 py-3 w-16">序号</th>
                     <th className="px-6 py-3">需求单位</th>
                     <th className="px-6 py-3">需求名称</th>
                     <th className="px-6 py-3">建设年度</th>
                     <th className="px-6 py-3">总预算(万元)</th>
                     <th className="px-6 py-3">接收时间</th>
                     <th className="px-6 py-3">会审状态</th>
                     <th className="px-6 py-3 text-right">操作</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
                  {MOCK_REQUIREMENTS.map((req, index) => (
                     <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                        <td className="px-6 py-4">{req.unit}</td>
                        <td className="px-6 py-4">{req.name}</td>
                        <td className="px-6 py-4">{req.year}</td>
                        <td className="px-6 py-4">{req.budget.toFixed(2)}</td>
                        <td className="px-6 py-4 text-slate-500">{req.receiveTime}</td>
                        <td className="px-6 py-4 text-slate-600">{req.status}</td>
                        <td className="px-6 py-4 text-right">
                           <button 
                              className="text-blue-600 hover:underline"
                              onClick={() => handleApproveClick(req)}
                           >
                              审批
                           </button>
                        </td>
                     </tr>
                  ))}
                  {MOCK_REQUIREMENTS.length === 0 && (
                     <tr>
                        <td colSpan={8} className="text-center py-10 text-slate-400">暂无数据</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Pagination Footer */}
         <div className="p-3 border-t border-gray-100 flex justify-end items-center gap-4 text-xs text-slate-500">
            <span>共 {MOCK_REQUIREMENTS.length} 条</span>
            <div className="flex items-center gap-1">
               <button className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-slate-400">&lt;</button>
               <button className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded">1</button>
               <button className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-slate-400">&gt;</button>
            </div>
            <select className="border border-gray-300 rounded p-1 outline-none">
               <option>10 条/页</option>
               <option>20 条/页</option>
            </select>
         </div>
      </div>

      <RequirementDrawer 
         requirement={selectedRequirement}
         isOpen={isDrawerOpen}
         onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};
