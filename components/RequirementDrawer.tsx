
import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, ClipboardList, ShieldCheck, Loader2, AlertTriangle, CheckCircle2, ListChecks, ChevronLeft, User, Download, ListTree, MapPin, BookOpen, History, Clock, BrainCircuit, LayoutList, Ban } from 'lucide-react';
import { Requirement, ComplianceRisk, CheckStep } from '../types';

interface RequirementDrawerProps {
  requirement: Requirement | null;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_STEPS: CheckStep[] = [
  { id: '1', label: '加载合规性知识库 (统建/负面清单)...', status: 'PENDING' },
  { id: '2', label: '提取项目关键特征 (预算/建设内容)...', status: 'PENDING' },
  { id: '3', label: '执行智能比对分析 & 规则扫描...', status: 'PENDING' },
  { id: '4', label: '生成风险评估报告 & 整改建议...', status: 'PENDING' },
];

// Mock History Data
interface CheckHistoryRecord {
  id: string;
  date: string;
  operator: string;
  result: 'PASSED' | 'RISK_FOUND' | 'REJECTED';
  riskCount: number;
}

const MOCK_HISTORY_RECORDS: CheckHistoryRecord[] = [
  { id: 'current', date: '2025-12-05 15:30:00', operator: '张小六', result: 'RISK_FOUND', riskCount: 6 },
  { id: 'h1', date: '2025-12-04 10:00:00', operator: '系统自动', result: 'PASSED', riskCount: 0 },
  { id: 'h2', date: '2025-12-01 09:15:00', operator: '李四', result: 'RISK_FOUND', riskCount: 3 },
];

// Mock Data for Unified List based on the screenshot context
const UNIFIED_LIST_DATA = [
  {
    category: '应用支撑',
    name: '省电子政务外网数字证书系统',
    description: '省电子政务外网数字证书系统是山东省电子政务外网用户的第三方信任基础，为电子政务外网用户提供数字身份证书的申请、审核、发放、更新、注销等数字证书全生命周期管理。',
    capabilities: '1. 电子政务外网用户可通过机关内部办事平台申请UKey数字证书发放；\n2. 为电子政务外网用户提供证书查询、在线更新服务。',
    responsibilities: '根据提供UKey证书的接口对业务系统进行改造。'
  },
  {
    category: '通用应用',
    name: '政务服务业务中台',
    description: '1. 除表单、逻辑、流程特别复杂的事项（不依托中台运行的事项需一事一议），原则上部门梳理的标准化事项都要通过中台提供服务，实现政务服务运行的一口入。\n2. 政务服务业务中台主要包括业务中台门户、数字化拆解、元数据管理、智能表单、智能路由、事项运行配置、服务融合发布、多端适配功能。',
    capabilities: '1. 提供在线工作门户入口；\n2. 提供标准化事项数字化拆解和配置；\n3. 提供政务服务表单元数据管理和共享接入管理；\n4. 提供表单生成、数据资源共享接入、证照应用、数据路由配置；\n5. 提供业务定制、服务发布和调用流程管理；\n6. 提供多端适配的在线申报服务页面输出。',
    responsibilities: '1. 部门依托中台，开展数字化梳理和表单配置工作，中台支撑团队协助。\n2. 有自建审批系统的部门，自建审批系统要与业务中台对接改造，实现异构办件传送。'
  },
  {
    category: '通用应用',
    name: '“爱山东”政务服务平台省级通用审批系统',
    description: '“爱山东”政务服务平台通用审批系统是面向业务部门提供业务运行通用的审批功能。',
    capabilities: '1. 业务运行规则设计和配置；\n2. 业务审批流转；\n3. 业务办理状态和结果跟踪、查询、记录；\n4. 事项办理数据归集、推送、共享。',
    responsibilities: '原则上，政务服务类的系统，部门可提出应用建设需求，对接“爱山东”政务服务平台相关工作人员，部门可以用系统提供的能力自行配置也可以申请由平台支撑团队协助配置使用。\n\n部门自建系统需与“好差评”系统对接。'
  },
  {
    category: '应用支撑',
    name: '政务服务“好差评”',
    description: '主要包括建设统一的“好差评”采集评价组件、事项转换对应、数据质检、评价分析、差评整改管理等，提供统一的“好差评”服务调用规范。统一向国家政务服务平台报送数据。',
    capabilities: '1. 提供办件数据统一评价功能页面；\n2. 提供差评整改的管理；\n3. 提供统一的“好差评”系统对接规范。',
    responsibilities: '部门自建系统需与“好差评”系统对接。'
  },
  {
    category: '通用应用',
    name: '智能客服',
    description: '提供多端统一的机器阅读、多轮对话、在线自动问答、人工回复、语音客服等功能，并提供统一的知识管理功能。',
    capabilities: '1. 智能客服服务端功能。\n2. 智能客服后台知识维护管理功能。',
    responsibilities: '1. 部门自建网站使用智能客服对接。\n2. 部门/行业知识管理和更新。'
  }
];

// Mock Risks Data (Extracted for reuse in history switching)
const MOCK_RISKS_DATA: ComplianceRisk[] = [
  // UNIFIED LIST RISKS (3 items)
  {
    id: 'u1',
    category: 'UNIFIED_LIST',
    title: '身份认证模块重复建设',
    level: 'HIGH',
    riskLabel: '驳回<br>新建',
    description: '',
    involvedContent: '计划采购一套第三方CA数字证书系统，为全省5万名从业人员发放UKey，实现登录和电子签章，预算**80万元**。',
    hitClause: '**系统名称：** 省电子政务外网数字证书系统<br>**统建内容说明：** 统一建设全省数字证书认证体系，为各级政务应用提供身份鉴别服务。',
    suggestion: '预警： 属于省级统建的基础支撑能力，严禁重复采购第三方CA系统。 <br>整改建议： <br>1. **核减**全部80万预算。<br>2. 按照清单要求，利用**“提供UKey证书的接口”**对业务系统进行改造，直接调用省级统建的数字证书服务。'
  },
  {
    id: 'u2',
    category: 'UNIFIED_LIST',
    title: '流程引擎重复开发',
    level: 'MEDIUM',
    riskLabel: '建议<br>核减',
    description: '',
    involvedContent: '开发一套可视化的表单设计器和流程配置后台，支持业务处室自行拖拽生成审批表单，定义审批流转路径。',
    hitClause: '**系统名称：** 政务服务业务中台<br>**统建内容说明：** 提供全省通用的业务建模、表单设计、流程编排、规则引擎等共性能力。',
    suggestion: '预警： 申报的“表单生成、流程管理”功能与政务服务业务中台高度重合。 <br>整改建议： <br>1. 取消自建流程引擎的开发工作量。<br>2. 依托业务中台提供的**“智能表单”、“智能路由”和“服务发布”**能力进行配置。<br>3. 仅保留“依托中台开展梳理和配置”的相关实施费用。'
  },
  {
    id: 'u3',
    category: 'UNIFIED_LIST',
    title: '审批业务系统重复建设',
    level: 'MEDIUM',
    riskLabel: '建议<br>核减',
    description: '',
    involvedContent: '建设“资格认定审批子系统”，实现受理、初审、复审、办结的全流程业务闭环，并记录办理状态。',
    hitClause: '**系统名称：** “爱山东”政务服务平台省级通用审批系统<br>**统建内容说明：** 面向全省各级部门提供统一的行政审批受理办理服务能力。',
    suggestion: '预警： 对于标准化的资格认定事项，无需独立开发审批功能。<br>整改建议： <br>1. 直接使用**“爱山东”通用审批系统**。<br>2. 部门自行承担内容调整为：提出应用建设需求，申请由平台支撑团队协助配置，仅建设与特殊业务逻辑相关的个性化模块(如有)。'
  },
  // NEGATIVE LIST RISKS
  {
    id: 'r5',
    category: 'NEGATIVE_LIST',
    title: '设备购置违规',
    level: 'LOW',
    involvedContent: '预算包含：办公电脑20台、打印机5台、大屏显示器1个、碎纸机2台。',
    hitClause: '五、（一）/（二）<br>单独购置通用办公设备...包括办公电脑...显示大屏...碎纸机等。',
    suggestion: '预警： 此类物品不属于政务信息化项目资金支持范围。 <br>建议： 请从信息化项目预算中剔除，通过**单位公用经费**或**通用资产配置**渠道解决。'
  },
  {
    id: 'r6',
    category: 'NEGATIVE_LIST',
    title: '软件功能违规',
    level: 'MEDIUM',
    involvedContent: 'APP内设置“每日打卡”及“学习积分排名”功能，强制全员参与。',
    hitClause: '六、（一）<br>除安保、应急等特殊场景规定外...打卡签到、积分排名...等强制性功能。',
    suggestion: '预警： 除非特定安保应急需求，不得设置强制打卡排名功能。<br>建议： 删除该强制性功能模块，或提供安保/应急场景的必要性说明。'
  },
  {
    id: 'r1',
    category: 'NEGATIVE_LIST',
    title: '硬件采购违规',
    level: 'HIGH',
    involvedContent: '计划采购5台高性能服务器用于部署数据库，并在办公楼新建20平米小型机房。',
    hitClause: '一、（二）<br>新建或扩建机房...新增服务器、存储等硬件设备采购。',
    suggestion: '预警： 违反集约建设要求。<br>建议： 取消硬件采购和机房建设，业务系统应申请部署在政务云平台，利用现有云资源。'
  }
];

// Helper to render text with highlighting
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  // Replace <br> with newlines, then split
  const lines = text.replace(/<br\s*\/?>/gi, '\n').split('\n');
  
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Simple bold parsing for **text**
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <div key={i}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
};

export const RequirementDrawer: React.FC<RequirementDrawerProps> = ({ requirement, isOpen, onClose }) => {
  // Compliance State
  const [showCompliancePanel, setShowCompliancePanel] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [steps, setSteps] = useState<CheckStep[]>(INITIAL_STEPS);
  const [progress, setProgress] = useState(0);
  const [risks, setRisks] = useState<ComplianceRisk[]>([]);
  
  // New state for controlling process visibility
  const [showProcessDetails, setShowProcessDetails] = useState(false);
  
  // History State
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<string>('current');

  // Modal State
  const [activeModal, setActiveModal] = useState<'NONE' | 'UNIFIED' | 'NEGATIVE'>('NONE');

  // Computed statistics
  const stats = useMemo(() => {
    return {
      unifiedListCount: risks.filter(r => r.category === 'UNIFIED_LIST').length,
      negativeListCount: risks.filter(r => r.category === 'NEGATIVE_LIST').length,
      total: risks.length
    };
  }, [risks]);

  // Reset state on close or requirement change
  useEffect(() => {
    if (!isOpen) {
      setShowCompliancePanel(false);
      resetCheck();
      setActiveModal('NONE');
    }
  }, [isOpen, requirement]);

  const resetCheck = () => {
    setIsChecking(false);
    setSteps(INITIAL_STEPS);
    setProgress(0);
    setRisks([]);
    setShowProcessDetails(false);
    setShowHistoryList(false);
    setCurrentHistoryId('current');
  };

  const handleStartCheck = () => {
    setShowCompliancePanel(true);
    if (risks.length > 0 && currentHistoryId === 'current') return; // Already checked current

    // Reset to current context if we were in history
    setCurrentHistoryId('current');
    setShowHistoryList(false);
    
    setIsChecking(true);
    setShowProcessDetails(true); // Show steps during check
    setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'IN_PROGRESS' } : { ...s, status: 'PENDING' }));
    setProgress(0);

    // Simulation Logic
    let currentStep = 0;
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += 2; // Slower for "thinking" effect
      
      // Update progress bar
      if (currentProgress > 100) currentProgress = 100;
      setProgress(currentProgress);

      // Manage Steps
      const threshold = (currentStep + 1) * 25;
      
      if (currentProgress >= threshold && currentStep < 3) {
         setSteps(prev => prev.map((s, i) => i === currentStep ? { ...s, status: 'COMPLETED' } : s));
         currentStep++;
         setSteps(prev => prev.map((s, i) => i === currentStep ? { ...s, status: 'IN_PROGRESS' } : s));
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setSteps(prev => prev.map(s => ({ ...s, status: 'COMPLETED' })));
        setIsChecking(false);
        setShowProcessDetails(false); // Auto collapse to show results
        
        // Populate Risks
        setRisks(MOCK_RISKS_DATA);
      }
    }, 40); 
  };

  const handleSwitchHistory = (record: CheckHistoryRecord) => {
    setCurrentHistoryId(record.id);
    setShowHistoryList(false);
    
    // Simulate data loading based on history ID
    if (record.result === 'PASSED') {
       setRisks([]);
       setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'COMPLETED' })));
       setProgress(100);
    } else if (record.result === 'RISK_FOUND') {
       // Just slice the mock data to simulate a different result
       setRisks(record.id === 'h2' ? MOCK_RISKS_DATA.slice(0, 3) : MOCK_RISKS_DATA);
       setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'COMPLETED' })));
       setProgress(100);
    }
    
    setShowProcessDetails(false);
  };

  const renderRiskList = (title: string, items: ComplianceRisk[]) => {
     if (items.length === 0) return null;
     
     return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#F8FAFC] py-2 z-10">
               <AlertTriangle size={16} className="text-slate-500" />
               <h3 className="font-bold text-slate-700 text-sm">{title} ({items.length})</h3>
            </div>
            
            <div className="space-y-4">
              {items.map((risk, index) => (
                 <div key={risk.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex">
                       {/* Index Column */}
                       <div className="w-10 flex items-center justify-center bg-gray-50 text-slate-400 font-mono text-sm border-r border-gray-100 shrink-0">
                          {index + 1}
                       </div>
                       
                       {/* Main Content */}
                       <div className="flex-1 p-4">
                          {/* Involved Content Section */}
                          <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                  <div className="text-xs font-semibold text-slate-500">申报需求涉及内容</div>
                                  <button className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1 rounded-full transition-colors font-medium">
                                      <MapPin size={12} />
                                      定位原文
                                  </button>
                              </div>
                              <div className="text-sm text-slate-800 leading-relaxed font-medium">
                                 <FormattedText text={risk.involvedContent || ''} />
                              </div>
                          </div>

                          {/* Hit Clause Section */}
                          <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-100">
                             <div className="flex justify-between items-center mb-2">
                                <div className="text-xs font-semibold text-slate-500">
                                    {risk.category === 'UNIFIED_LIST' ? '命中统建清单项目' : '命中负面清单条款'}
                                </div>
                                <button 
                                  onClick={() => {
                                      if (risk.category === 'UNIFIED_LIST') setActiveModal('UNIFIED');
                                      else setActiveModal('NEGATIVE');
                                  }}
                                  className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-2.5 py-1 rounded-full transition-colors font-medium"
                                >
                                    <BookOpen size={12} />
                                    {risk.category === 'UNIFIED_LIST' ? '统建清单详情' : '规则详情'}
                                </button>
                             </div>
                             <div className="text-sm text-slate-700 leading-relaxed">
                                <FormattedText text={risk.hitClause || ''} />
                             </div>
                          </div>

                          {/* Suggestion Section */}
                          <div>
                             <div className="text-xs font-semibold text-slate-500 mb-2">预警提示与整改建议</div>
                             <div className="text-sm text-slate-600 leading-relaxed bg-orange-50/50 p-3 rounded text-justify border border-orange-100/50">
                                <FormattedText text={risk.suggestion || ''} />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
            </div>
        </div>
     );
  };

  const renderUnifiedListModal = () => {
    if (activeModal !== 'UNIFIED') return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal('NONE')} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <ListTree className="text-blue-600"/> 省级政务信息化项目管理统建清单
                     </h3>
                     <button onClick={() => setActiveModal('NONE')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500"/>
                     </button>
                </div>
                {/* Content - Table */}
                <div className="flex-1 overflow-auto p-6">
                    <table className="w-full border-collapse border border-slate-200 text-sm">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="border border-slate-300 px-4 py-3 w-28 bg-slate-100">类别</th>
                                <th className="border border-slate-300 px-4 py-3 w-48 bg-slate-100">平台/系统名称</th>
                                <th className="border border-slate-300 px-4 py-3 bg-slate-100">统建内容说明/介绍</th>
                                <th className="border border-slate-300 px-4 py-3 bg-slate-100">可向部门提供的服务能力</th>
                                <th className="border border-slate-300 px-4 py-3 bg-slate-100">部门需自行承担的建设内容</th>
                            </tr>
                        </thead>
                        <tbody>
                            {UNIFIED_LIST_DATA.map((item, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/30">
                                    <td className="border border-slate-300 px-4 py-3 text-center font-medium text-slate-600">{item.category}</td>
                                    <td className="border border-slate-300 px-4 py-3 font-bold text-slate-800">{item.name}</td>
                                    <td className="border border-slate-300 px-4 py-3 whitespace-pre-line text-slate-600 leading-relaxed text-justify">{item.description}</td>
                                    <td className="border border-slate-300 px-4 py-3 whitespace-pre-line text-slate-600 leading-relaxed text-justify">{item.capabilities}</td>
                                    <td className="border border-slate-300 px-4 py-3 whitespace-pre-line text-slate-600 leading-relaxed text-justify">{item.responsibilities}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
  }

  const renderNegativeListModal = () => {
    if (activeModal !== 'NEGATIVE') return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal('NONE')} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* PDF Viewer Simulation Header */}
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-[#323639] text-white">
                     <div className="flex items-center gap-3">
                        <FileText size={18} className="text-gray-300"/>
                        <span className="font-medium text-sm">山东省政务信息化项目建设负面清单.pdf</span>
                        <span className="text-xs bg-gray-600 px-2 py-0.5 rounded text-gray-300">只读</span>
                     </div>
                     <div className="flex items-center gap-4">
                        <button className="hover:bg-gray-600 p-1.5 rounded"><Download size={16}/></button>
                        <button onClick={() => setActiveModal('NONE')} className="hover:bg-red-500/80 p-1.5 rounded transition-colors">
                           <X size={18}/>
                        </button>
                     </div>
                </div>
                {/* Content - Fake PDF Pages */}
                <div className="flex-1 overflow-auto bg-[#525659] p-8 flex flex-col items-center gap-6">
                    {/* Page 1 */}
                    <div className="bg-white shadow-lg w-full max-w-3xl min-h-[1000px] p-16 text-slate-800 relative">
                        <div className="text-center mb-16 mt-8">
                            <h1 className="text-3xl font-serif font-bold mb-6 leading-relaxed text-slate-900">山东省政务信息化项目建设<br/>负面清单</h1>
                            <div className="w-32 h-0.5 bg-red-600 mx-auto mb-6"></div>
                            <p className="text-lg font-serif text-slate-600">鲁数〔2024〕15号</p>
                        </div>
                        <div className="space-y-10 font-serif text-lg leading-loose text-slate-800">
                            <p className="indent-8 text-justify">为进一步规范省级政务信息化项目建设管理，避免重复建设和盲目投入，提高财政资金使用效益，根据《山东省政务信息化项目建设管理办法》等有关规定，制定本负面清单。</p>
                            
                            <div>
                                <h3 className="font-bold text-xl mb-4">一、 禁止重复建设类</h3>
                                <p className="pl-4 text-justify">（一） 省级已统建的基础设施、公共平台和共性应用系统，各部门不得新建、改建或扩建。包括但不限于：电子政务外网、政务云平台、大数据平台、统一身份认证、电子印章、非税支付等。</p>
                                <p className="pl-4 mt-2 text-justify">（二） 未经批准，不得新建数据中心、机房等基础设施。原则上，新增硬件设备应部署在省政务云平台。</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-xl mb-4">二、 限制建设类</h3>
                                <p className="pl-4 text-justify">（一） 严禁建设楼堂馆所等土建工程，不得将信息化资金用于办公场所装修、家具购置等。</p>
                                <p className="pl-4 mt-2 text-justify">（二） 除涉密项目外，不得采购非国产密码应用产品。应严格落实信创替代要求，优先采购国产化软硬件产品。</p>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl mb-4">三、 资金使用限制</h3>
                                <p className="pl-4 text-justify">（一） 办公用品购置。如打印机、复印机、传真机、照相机、摄像机、投影仪、碎纸机、移动硬盘、U盘等通用办公设备。</p>
                            </div>
                        </div>
                        
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-10">
                             <div className="rotate-[-45deg] text-gray-400/20 text-9xl font-bold select-none whitespace-nowrap">内部文件 禁止外传</div>
                        </div>
                        <div className="absolute bottom-10 left-0 right-0 text-center text-slate-400 font-serif text-sm">
                          - 1 -
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
  }

  if (!requirement) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 right-0 w-full md:w-[95vw] lg:w-[95vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex overflow-hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* LEFT MAIN CONTENT */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-white transition-all duration-300">
            {/* Top Header Bar */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white shrink-0">
              <div className="text-lg font-bold text-slate-800">
                需求详情
              </div>

              <div className="flex items-center gap-4">
                <button onClick={onClose} className="bg-[#FF4D4F] hover:bg-[#ff7875] text-white rounded p-1 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-white p-8 space-y-8">
              
              {/* Title & Top Info Section */}
              <div className="pb-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <FileText size={24} className="text-blue-600" />
                      <h1 className="text-xl font-bold text-slate-900">{requirement.name}</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                           <span className="text-slate-600 font-medium">待审批</span>
                        </div>

                         {/* Compliance Check Button */}
                        <button 
                          onClick={handleStartCheck}
                          disabled={isChecking}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all shadow-sm
                            ${showCompliancePanel 
                              ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                              : 'bg-white text-slate-700 border border-gray-300 hover:bg-slate-50 hover:text-blue-600'
                            }
                            ${isChecking ? 'cursor-not-allowed opacity-80' : ''}
                          `}
                        >
                          {isChecking ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                          {isChecking ? '正在分析...' : '智能合规性检查'}
                        </button>
                    </div>
                </div>
                
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 text-sm px-1">
                    <div className="flex items-center">
                      <span className="text-slate-500 w-32 shrink-0 text-right mr-4">需求单位名称:</span>
                      <span className="text-slate-800">{requirement.detail.unitName}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-slate-500 w-40 shrink-0 text-right mr-4">负责处室或二级单位:</span>
                      <span className="text-slate-800">{requirement.detail.responsibleDept}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-slate-500 w-24 shrink-0 text-right mr-4">申请时间:</span>
                      <span className="text-slate-800">{requirement.detail.applyTime}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-slate-500 w-32 shrink-0 text-right mr-4">预期项目建设年度:</span>
                      <span className="text-slate-800">{requirement.detail.expectedYear}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-slate-500 w-40 shrink-0 text-right mr-4">预期建设周期:</span>
                      <span className="text-slate-800">{requirement.detail.expectedPeriod}</span>
                    </div>
                </div>
              </div>

              {/* BASIC INFO */}
              <section>
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
                    <h3 className="font-bold text-slate-900 text-base">基本信息</h3>
                    <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                      <ClipboardList size={14} />
                      审批进度
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-20 text-sm px-4">
                    <div className="flex items-baseline">
                        <span className="text-slate-500 w-28 shrink-0 text-right mr-6">需求单位名称:</span>
                        <span className="text-slate-800">{requirement.detail.unitName}</span>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-slate-500 w-28 shrink-0 text-right mr-6">负责人:</span>
                        <div className="text-slate-800">
                            {requirement.detail.manager} 
                            <span className="ml-4 text-slate-800">{requirement.detail.managerPhone}</span>
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-slate-500 w-28 shrink-0 text-right mr-6">联系人:</span>
                        <div className="text-slate-800">
                            {requirement.detail.contact} 
                            <span className="ml-4 text-slate-800">{requirement.detail.contactPhone}</span>
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-slate-500 w-28 shrink-0 text-right mr-6">基于网络:</span>
                        <span className="text-slate-800">{requirement.detail.baseNetwork}</span>
                    </div>
                </div>
              </section>

              {/* PROJECT BUDGET */}
              <section>
                <div className="flex items-center mb-6 pb-2 border-b border-gray-100">
                    <h3 className="font-bold text-slate-900 text-base">项目预算</h3>
                </div>
                
                <div className="text-sm px-4">
                    <div className="flex items-baseline mb-4">
                        <span className="text-slate-500 w-28 shrink-0 text-right mr-6">总预算</span>
                        <span className="text-slate-900 font-bold">{requirement.detail.totalBudget}万元</span>
                    </div>
                    <div className="space-y-4 ml-[136px]">
                        {requirement.detail.budgetSources.map((source, index) => (
                          <div key={index} className="flex items-center gap-20">
                              <span className="text-slate-800 w-40">"{source.name}"</span>
                              <span className="text-slate-500">金额: <span className="text-slate-800">{source.amount}万元</span></span>
                          </div>
                        ))}
                    </div>
                </div>
              </section>

              {/* CONSTRUCTION BASIS */}
              <section>
                <div className="flex items-center mb-6 pb-2 border-b border-gray-100">
                    <h3 className="font-bold text-slate-900 text-base">建设依据</h3>
                </div>
                
                <div className="space-y-10 text-sm px-4">
                    <div>
                      <div className="text-slate-500 mb-4 font-medium">国家、部委颁布的政策文件</div>
                      {requirement.detail.policies.map((policy, idx) => (
                          <div key={idx} className="space-y-3 pl-2">
                            <div className="flex">
                                <span className="text-slate-500 shrink-0 w-24 mr-2">文件名称:</span>
                                <span className="text-slate-800">{policy.name}</span>
                            </div>
                            <div className="flex">
                                <span className="text-slate-500 shrink-0 w-24 mr-2">建设依据描述:</span>
                                <span className="text-slate-600 leading-relaxed text-justify max-w-5xl">{policy.description}</span>
                            </div>
                          </div>
                      ))}
                    </div>

                    <div>
                      <div className="text-slate-500 mb-4 font-medium">省级颁布的政策文件或领导讲话、书面批示、会议纪要和相关文件</div>
                      {requirement.detail.provincialPolicies.map((policy, idx) => (
                          <div key={idx} className="space-y-3 pl-2">
                            <div className="flex">
                                <span className="text-slate-500 shrink-0 w-24 mr-2">文件名称:</span>
                                <span className="text-slate-800">{policy.name}</span>
                            </div>
                            <div className="flex">
                                <span className="text-slate-500 shrink-0 w-24 mr-2">建设依据描述:</span>
                                <span className="text-slate-600 leading-relaxed text-justify max-w-5xl">{policy.description}</span>
                            </div>
                          </div>
                      ))}
                    </div>
                </div>
              </section>

              {/* REQUIREMENT CONTENT */}
              <section>
                <div className="flex items-center mb-6 pb-2 border-b border-gray-100">
                    <h3 className="font-bold text-slate-900 text-base">需求内容</h3>
                </div>
                <div className="px-4">
                  <p className="text-sm text-slate-600 leading-7 whitespace-pre-line text-justify">
                      {requirement.detail.content}
                  </p>
                </div>
              </section>

            </div>

            {/* Footer Actions */}
            <div className="bg-white border-t border-gray-200 p-4 flex justify-end gap-3 shrink-0">
              <button className="px-5 py-2 bg-white border border-gray-300 rounded text-sm text-slate-700 hover:bg-gray-50 transition-colors">
                  会审意见
              </button>
              <button className="px-5 py-2 bg-white border border-gray-300 rounded text-sm text-slate-700 hover:bg-gray-50 transition-colors">
                  发布会审
              </button>
              <button className="px-5 py-2 bg-white border border-gray-300 rounded text-sm text-slate-700 hover:bg-gray-50 transition-colors">
                  驳回
              </button>
              <button className="px-8 py-2 bg-blue-600 rounded text-sm text-white hover:bg-blue-700 shadow-sm transition-colors">
                  通过
              </button>
            </div>
        </div>

        {/* RIGHT COMPLIANCE SIDEBAR - WIDTH 640px */}
        <div 
          className={`flex-shrink-0 bg-[#F8FAFC] border-l border-gray-200 shadow-xl z-20 flex flex-col transition-all duration-300 ease-in-out
             ${showCompliancePanel ? 'w-[640px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}
          `}
        >
           <div className="w-[640px] h-full flex flex-col">
             
             {/* HEADER AREA */}
             <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                   {showHistoryList ? (
                      <button onClick={() => setShowHistoryList(false)} className="text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded-full p-1 -ml-2">
                         <ChevronLeft size={20} />
                      </button>
                   ) : (
                      <ShieldCheck size={20} className="text-blue-700" />
                   )}
                   <span className="font-bold text-blue-700">
                      {showHistoryList ? '合规检查历史记录' : '合规性智能检查'}
                   </span>
                </div>
                
                <div className="flex items-center gap-2">
                   {/* Action Buttons: Only show when not in history list view and not currently checking */}
                   {!showHistoryList && !isChecking && (progress === 100 || risks.length > 0) && (
                      <>
                        <button 
                           onClick={() => alert(`正在导出《${requirement.name}》合规性分析报告...`)}
                           className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-gray-50 rounded transition-colors text-sm font-medium"
                        >
                           <Download size={16} />
                           <span>导出报告</span>
                        </button>
                        <button 
                           onClick={() => setShowProcessDetails(!showProcessDetails)}
                           className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors text-sm font-medium ${showProcessDetails ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-blue-600 hover:bg-gray-50'}`}
                        >
                           <ListChecks size={16} />
                           <span>分析步骤</span>
                        </button>
                        <button 
                           onClick={() => setShowHistoryList(true)}
                           className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-gray-50 rounded transition-colors text-sm font-medium"
                        >
                           <History size={16} />
                           <span>历史记录</span>
                        </button>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      </>
                   )}

                   <button onClick={() => setShowCompliancePanel(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-gray-100 rounded">
                      <X size={18} />
                   </button>
                </div>
             </div>

             {/* MAIN CONTENT AREA */}
             <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
                
                {/* 1. HISTORY LIST VIEW */}
                {showHistoryList ? (
                   <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                      {MOCK_HISTORY_RECORDS.map((record) => (
                         <div 
                           key={record.id}
                           className={`bg-white p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all group
                             ${currentHistoryId === record.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}
                           `}
                           onClick={() => handleSwitchHistory(record)}
                         >
                            <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-slate-400" />
                                  <span className="text-sm font-medium text-slate-700">{record.date}</span>
                                  {record.id === 'current' && (
                                     <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">Current</span>
                                  )}
                               </div>
                               <div className={`text-xs font-bold px-2 py-1 rounded border
                                  ${record.result === 'PASSED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    record.result === 'RISK_FOUND' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}
                               `}>
                                  {record.result === 'PASSED' ? '合规通过' : record.result === 'RISK_FOUND' ? '发现风险' : '建议驳回'}
                               </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                               <div className="flex items-center gap-1.5">
                                  <User size={12} />
                                  <span>操作人: {record.operator}</span>
                               </div>
                               {record.result !== 'PASSED' && (
                                  <div className="font-medium text-orange-600">
                                     {record.riskCount} 处风险项
                                  </div>
                               )}
                            </div>
                         </div>
                      ))}
                   </div>
                ) : (
                  // 2. REGULAR CONTENT (Checking / Results)
                   <div className="space-y-6">
                      
                      {/* History Snapshot Banner */}
                      {currentHistoryId !== 'current' && (
                         <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between animate-in fade-in zoom-in-95">
                            <div className="flex items-center gap-2 text-amber-800 text-sm">
                               <History size={16} />
                               <span>正在查看历史快照: <b>{MOCK_HISTORY_RECORDS.find(h => h.id === currentHistoryId)?.date}</b></span>
                            </div>
                            <button 
                               onClick={() => handleSwitchHistory(MOCK_HISTORY_RECORDS[0])}
                               className="text-xs bg-white border border-amber-300 text-amber-800 px-2 py-1 rounded hover:bg-amber-100 transition-colors"
                            >
                               返回最新
                            </button>
                         </div>
                      )}

                      {/* THINKING PROCESS CARD (Visible when checking OR when explicitly toggled ON) */}
                      {(isChecking || showProcessDetails) && (
                        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm relative animate-in slide-in-from-top-2">
                           <div className="flex justify-between items-center mb-6">
                              <div className="flex items-center gap-2">
                                 {isChecking ? (
                                   <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                      <Loader2 size={18} className="text-blue-600 animate-spin" />
                                   </div>
                                 ) : (
                                   <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                      <BrainCircuit size={18} className="text-green-600" />
                                   </div>
                                 )}
                                 <div>
                                    <div className="text-sm font-bold text-slate-800">
                                       {isChecking ? '正在进行智能扫描...' : '智能分析链路回溯'}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                       {isChecking ? 'AI 正在深度思考中' : '全流程合规检查已完成'}
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2 pr-6">
                                 <span className={`text-2xl font-bold ${isChecking ? 'text-blue-600' : 'text-green-600'}`}>
                                   {Math.round(progress)}%
                                 </span>
                              </div>
                           </div>
                           
                           {/* Progress Bar */}
                           <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-8">
                              <div 
                                 className={`h-full rounded-full transition-all duration-200 ease-out ${isChecking ? 'bg-blue-600' : 'bg-green-500'}`}
                                 style={{ width: `${progress}%` }} 
                              />
                           </div>

                           {/* Vertical Timeline Steps */}
                           <div className="space-y-6 px-2">
                              {steps.map((step, index) => (
                                 <div key={step.id} className="relative flex items-center gap-4">
                                    {/* Connector Line */}
                                    {index !== steps.length - 1 && (
                                       <div className={`absolute left-[15px] top-8 bottom-[-16px] w-0.5 ${step.status === 'COMPLETED' ? 'bg-blue-100' : 'bg-gray-100'}`} />
                                    )}

                                    {/* Status Icon */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 bg-white transition-all duration-300
                                       ${step.status === 'COMPLETED' ? 'border-blue-500 bg-blue-50 text-blue-600' : 
                                         step.status === 'IN_PROGRESS' ? 'border-blue-600 text-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 'border-gray-200 text-gray-300'}
                                    `}>
                                       {step.status === 'COMPLETED' && <CheckCircle2 size={18} strokeWidth={2.5} />}
                                       {step.status === 'IN_PROGRESS' && <Loader2 size={18} className="animate-spin" />}
                                       {step.status === 'PENDING' && <span className="text-xs font-bold font-mono text-slate-400">{index + 1}</span>}
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex-1">
                                       <div className={`text-sm font-medium transition-colors duration-300 ${step.status === 'PENDING' ? 'text-slate-400' : 'text-slate-800'}`}>
                                          {step.label}
                                       </div>
                                       {step.status === 'IN_PROGRESS' && (
                                          <div className="text-xs text-blue-500 mt-1 font-medium animate-pulse flex items-center gap-1">
                                             Thinking...
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                      )}
                      
                      {/* RESULTS SUMMARY (Hidden while checking) */}
                      {!isChecking && risks.length > 0 && (
                         <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                               <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm flex items-start gap-4">
                                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                     <LayoutList size={24} />
                                  </div>
                                  <div>
                                     <div className="text-xs text-slate-500 mb-1">统建清单风险</div>
                                     <div className="text-2xl font-bold text-slate-800">{stats.unifiedListCount} <span className="text-xs font-normal text-slate-400">个</span></div>
                                  </div>
                               </div>
                               <div className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm flex items-start gap-4">
                                   <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                     <Ban size={24} />
                                  </div>
                                  <div>
                                     <div className="text-xs text-slate-500 mb-1">负面清单风险</div>
                                     <div className="text-2xl font-bold text-slate-800">{stats.negativeListCount} <span className="text-xs font-normal text-slate-400">个</span></div>
                                  </div>
                               </div>
                            </div>

                            {/* Risks List */}
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                                {/* Section 1: Unified List */}
                                {renderRiskList("统建清单风险发现", risks.filter(r => r.category === 'UNIFIED_LIST'))}
                                
                                {/* Section 2: Negative List */}
                                {renderRiskList("负面清单风险发现", risks.filter(r => r.category === 'NEGATIVE_LIST'))}
                            </div>
                         </div>
                      )}

                      {!isChecking && risks.length === 0 && progress === 100 && (
                          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                              <CheckCircle2 size={48} className="text-green-500 mb-4" />
                              <h3 className="text-lg font-bold text-slate-800 mb-2">未发现合规性风险</h3>
                              <p className="text-slate-500 text-sm max-w-xs text-center">系统未扫描到违反统建清单或负面清单的内容，项目合规性良好。</p>
                          </div>
                      )}
                   </div>
                )}
             </div>
           </div>
        </div>
      
      {/* 3. NEW DETAIL MODALS */}
      {renderUnifiedListModal()}
      {renderNegativeListModal()}

      </div>
    </>
  );
};
