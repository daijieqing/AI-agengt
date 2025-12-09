
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Bot, 
  Search, 
  FileText, 
  ShieldAlert, 
  BarChart4, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  LayoutList, 
  Ban, 
  MapPin, 
  BookOpen, 
  AlertTriangle,
  Sparkles,
  Building2,
  Calendar,
  Wallet,
  History,
  LayoutGrid,
  ChevronDown, 
  RotateCcw,
  MessageSquareText,
  ListTree,
  Siren,
  Send,
  User,
  Download,
  Plus,
  X,
  PieChart,
  Award,
  AlertCircle,
  ArrowRight,
  Printer,
  Check,
  Table,
  PlusCircle,
  Trash2,
  Info,
  FileJson,
  Settings2,
  TrendingUp,
  Scale,
  Target,
  Lightbulb
} from 'lucide-react';
import { Requirement, CheckStep, ComplianceRisk } from '../types';
import { MOCK_REQUIREMENTS } from '../mockData';

// --- SHARED UTILS ---
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.replace(/<br\s*\/?>/gi, '\n').split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
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

// --- TYPES ---
type AgentScenario = 'NONE' | 'DUPLICATION' | 'COMPLIANCE' | 'REPORT' | 'QA' | 'DECOMPOSITION' | 'RISK_WARNING';
type FlowState = 'SCENARIO_SELECT' | 'PROJECT_SELECT' | 'ANALYSIS_WORKBENCH' | 'QA_CHAT' | 'REPORT_FLOW';
type ProjectListTab = 'ALL' | 'HISTORY';
type ReportStep = 'DASHBOARD' | 'CONFIG_DIMENSIONS' | 'GENERATING' | 'RESULT';

interface HistoryRecord {
  id: string;
  reqId: string;
  analysisTime: string;
  riskCount: number;
  status: 'PASSED' | 'RISK_FOUND' | 'REJECTED';
  duration: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isThinking?: boolean;
}

interface EvaluationDimension {
  id: string;
  name: string;
  description: string;
  type: 'SUMMARY' | 'LIST' | 'CHART' | 'TEXT'; // For UI rendering hint
  isCustom?: boolean;
}

interface ReportHistoryRecord {
  id: string;
  taskName: string;
  projectName: string;
  projectCount: number;
  score: number;
  date: string;
  type: 'SINGLE' | 'MULTI';
}

// --- MOCK DATA ---
const MOCK_HISTORY: HistoryRecord[] = [
  { id: 'hist_001', reqId: 'req_001', analysisTime: '2025-12-01 14:30:22', riskCount: 3, status: 'RISK_FOUND', duration: '45s' },
  { id: 'hist_002', reqId: 'req_002', analysisTime: '2025-11-20 09:15:00', riskCount: 0, status: 'PASSED', duration: '28s' },
  { id: 'hist_003', reqId: 'req_003', analysisTime: '2025-10-05 16:10:33', riskCount: 5, status: 'REJECTED', duration: '52s' }
];

const INITIAL_STEPS: CheckStep[] = [
  { id: '1', label: '加载合规性知识库', status: 'PENDING' },
  { id: '2', label: '统建清单智能比对分析', status: 'PENDING' },
  { id: '3', label: '负面清单规则扫描', status: 'PENDING' },
  { id: '4', label: '生成风险评估报告', status: 'PENDING' },
];

const SUGGESTED_QUESTIONS = [
  "政务信息化项目申报需要准备哪些核心材料？",
  "如何界定项目是否属于'重复建设'范畴？",
  "申请省级政务云资源的具体流程是什么？",
  "2025年发布的最新验收标准有哪些变化？"
];

const EVALUATION_TASKS = [
  "2024年度省级政务信息化项目绩效评价",
  "2023年度数字政府建设效能回顾评价",
  "“十四五”规划中期评估专项任务"
];

// Updated Dimensions to reflect "Report Sections" logic
const INITIAL_DIMENSIONS: EvaluationDimension[] = [
  { id: 'd_highlights', name: '绩效亮点分析', description: '基于指标得分，自动提炼项目建设成效突出的方面。', type: 'LIST' },
  { id: 'd_issues', name: '问题短板回溯', description: '分析扣分项及薄弱环节，追溯问题产生的根本原因。', type: 'LIST' },
  { id: 'd_finance', name: '资金执行情况', description: '分析预算执行率、资金使用合规性及审计结果。', type: 'CHART' },
  { id: 'd_horizontal', name: '横向对比分析', description: '与同类项目或同部门历史项目进行横向对标分析。', type: 'CHART' },
  { id: 'd_suggestion', name: '整改与优化建议', description: '针对发现的问题，给出具体的整改措施和优化方向。', type: 'TEXT' },
];

const POOL_DIMENSIONS: EvaluationDimension[] = [
  { id: 'd_vertical', name: '纵向趋势分析', description: '对比项目建设前后的业务指标变化趋势。', type: 'CHART' },
  { id: 'd_satisfaction', name: '用户满意度调查', description: '汇总问卷调查及工单反馈，分析最终用户的主观评价。', type: 'CHART' },
  { id: 'd_innovation', name: '创新示范效应', description: '评估项目在技术架构或业务模式上的创新性。', type: 'TEXT' },
  { id: 'd_security', name: '安全合规状况', description: '等保测评、密码应用及漏洞修复情况分析。', type: 'LIST' },
  { id: 'd_data', name: '数据共享开放', description: '数据资源编目挂接及供需对接响应情况。', type: 'CHART' },
];

const REPORT_HISTORY_MOCK: ReportHistoryRecord[] = [
  { id: 'rh_01', taskName: '2024年度省级政务信息化项目绩效评价', projectName: '智慧教育资源共享平台项目', projectCount: 1, score: 88.5, date: '2025-12-05', type: 'SINGLE' },
  { id: 'rh_02', taskName: '2024年度省级政务信息化项目绩效评价', projectName: '社会治安防控体系...等3个项目', projectCount: 3, score: 82.0, date: '2025-12-04', type: 'MULTI' },
];

const PROJECT_TYPES = ['业务应用类', '基础设施类', '数据资源类', '网络安全类'];

export const SmartAgentCenter: React.FC = () => {
  const [currentFlow, setCurrentFlow] = useState<FlowState>('SCENARIO_SELECT');
  const [activeScenario, setActiveScenario] = useState<AgentScenario>('NONE');
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);

  // Project Selection State (Compliance)
  const [activeTab, setActiveTab] = useState<ProjectListTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Analysis Logic State (Compliance)
  const [isChecking, setIsChecking] = useState(false);
  const [steps, setSteps] = useState<CheckStep[]>(INITIAL_STEPS);
  const [progress, setProgress] = useState(0);
  const [risks, setRisks] = useState<ComplianceRisk[]>([]);
  const [isHistoryView, setIsHistoryView] = useState(false);

  // Report Generation State
  const [reportStep, setReportStep] = useState<ReportStep>('DASHBOARD');
  const [reportDashboardTab, setReportDashboardTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [selectedReportTask, setSelectedReportTask] = useState(EVALUATION_TASKS[0]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  
  // Advanced Dimension State
  const [selectedDimensions, setSelectedDimensions] = useState<EvaluationDimension[]>(INITIAL_DIMENSIONS);
  const [availableDimensions, setAvailableDimensions] = useState<EvaluationDimension[]>(POOL_DIMENSIONS);
  const [customDimName, setCustomDimName] = useState('');
  const [customDimDesc, setCustomDimDesc] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Report Result View State
  const [resultViewMode, setResultViewMode] = useState<'ANALYSIS' | 'DATA'>('ANALYSIS');
  const [viewingReportHistory, setViewingReportHistory] = useState<ReportHistoryRecord | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是政务智能问答助手。已接入最新政务知识库，您可以询问关于**项目申报、审批流程、采购规范、验收标准**等各类问题。',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Stats
  const stats = useMemo(() => {
    return {
      unifiedListCount: risks.filter(r => r.category === 'UNIFIED_LIST').length,
      negativeListCount: risks.filter(r => r.category === 'NEGATIVE_LIST').length,
    };
  }, [risks]);

  const availableYears = useMemo(() => {
    const years = new Set(MOCK_REQUIREMENTS.map(r => r.year));
    return Array.from(years).sort().reverse();
  }, []);

  const availableUnits = useMemo(() => {
    const units = new Set(MOCK_REQUIREMENTS.map(r => r.unit));
    return Array.from(units).sort();
  }, []);

  // Filtered Projects Logic
  const filteredProjects = useMemo(() => {
    return MOCK_REQUIREMENTS.filter(req => {
      const matchSearch = req.name.toLowerCase().includes(searchTerm.toLowerCase()) || req.unit.toLowerCase().includes(searchTerm.toLowerCase());
      const matchYear = selectedYear === 'all' || req.year === selectedYear;
      const matchUnit = selectedUnit === 'all' || req.unit === selectedUnit;
      const matchType = selectedType === 'all' || req.projectType === selectedType;
      const matchStatus = selectedStatus === 'all' || req.status === selectedStatus;
      return matchSearch && matchYear && matchUnit && matchType && matchStatus;
    });
  }, [searchTerm, selectedYear, selectedUnit, selectedType, selectedStatus]);

  const filteredHistory = useMemo(() => {
    return MOCK_HISTORY.map(hist => ({ ...hist, req: MOCK_REQUIREMENTS.find(r => r.id === hist.reqId) })).filter(item => {
      if (!item.req) return false;
      const matchSearch = item.req.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.req.unit.toLowerCase().includes(searchTerm.toLowerCase());
      const matchYear = selectedYear === 'all' || item.req.year === selectedYear;
      const matchUnit = selectedUnit === 'all' || item.req.unit === selectedUnit;
      let historyStatusLabel = '';
      if (item.status === 'PASSED') historyStatusLabel = '合规通过';
      if (item.status === 'RISK_FOUND') historyStatusLabel = '发现风险';
      if (item.status === 'REJECTED') historyStatusLabel = '建议驳回';
      const matchStatus = selectedStatus === 'all' || historyStatusLabel === selectedStatus;
      return matchSearch && matchYear && matchUnit && matchStatus;
    });
  }, [searchTerm, selectedYear, selectedUnit, selectedStatus]);

  useEffect(() => {
    if (currentFlow === 'QA_CHAT') {
      scrollToBottom();
    }
  }, [chatMessages, currentFlow]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScenarioSelect = (scenario: AgentScenario) => {
    setActiveScenario(scenario);
    if (scenario === 'COMPLIANCE') {
      setCurrentFlow('PROJECT_SELECT');
    } else if (scenario === 'QA') {
      setCurrentFlow('QA_CHAT');
    } else if (scenario === 'REPORT') {
      setCurrentFlow('REPORT_FLOW');
      setReportStep('DASHBOARD');
      setReportDashboardTab('NEW');
      setSelectedProjectIds([]);
      setViewingReportHistory(null);
      setSelectedDimensions(INITIAL_DIMENSIONS); // Reset dimensions
      setAvailableDimensions(POOL_DIMENSIONS);
    } else {
      alert("该智能体功能正在训练中，请先体验[智能合规风险分析]、[智能问答]或[智能分析报告]");
    }
  };

  const handleBackToHome = () => {
    setCurrentFlow('SCENARIO_SELECT');
    setActiveScenario('NONE');
    setViewingReportHistory(null);
    resetFilters();
  };

  // Report Dimension Logic
  const handleRemoveDimension = (dimId: string) => {
    const dimToRemove = selectedDimensions.find(d => d.id === dimId);
    if (!dimToRemove) return;
    
    setSelectedDimensions(prev => prev.filter(d => d.id !== dimId));
    setAvailableDimensions(prev => [...prev, dimToRemove]);
  };

  const handleAddDimension = (dimId: string) => {
    const dimToAdd = availableDimensions.find(d => d.id === dimId);
    if (!dimToAdd) return;

    setAvailableDimensions(prev => prev.filter(d => d.id !== dimId));
    setSelectedDimensions(prev => [...prev, dimToAdd]);
  };

  const handleCreateCustomDimension = () => {
    if (customDimName && customDimDesc) {
      const newDim: EvaluationDimension = {
        id: `custom_${Date.now()}`,
        name: customDimName,
        description: customDimDesc,
        type: 'TEXT',
        isCustom: true
      };
      setSelectedDimensions([...selectedDimensions, newDim]);
      setCustomDimName('');
      setCustomDimDesc('');
      setIsAddingCustom(false);
    }
  };

  const startReportGeneration = () => {
    setReportStep('GENERATING');
    setTimeout(() => {
      setReportStep('RESULT');
      setResultViewMode('ANALYSIS');
    }, 2500);
  };

  const handleViewReportHistory = (record: ReportHistoryRecord) => {
    setViewingReportHistory(record);
    setSelectedReportTask(record.taskName);
    // Mock selecting some project IDs for visual consistency
    setSelectedProjectIds(['req_001']); 
    setReportStep('RESULT');
    setResultViewMode('ANALYSIS');
  };

  // --- COMPLIANCE HANDLERS ---
  const handleProjectSelect = (req: Requirement, isHistory = false) => {
    setSelectedRequirement(req);
    setCurrentFlow('ANALYSIS_WORKBENCH');
    setIsHistoryView(isHistory);
    startAnalysisSimulation(isHistory);
  };

  const handleBackToProjectList = () => {
    setCurrentFlow('PROJECT_SELECT');
    setSelectedRequirement(null);
    setRisks([]);
    setIsHistoryView(false);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedYear('all');
    setSelectedUnit('all');
    setSelectedType('all');
    setSelectedStatus('all');
  };

  // --- QA HANDLERS ---
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsChatThinking(true);
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "收到您的问题。这是智能助手的模拟回复。",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMsg]);
      setIsChatThinking(false);
    }, 1500);
  };

  const startAnalysisSimulation = (instant = false) => {
    // Reusing the same simulation logic as before
    setSteps(instant 
      ? INITIAL_STEPS.map(s => ({ ...s, status: 'COMPLETED' })) 
      : INITIAL_STEPS.map((s, i) => i === 0 ? { ...s, status: 'IN_PROGRESS' } : { ...s, status: 'PENDING' })
    );
    setProgress(instant ? 100 : 0);
    setRisks([]); 
    
    // MOCK RISKS DATA
    const mockRisks: ComplianceRisk[] = [
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
        id: 'r5',
        category: 'NEGATIVE_LIST',
        title: '设备购置违规',
        level: 'LOW',
        involvedContent: '预算包含：办公电脑20台、打印机5台、大屏显示器1个、碎纸机2台。',
        hitClause: '五、（一）/（二）<br>单独购置通用办公设备...包括办公电脑...显示大屏...碎纸机等。',
        suggestion: '预警： 此类物品不属于政务信息化项目资金支持范围。 <br>建议： 请从信息化项目预算中剔除，通过**单位公用经费**或**通用资产配置**渠道解决。'
      },
    ];

    if (instant) {
      setRisks(mockRisks);
      return;
    }

    setIsChecking(true);
    let currentStep = 0;
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      if (currentProgress > 100) currentProgress = 100;
      setProgress(currentProgress);
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
        setRisks(mockRisks);
      }
    }, 40);
  };

  // Helper for compliance risks rendering
  const renderRiskList = (title: string, items: ComplianceRisk[]) => {
     if (items.length === 0) return null;
     return (
        <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-slate-50 py-2 z-10 border-b border-gray-200">
               <AlertTriangle size={16} className="text-orange-500" />
               <h3 className="font-bold text-slate-700 text-sm">{title} ({items.length})</h3>
            </div>
            <div className="space-y-4">
              {items.map((risk, index) => (
                 <div key={risk.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex">
                       <div className="w-10 flex items-center justify-center bg-gray-50 text-slate-400 font-mono text-sm border-r border-gray-100 shrink-0">
                          {index + 1}
                       </div>
                       <div className="flex-1 p-4">
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
                          <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-100">
                             <div className="flex justify-between items-center mb-2">
                                <div className="text-xs font-semibold text-slate-500">
                                    {risk.category === 'UNIFIED_LIST' ? '命中统建清单项目' : '命中负面清单条款'}
                                </div>
                                <button className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-2.5 py-1 rounded-full transition-colors font-medium">
                                    <BookOpen size={12} />
                                    {risk.category === 'UNIFIED_LIST' ? '统建清单详情' : '规则详情'}
                                </button>
                             </div>
                             <div className="text-sm text-slate-700 leading-relaxed">
                                <FormattedText text={risk.hitClause || ''} />
                             </div>
                          </div>
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

  // --- REPORT RESULT COMPONENT GENERATOR ---
  const renderDimensionContent = (dim: EvaluationDimension) => {
    // MOCK GENERATOR based on dimension ID or type
    
    // 1. Highlights
    if (dim.id === 'd_highlights') {
      return (
        <div className="bg-emerald-50/50 p-5 rounded-lg border border-emerald-100">
           <div className="text-sm text-slate-700 leading-relaxed mb-4 text-justify">
              经智能分析，项目在建设成效方面表现突出。系统架构采用了微服务设计，保障了高并发场景下的稳定性。同时，项目按期交付并投入使用，核心业务覆盖率达到100%。
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 text-sm text-slate-800 bg-white p-3 rounded border border-emerald-100 shadow-sm">
                 <Award size={16} className="text-emerald-500 mt-0.5" />
                 <span>业务覆盖率达 100%，超额完成预定目标</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-800 bg-white p-3 rounded border border-emerald-100 shadow-sm">
                 <Award size={16} className="text-emerald-500 mt-0.5" />
                 <span>系统可用性达 99.9%，远高于行业平均水平</span>
              </div>
           </div>
        </div>
      );
    }

    // 2. Issues / Backtracking
    if (dim.id === 'd_issues') {
      return (
        <div className="bg-orange-50/50 p-5 rounded-lg border border-orange-100">
           <div className="text-sm text-slate-700 leading-relaxed mb-4 text-justify">
              虽然总体评价良好，但在细节层面仍存在改进空间。主要集中在数据资源的编目规范性和用户操作手册的更新及时性上。
           </div>
           <ul className="space-y-3">
               <li className="flex gap-3 text-sm text-slate-700">
                  <AlertCircle className="text-orange-500 mt-0.5 shrink-0" size={16} />
                  <span>数据资源目录更新滞后，与实际库表结构存在差异。</span>
               </li>
               <li className="flex gap-3 text-sm text-slate-700">
                  <AlertCircle className="text-orange-500 mt-0.5 shrink-0" size={16} />
                  <span>部分模块缺乏详细的用户操作指引，导致初期工单量较大。</span>
               </li>
           </ul>
        </div>
      );
    }

    // 3. Horizontal Comparison (Chart)
    if (dim.id === 'd_horizontal') {
      return (
        <div className="p-5 border border-gray-100 rounded-lg bg-white shadow-sm">
           <div className="text-sm text-slate-600 mb-4">
             与同类“业务应用类”项目相比，本项目在<span className="font-bold text-slate-800">资金使用效率</span>和<span className="font-bold text-slate-800">建设周期控制</span>上处于领先地位。
           </div>
           {/* Mock Bar Chart */}
           <div className="space-y-4">
              <div>
                 <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>资金合规性得分</span>
                    <span>本项目: 98 / 平均: 92</span>
                 </div>
                 <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-500 w-[92%] opacity-50"></div>
                    <div className="h-full bg-blue-600 w-[6%]"></div>
                 </div>
              </div>
              <div>
                 <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>功能完备度得分</span>
                    <span>本项目: 95 / 平均: 88</span>
                 </div>
                 <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                     <div className="h-full bg-emerald-500 w-[88%] opacity-50"></div>
                     <div className="h-full bg-emerald-600 w-[7%]"></div>
                 </div>
              </div>
           </div>
        </div>
      );
    }

    // 4. Finance (Chart)
    if (dim.id === 'd_finance') {
      return (
        <div className="p-5 border border-gray-100 rounded-lg bg-white shadow-sm flex items-center gap-8">
           <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
              <div className="absolute inset-0 rounded-full border-8 border-blue-500 border-l-transparent -rotate-45"></div>
              <div className="text-center">
                 <div className="text-xs text-slate-400">执行率</div>
                 <div className="text-xl font-bold text-slate-800">96.2%</div>
              </div>
           </div>
           <div className="flex-1 space-y-3">
              <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                 <span className="text-slate-500">预算总额</span>
                 <span className="font-mono font-medium">1,200 万元</span>
              </div>
              <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                 <span className="text-slate-500">实际支出</span>
                 <span className="font-mono font-medium">1,154.4 万元</span>
              </div>
              <div className="flex justify-between text-sm">
                 <span className="text-slate-500">结余资金</span>
                 <span className="font-mono font-medium text-green-600">45.6 万元</span>
              </div>
           </div>
        </div>
      );
    }

    // Default Text
    return (
       <div className="p-5 border border-gray-100 rounded-lg bg-gray-50">
          <p className="text-sm text-slate-600 leading-relaxed text-justify">
             智能体对该维度的综合评估显示，项目符合预期要求。针对该维度的细化指标分析，建议关注后续的长期运营效果及数据积累情况。{dim.isCustom ? '（注：这是针对自定义维度的通用AI生成描述）' : ''}
          </p>
       </div>
    );
  };

  // --- RENDERERS FOR REPORT FLOW ---

  // 1. Dashboard (Project Selection or History)
  const renderReportDashboard = () => (
    <div className="flex flex-col h-full bg-slate-50">
       {/* Header */}
       <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0 gap-4 justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
             <button onClick={handleBackToHome} className="p-2 hover:bg-gray-100 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
             </button>
             <div className="flex items-center gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
                   <BarChart4 size={20} />
                </div>
                <div>
                   <div className="text-base font-bold text-slate-800 leading-tight">绩效评价分析报告</div>
                   <div className="text-xs text-slate-500">智能生成多维度绩效分析报告</div>
                </div>
             </div>
          </div>
       </div>

       {/* TABS & FILTERS */}
       <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
           <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-8 border-b border-gray-100 mb-6">
                 <button 
                   onClick={() => setReportDashboardTab('NEW')}
                   className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${reportDashboardTab === 'NEW' ? 'text-emerald-600 border-emerald-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                 >
                    <PlusCircle size={18} />
                    发起新评价
                 </button>
                 <button 
                   onClick={() => setReportDashboardTab('HISTORY')}
                   className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${reportDashboardTab === 'HISTORY' ? 'text-emerald-600 border-emerald-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                 >
                    <History size={18} />
                    评价历史记录
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-normal">{REPORT_HISTORY_MOCK.length}</span>
                 </button>
              </div>

              {reportDashboardTab === 'NEW' && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    {/* Task Selector */}
                    <div className="flex items-center gap-4">
                       <div className="w-1/3">
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">选择评价任务</label>
                          <div className="relative">
                             <select 
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-sm text-slate-700 cursor-pointer"
                                value={selectedReportTask}
                                onChange={(e) => setSelectedReportTask(e.target.value)}
                             >
                                {EVALUATION_TASKS.map(task => (
                                   <option key={task} value={task}>{task}</option>
                                ))}
                             </select>
                             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                          </div>
                       </div>
                       <div className="flex-1">
                          <label className="text-xs font-semibold text-slate-500 mb-1 block">检索项目</label>
                          <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                             <input 
                                type="text" 
                                placeholder="输入项目名称关键词..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                             />
                          </div>
                       </div>
                    </div>
                 </div>
              )}
           </div>
       </div>

       {/* CONTENT AREA */}
       <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto min-h-[500px]">
             
             {/* 1. NEW EVALUATION LIST */}
             {reportDashboardTab === 'NEW' && (
                <div className="animate-in fade-in">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                         <LayoutList size={16} /> 可选项目列表
                      </h3>
                      <span className="text-xs text-slate-500">支持多选，系统将自动生成综合评价报告</span>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {MOCK_REQUIREMENTS.map(req => {
                          const isSelected = selectedProjectIds.includes(req.id);
                          // Simple client-side search filter for demo
                          if (searchTerm && !req.name.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                          return (
                             <div 
                                key={req.id}
                                onClick={() => setSelectedProjectIds(prev => prev.includes(req.id) ? prev.filter(id => id !== req.id) : [...prev, req.id])}
                                className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col group h-full
                                   ${isSelected 
                                      ? 'bg-emerald-50 border-emerald-500 shadow-md transform -translate-y-1' 
                                      : 'bg-white border-gray-100 hover:border-emerald-300 hover:shadow-md'
                                   }
                                `}
                             >
                                <div className="flex justify-between items-start mb-3">
                                   <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'}`}>
                                      {isSelected && <Check size={14} className="text-white" />}
                                   </div>
                                   <span className="text-xs text-slate-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">{req.year}</span>
                                </div>
                                <h4 className={`font-bold text-sm mb-3 line-clamp-2 ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                                   {req.name}
                                </h4>
                                <div className="mt-auto space-y-2">
                                   <div className="flex items-center gap-2 text-xs text-slate-500">
                                      <Building2 size={12} /> <span className="truncate">{req.unit}</span>
                                   </div>
                                   <div className="flex items-center gap-2 text-xs text-slate-500">
                                      <Wallet size={12} /> <span className="font-mono">{req.budget}万</span>
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                   </div>
                </div>
             )}

             {/* 2. HISTORY LIST */}
             {reportDashboardTab === 'HISTORY' && (
                <div className="animate-in fade-in">
                   <div className="grid grid-cols-1 gap-4">
                      {REPORT_HISTORY_MOCK.map((record) => (
                         <div 
                           key={record.id}
                           onClick={() => handleViewReportHistory(record)}
                           className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 cursor-pointer transition-all flex items-center justify-between group"
                         >
                            <div className="flex items-center gap-6">
                               <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100 group-hover:scale-110 transition-transform">
                                  {record.score}
                               </div>
                               <div>
                                  <div className="flex items-center gap-2 mb-1">
                                     <span className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">
                                        {record.projectName}
                                     </span>
                                     <span className={`text-[10px] px-2 py-0.5 rounded-full border ${record.type === 'MULTI' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                        {record.type === 'MULTI' ? `多项目综合 (${record.projectCount})` : '单项目评价'}
                                     </span>
                                  </div>
                                  <div className="text-sm text-slate-500">{record.taskName}</div>
                               </div>
                            </div>
                            <div className="flex items-center gap-8 text-sm text-slate-400">
                               <div className="flex items-center gap-2">
                                  <Calendar size={14} /> {record.date}
                               </div>
                               <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-500" />
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
       </div>

       {/* FOOTER ACTION (Only for NEW tab) */}
       {reportDashboardTab === 'NEW' && (
          <div className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-8 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
             <div className="text-sm text-slate-600">
                已选择 <span className="font-bold text-emerald-600 text-lg mx-1">{selectedProjectIds.length}</span> 个项目
             </div>
             <button 
                onClick={() => setReportStep('CONFIG_DIMENSIONS')}
                disabled={selectedProjectIds.length === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold transition-all shadow-sm"
             >
                下一步：配置分析维度 <ArrowRight size={16} />
             </button>
          </div>
       )}
    </div>
  );

  // 2. Dimension Config Step
  const renderConfigDimensions = () => (
    <div className="flex flex-col h-full bg-slate-50">
       {/* Header */}
       <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0 gap-4 justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
             <button onClick={() => setReportStep('DASHBOARD')} className="p-2 hover:bg-gray-100 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
             </button>
             <div className="flex items-center gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
                   <Settings2 size={20} />
                </div>
                <div>
                   <div className="text-base font-bold text-slate-800 leading-tight">配置分析维度</div>
                   <div className="text-xs text-slate-500">定制化生成报告的章节结构</div>
                </div>
             </div>
          </div>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto flex gap-8 h-full">
             
             {/* LEFT: SELECTED DIMENSIONS */}
             <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <ListTree className="text-emerald-500" /> 
                      已选报告章节 ({selectedDimensions.length})
                   </h3>
                   <button onClick={() => setIsAddingCustom(true)} className="text-xs flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition-colors">
                      <Plus size={14} /> 自定义章节
                   </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                   {selectedDimensions.map((dim, idx) => (
                      <div key={dim.id} className="group bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 p-4 rounded-lg transition-all flex items-start gap-4">
                         <div className="w-6 h-6 rounded-full bg-white border border-gray-200 text-slate-400 flex items-center justify-center text-xs font-mono shrink-0 mt-0.5">
                            {idx + 1}
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-start">
                               <h4 className="font-bold text-slate-800 text-sm mb-1">{dim.name}</h4>
                               {dim.isCustom && <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 rounded border border-blue-100">自定义</span>}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{dim.description}</p>
                         </div>
                         <button 
                            onClick={() => handleRemoveDimension(dim.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="移除此章节"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   ))}
                   
                   {/* Custom Dimension Input Form */}
                   {isAddingCustom && (
                      <div className="bg-white border-2 border-dashed border-emerald-300 p-4 rounded-lg animate-in fade-in zoom-in-95">
                         <div className="mb-3">
                            <input 
                              type="text" 
                              placeholder="输入章节名称 (如: 创新应用能力分析)" 
                              className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                              value={customDimName}
                              onChange={(e) => setCustomDimName(e.target.value)}
                              autoFocus
                            />
                         </div>
                         <div className="mb-3">
                            <textarea 
                              placeholder="输入该章节的分析重点描述..." 
                              className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none resize-none h-20"
                              value={customDimDesc}
                              onChange={(e) => setCustomDimDesc(e.target.value)}
                            />
                         </div>
                         <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAddingCustom(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-gray-100 rounded">取消</button>
                            <button onClick={handleCreateCustomDimension} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700">确认添加</button>
                         </div>
                      </div>
                   )}
                </div>
             </div>

             {/* RIGHT: AVAILABLE DIMENSIONS */}
             <div className="w-80 bg-slate-100 rounded-xl p-6 border border-slate-200 flex flex-col">
                <h3 className="font-bold text-slate-600 text-sm mb-4 flex items-center gap-2">
                   <RotateCcw size={14} /> 可添加章节
                </h3>
                {availableDimensions.length > 0 ? (
                   <div className="space-y-3 overflow-y-auto flex-1">
                      {availableDimensions.map(dim => (
                         <div key={dim.id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-emerald-400 shadow-sm transition-all group">
                            <div className="flex justify-between items-center mb-1">
                               <h4 className="font-bold text-slate-700 text-sm">{dim.name}</h4>
                               <button 
                                  onClick={() => handleAddDimension(dim.id)}
                                  className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-full transition-colors"
                                  title="添加"
                               >
                                  <PlusCircle size={16} />
                               </button>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2">{dim.description}</p>
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="text-center text-slate-400 text-xs py-10">
                      没有更多可选章节
                   </div>
                )}
             </div>
          </div>
       </div>

       {/* Footer */}
       <div className="h-16 bg-white border-t border-gray-200 flex items-center justify-end px-8 shrink-0 z-40">
          <button 
             onClick={startReportGeneration}
             className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-200 hover:-translate-y-1"
          >
             <Sparkles size={18} />
             开始生成报告
          </button>
       </div>
    </div>
  );

  // 3. Generating Step (Existing Logic)
  const renderGenerating = () => (
    <div className="flex flex-col h-full bg-white items-center justify-center">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
           <Bot className="absolute inset-0 m-auto text-emerald-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">正在生成绩效评价分析报告</h2>
        <p className="text-slate-500 mb-8">AI 正在深度分析 {selectedProjectIds.length} 个项目的 {selectedDimensions.length} 个分析维度...</p>
        
        <div className="w-64 space-y-3">
           <div className="flex items-center gap-3 text-sm text-slate-600">
              <CheckCircle2 size={16} className="text-emerald-500" /> 读取项目基础资料
           </div>
           <div className="flex items-center gap-3 text-sm text-slate-600">
              <CheckCircle2 size={16} className="text-emerald-500" /> 撰写各章节分析结论
           </div>
           <div className="flex items-center gap-3 text-sm text-slate-600 animate-pulse">
              <Loader2 size={16} className="animate-spin text-emerald-500" /> 生成图表与整改建议
           </div>
        </div>
    </div>
  );

  // 4. Result Step
  const renderResult = () => {
    const isMulti = selectedProjectIds.length > 1 || viewingReportHistory?.type === 'MULTI';
    const reportTitle = viewingReportHistory ? viewingReportHistory.taskName : selectedReportTask;
    const isHistoryMode = !!viewingReportHistory;

    return (
       <div className="flex flex-col h-full bg-slate-50">
          {/* Header */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0 gap-4 justify-between sticky top-0 z-30 shadow-sm">
             <div className="flex items-center gap-4">
                <button onClick={() => setReportStep('DASHBOARD')} className="p-2 hover:bg-gray-100 rounded-full text-slate-500 transition-colors">
                   <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                   <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
                      <FileText size={20} />
                   </div>
                   <div>
                      <div className="text-base font-bold text-slate-800 leading-tight">分析报告预览</div>
                      <div className="text-xs text-slate-500">
                         {isHistoryMode ? <span className="text-amber-600 font-medium flex items-center gap-1"><History size={10}/> 历史快照</span> : '刚刚生成'} 
                         <span className="mx-1">|</span> 
                         {isMulti ? '多项目综合报告' : '单项目详细报告'}
                      </div>
                   </div>
                </div>
             </div>

             {/* View Toggle & Actions */}
             <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                    <button 
                       onClick={() => setResultViewMode('ANALYSIS')}
                       className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${resultViewMode === 'ANALYSIS' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       <Bot size={14} /> 智能解读
                    </button>
                    <button 
                       onClick={() => setResultViewMode('DATA')}
                       className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${resultViewMode === 'DATA' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       <Table size={14} /> 原始数据
                    </button>
                </div>
                
                <div className="h-4 w-px bg-gray-300"></div>

                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                   <Download size={16} /> 导出报告
                </button>
             </div>
          </div>

          {/* Report Body */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
             
             {/* MODE: INTELLIGENT ANALYSIS */}
             {resultViewMode === 'ANALYSIS' && (
               <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-none min-h-[1000px] p-12 relative animate-in fade-in slide-in-from-bottom-4">
                  {/* Decor */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                  
                  {/* Title */}
                  <div className="text-center mb-10 border-b-2 border-gray-100 pb-8">
                     <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">
                        {reportTitle}
                        <span className="block text-xl font-normal mt-3 text-slate-600">{isMulti ? '综合绩效评价分析报告' : '项目绩效评价分析报告'}</span>
                     </h1>
                     <div className="text-slate-400 font-serif text-sm">
                        {isHistoryMode ? `评价日期: ${viewingReportHistory.date}` : `生成日期: ${new Date().toLocaleDateString()}`}
                     </div>
                  </div>

                  <div className="space-y-12">
                     {/* 1. Overall Intelligence Box */}
                     <section className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><Bot size={80} /></div>
                        <h2 className="text-lg font-bold text-emerald-900 mb-3 flex items-center gap-2">
                           <Sparkles size={18} className="text-emerald-500" /> 
                           智能总评
                        </h2>
                        <div className="text-slate-700 leading-relaxed text-sm text-justify font-medium">
                           {isMulti 
                              ? "本次评价覆盖多个重点信息化项目。经AI综合分析，整体绩效表现良好，资金执行率与建设目标完成度均达到预期。基础设施类项目展现出较强的底层支撑能力，但业务应用类项目在“数据共享”维度普遍存在短板。建议后续加强跨部门数据归集考核，并提升系统的用户体验设计。" 
                              : `该项目总体建设成效显著，综合评分为 ${viewingReportHistory?.score || 88} 分。项目核心功能按期交付，尤其在“资金执行”方面表现优异。然而，智能体扫描发现项目在验收文档规范性上存在瑕疵，建议尽快补充第三方测试报告。`}
                        </div>
                     </section>

                     {/* 2. Key Metrics Grid (Overall) */}
                     <section>
                        <div className="grid grid-cols-4 gap-4">
                           <div className="p-5 bg-white border border-gray-100 rounded-xl text-center shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                              <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">综合得分</div>
                              <div className="text-3xl font-bold text-emerald-600">{viewingReportHistory?.score || 88.5}</div>
                           </div>
                           <div className="p-5 bg-white border border-gray-100 rounded-xl text-center shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                              <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">资金执行率</div>
                              <div className="text-3xl font-bold text-blue-600">96.2%</div>
                           </div>
                           <div className="p-5 bg-white border border-gray-100 rounded-xl text-center shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                              <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">目标达成</div>
                              <div className="text-3xl font-bold text-purple-600">100%</div>
                           </div>
                           <div className="p-5 bg-white border border-gray-100 rounded-xl text-center shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
                              <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">合规风险</div>
                              <div className="text-3xl font-bold text-orange-500">2 <span className="text-sm font-normal text-slate-400">项</span></div>
                           </div>
                        </div>
                     </section>

                     {/* 3. Dynamic Dimension Sections */}
                     <div className="space-y-10">
                        {selectedDimensions.map((dim, index) => (
                           <section key={dim.id}>
                              <h2 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-emerald-500 pl-3 flex items-center gap-2">
                                 {index + 1}. {dim.name}
                                 {dim.type === 'CHART' && <BarChart4 size={18} className="text-slate-400 ml-auto" />}
                                 {dim.type === 'LIST' && <LayoutList size={18} className="text-slate-400 ml-auto" />}
                              </h2>
                              {renderDimensionContent(dim)}
                           </section>
                        ))}
                     </div>

                  </div>
               </div>
             )}

             {/* MODE: RAW DATA */}
             {resultViewMode === 'DATA' && (
                <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Table className="text-blue-600" size={18} /> 评价指标原始数据表
                         </h3>
                         <button className="text-xs flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100">
                            <FileJson size={14} /> 导出 JSON
                         </button>
                      </div>
                      
                      <div className="overflow-x-auto">
                         <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-50 text-slate-500 border-b border-gray-200">
                               <tr>
                                  <th className="px-4 py-3 font-medium">指标维度</th>
                                  <th className="px-4 py-3 font-medium">细分指标</th>
                                  <th className="px-4 py-3 font-medium">权重</th>
                                  <th className="px-4 py-3 font-medium">目标值</th>
                                  <th className="px-4 py-3 font-medium">实际值</th>
                                  <th className="px-4 py-3 font-medium">得分</th>
                                  <th className="px-4 py-3 font-medium">数据来源</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-slate-700">
                               {selectedDimensions.map((dim, i) => (
                                  <React.Fragment key={i}>
                                     <tr className="bg-white hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-slate-800 border-r border-gray-100 w-48">{dim.name}</td>
                                        <td className="px-4 py-3">指标项 A-{i+1}</td>
                                        <td className="px-4 py-3">15%</td>
                                        <td className="px-4 py-3">100%</td>
                                        <td className="px-4 py-3 font-mono">98%</td>
                                        <td className="px-4 py-3 font-bold text-emerald-600">14.5</td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">系统自动采集</td>
                                     </tr>
                                  </React.Fragment>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>

                   {/* Traceability Info */}
                   <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                      <Info className="text-blue-500 mt-0.5 shrink-0" size={18} />
                      <div className="text-sm text-blue-800">
                         <span className="font-bold">数据溯源说明：</span> 
                         以上数据均来源于“省政务信息化项目管理系统”数据库及第三方审计报告。数据快照生成时间为 {isHistoryMode ? viewingReportHistory.date : new Date().toLocaleString()}。
                      </div>
                   </div>
                </div>
             )}
          </div>
       </div>
    );
  };

  // --- VIEW: SCENARIO SELECTION (DASHBOARD) ---
  if (currentFlow === 'SCENARIO_SELECT') {
    return (
      <div className="h-full flex flex-col p-8 max-w-7xl mx-auto overflow-y-auto">
         <div className="mb-8 flex-shrink-0">
            <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
               <Bot size={32} className="text-blue-600" />
               智能辅助中心
            </h1>
            <p className="text-slate-500">选择一个智能体开始辅助工作，利用AI技术提升项目管理效率。</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10">
            {/* Card 1: Smart Q&A */}
            <div 
               onClick={() => handleScenarioSelect('QA')}
               className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-violet-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
            >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MessageSquareText size={100} />
               </div>
               <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquareText size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-2">智能问答</h3>
               <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">
                  深度融合大模型与政务知识库，提供项目申报、审批、采购、验收全流程的政策解读与问题解答。
               </p>
               <div className="flex items-center text-violet-600 text-sm font-medium">
                  立即开始 <ChevronRight size={16} />
               </div>
            </div>

            {/* Card 2: Compliance */}
            <div 
               onClick={() => handleScenarioSelect('COMPLIANCE')}
               className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
            >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldAlert size={100} />
               </div>
               <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform shadow-sm">
                  <ShieldAlert size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-2">智能合规风险分析</h3>
               <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">
                  基于统建清单与负面清单知识库，自动扫描申报材料，精准识别合规性风险，提供整改建议。
               </p>
               <div className="flex items-center text-blue-600 text-sm font-medium">
                  立即开始 <ChevronRight size={16} />
               </div>
            </div>

            {/* Card 3: Report (Performance Evaluation) */}
            <div 
               onClick={() => handleScenarioSelect('REPORT')}
               className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border-2 border-emerald-200 shadow-md hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col"
            >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <BarChart4 size={100} />
               </div>
               <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                  <BarChart4 size={24} />
               </div>
               <h3 className="text-lg font-bold text-emerald-900 mb-2">绩效评价分析报告</h3>
               <p className="text-emerald-700/70 text-sm leading-relaxed mb-4 flex-1">
                  支持单项目及多项目绩效评价，自定义评价维度，一键生成包含亮点、不足及整改建议的智能分析报告。
               </p>
               <div className="flex items-center text-emerald-700 text-sm font-bold bg-emerald-100 w-fit px-3 py-1 rounded-full">
                  <Sparkles size={14} className="mr-1" /> 推荐使用
               </div>
            </div>

            {/* Card 4: Check Duplication */}
            <div 
               onClick={() => handleScenarioSelect('DUPLICATION')}
               className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
            >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Search size={100} />
               </div>
               <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                  <Search size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-2">智能查重</h3>
               <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">
                  跨部门、跨层级检索历史项目库，智能识别重复建设内容，避免资金浪费。
               </p>
               <div className="flex items-center text-indigo-600 text-sm font-medium">
                  立即开始 <ChevronRight size={16} />
               </div>
            </div>

            {/* Card 5: Functional Point Decomposition (New) */}
            <div 
               onClick={() => handleScenarioSelect('DECOMPOSITION')}
               className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-cyan-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
            >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ListTree size={100} />
               </div>
               <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600 mb-4 group-hover:scale-110 transition-transform">
                  <ListTree size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-2">功能点智能拆解</h3>
               <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">
                  自动解析申报方案，拆解生成标准化功能点清单，为评审估算提供精准依据，提升科学性。
               </p>
               <div className="flex items-center text-cyan-600 text-sm font-medium">
                  立即开始 <ChevronRight size={16} />
               </div>
            </div>

            {/* Card 6: Project Risk Warning (New) */}
            <div 
               onClick={() => handleScenarioSelect('RISK_WARNING')}
               className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-rose-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
            >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Siren size={100} />
               </div>
               <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mb-4 group-hover:scale-110 transition-transform">
                  <Siren size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-2">项目过程风险预警</h3>
               <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">
                  聚焦进度与资金维度，融合多源数据进行全流程监测，提供实时风险预警与高效处理能力。
               </p>
               <div className="flex items-center text-rose-600 text-sm font-medium">
                  立即开始 <ChevronRight size={16} />
               </div>
            </div>
         </div>
      </div>
    );
  }

  // --- REPORT FLOW ROUTING ---
  if (currentFlow === 'REPORT_FLOW') {
     return (
        <>
           {reportStep === 'DASHBOARD' && renderReportDashboard()}
           {reportStep === 'CONFIG_DIMENSIONS' && renderConfigDimensions()}
           {reportStep === 'GENERATING' && renderGenerating()}
           {reportStep === 'RESULT' && renderResult()}
        </>
     );
  }

  // --- OTHER FLOWS ---
  // ... (QA Chat and Compliance Workbench remain mostly similar in structure but separated for clarity)

  if (currentFlow === 'QA_CHAT') {
    // QA Chat Implementation
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
             <button onClick={handleBackToHome} className="p-2 hover:bg-gray-100 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
             </button>
             <div className="flex items-center gap-2">
                <div className="bg-violet-100 p-1.5 rounded-lg text-violet-600">
                   <MessageSquareText size={20} />
                </div>
                <div>
                   <div className="text-base font-bold text-slate-800 leading-tight">智能问答</div>
                   <div className="text-xs text-slate-500">政务项目全流程智能助手</div>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-slate-600 flex items-center gap-2"
                onClick={() => setChatMessages([chatMessages[0]])} 
             >
                <RotateCcw size={14} />
                新对话
             </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col bg-[#f8fafc] max-w-4xl mx-auto w-full shadow-sm border-x border-gray-200">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                    ${msg.role === 'assistant' ? 'bg-violet-600 text-white' : 'bg-gray-200 text-slate-600'}`}>
                    {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                  </div>
                  <div className={`max-w-[80%] space-y-1`}>
                    <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed
                      ${msg.role === 'assistant' 
                        ? 'bg-white border border-gray-200 text-slate-700 rounded-tl-none' 
                        : 'bg-violet-600 text-white rounded-tr-none'}`}
                    >
                      {msg.role === 'assistant' ? <FormattedText text={msg.content} /> : msg.content}
                    </div>
                    <div className={`flex items-center gap-2 text-xs text-slate-400 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
              {isChatThinking && (
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0">
                       <Bot size={20} />
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-gray-200 rounded-tl-none shadow-sm flex items-center gap-2">
                       <Loader2 size={16} className="animate-spin text-violet-600" />
                       <span className="text-sm text-slate-500">正在思考中...</span>
                    </div>
                 </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-gray-200">
              {chatMessages.length === 1 && (
                <div className="flex flex-wrap gap-2 mb-4 px-2">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button key={i} onClick={() => { setInputMessage(q); }} className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs rounded-full border border-violet-100 hover:bg-violet-100 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div className="relative flex items-center gap-2">
                 <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="输入您关于项目申报、审批或政策的问题..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all text-sm"
                 />
                 <button onClick={handleSendMessage} disabled={!inputMessage.trim() || isChatThinking} className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                    <Send size={18} />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- COMPLIANCE WORKBENCH & PROJECT LIST ---
  // (Re-using parts of previous code but organized)

  if (currentFlow === 'PROJECT_SELECT') {
    return (
      <div className="h-full flex flex-col bg-slate-50">
         <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0 gap-4 justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
               <button onClick={handleBackToHome} className="p-2 hover:bg-gray-100 rounded-full text-slate-500 transition-colors">
                  <ArrowLeft size={20} />
               </button>
               <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                     <ShieldAlert size={20} />
                  </div>
                  <div>
                     <div className="text-base font-bold text-slate-800 leading-tight">智能合规风险分析</div>
                     <div className="text-xs text-slate-500">选择项目启动智能体扫描</div>
                  </div>
               </div>
            </div>
         </div>
         <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
             <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-8 border-b border-gray-100 mb-6">
                   <button 
                     onClick={() => { setActiveTab('ALL'); resetFilters(); }}
                     className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'ALL' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                   >
                      <LayoutGrid size={18} />
                      待分析项目
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-normal">{MOCK_REQUIREMENTS.length}</span>
                   </button>
                   <button 
                     onClick={() => { setActiveTab('HISTORY'); resetFilters(); }}
                     className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'HISTORY' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                   >
                      <History size={18} />
                      历史分析记录
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-normal">{MOCK_HISTORY.length}</span>
                   </button>
                </div>
                {/* Filters Row */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                      <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                              type="text" 
                              placeholder={activeTab === 'ALL' ? "输入项目名称或建设单位关键词..." : "检索历史分析记录..."}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                          />
                      </div>
                      <button onClick={resetFilters} className="px-4 py-2.5 bg-white border border-gray-300 text-slate-600 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
                         <RotateCcw size={14} /> 重置
                      </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="relative">
                          <select className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-md outline-none focus:border-blue-500 text-sm text-slate-600 cursor-pointer appearance-none hover:border-gray-300" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                             <option value="all">所有建设单位</option>
                             {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                      </div>
                      <div className="relative">
                          <select className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-md outline-none focus:border-blue-500 text-sm text-slate-600 cursor-pointer appearance-none hover:border-gray-300" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                             <option value="all">所有项目类型</option>
                             {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                      </div>
                      <div className="relative">
                          <select className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-md outline-none focus:border-blue-500 text-sm text-slate-600 cursor-pointer appearance-none hover:border-gray-300" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                             <option value="all">所有建设年份</option>
                             {availableYears.map(year => (<option key={year} value={year}>{year}年度建设</option>))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                      </div>
                      <div className="relative">
                          <select className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-md outline-none focus:border-blue-500 text-sm text-slate-600 cursor-pointer appearance-none hover:border-gray-300" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                             <option value="all">所有{activeTab === 'ALL' ? '项目' : '分析'}状态</option>
                             {activeTab === 'ALL' ? (
                                <><option value="已发布">已发布</option><option value="审核中">审核中</option><option value="草稿">草稿</option></>
                             ) : (
                                <><option value="发现风险">发现风险</option><option value="合规通过">合规通过</option><option value="建议驳回">建议驳回</option></>
                             )}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                      </div>
                  </div>
                </div>
             </div>
         </div>

         {/* Projects Grid */}
         <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto">
               {activeTab === 'ALL' && (
                  filteredProjects.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((req) => (
                           <div key={req.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer relative" onClick={() => handleProjectSelect(req, false)}>
                              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 w-full" />
                              <div className="p-6 flex-1">
                                 <div className="flex justify-between items-start mb-4">
                                    <div className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">{req.status}</div>
                                    <span className="text-xs text-slate-400 font-mono">ID: {req.id.split('_')[1]}</span>
                                 </div>
                                 <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{req.name}</h3>
                                 <div className="space-y-3 mt-6">
                                    <div className="flex items-start gap-3 text-sm text-slate-600"><Building2 size={16} className="text-slate-400 mt-0.5 shrink-0" /><span className="line-clamp-1">{req.unit}</span></div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600"><Wallet size={16} className="text-slate-400 shrink-0" /><span className="font-mono font-medium text-slate-800">{req.budget.toLocaleString()} <span className="text-xs text-slate-500 font-normal">万元</span></span></div>
                                 </div>
                              </div>
                              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-blue-50/50 transition-colors">
                                 <span className="text-xs text-slate-400 group-hover:text-blue-500 transition-colors">点击启动分析</span>
                                 <ArrowLeft size={16} className="rotate-180 text-slate-400 group-hover:text-blue-500" />
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (<div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-gray-200 border-dashed text-slate-500">未找到匹配项目</div>)
               )}
               {activeTab === 'HISTORY' && (
                  filteredHistory.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredHistory.map((item) => (
                           <div key={item.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer relative" onClick={() => item.req && handleProjectSelect(item.req, true)}>
                              <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${item.status === 'PASSED' ? 'bg-green-500' : item.status === 'RISK_FOUND' ? 'bg-orange-500' : 'bg-red-500'}`} />
                              <div className="p-6 pl-8 flex-1">
                                 <div className="flex justify-between items-start mb-4">
                                     <div className={`px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1
                                        ${item.status === 'PASSED' ? 'bg-green-50 text-green-700 border-green-200' : item.status === 'RISK_FOUND' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}
                                     `}>
                                        {item.status === 'PASSED' ? '合规通过' : item.status === 'RISK_FOUND' ? '发现风险' : '建议驳回'}
                                     </div>
                                    <span className="text-xs text-slate-400 font-mono">{item.analysisTime.split(' ')[0]}</span>
                                 </div>
                                 <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.req?.name}</h3>
                                 {item.status !== 'PASSED' && (
                                    <div className="mt-4 bg-orange-50 border border-orange-100 rounded-lg p-3">
                                       <div className="text-xs text-orange-600 font-medium mb-1">风险扫描结果:</div>
                                       <div className="text-2xl font-bold text-orange-700">{item.riskCount} <span className="text-sm font-normal text-orange-500">处风险项</span></div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (<div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-gray-200 border-dashed text-slate-500">暂无历史记录</div>)
               )}
            </div>
         </div>
      </div>
    );
  }

  // --- COMPLIANCE WORKBENCH ---
  if (currentFlow === 'ANALYSIS_WORKBENCH') {
     return (
       <div className="h-full flex flex-col bg-slate-50">
          <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
             <div className="flex items-center gap-4">
                <button onClick={handleBackToProjectList} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
                   <ArrowLeft size={16} /> 返回列表
                </button>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="font-bold text-slate-800 flex items-center gap-2">
                   <ShieldAlert size={18} className="text-blue-600" /> 智能合规风险分析工作台
                </div>
                <div className="text-sm text-slate-500 px-2 py-0.5 bg-slate-100 rounded">当前项目: {selectedRequirement?.name}</div>
             </div>
             <div className="flex items-center gap-3">
                {isChecking ? (
                   <div className="flex items-center gap-2 text-blue-600 text-sm font-medium px-3 py-1 bg-blue-50 rounded-full border border-blue-100"><Loader2 size={14} className="animate-spin" /> 智能体正在思考分析中...</div>
                ) : (
                   <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100"><CheckCircle2 size={14} /> 分析完成</div>
                )}
                {!isChecking && (progress === 100 || isHistoryView) && (
                    <button onClick={() => alert(`正在导出《${selectedRequirement?.name}》合规性分析报告...`)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 shadow-sm transition-colors"><Download size={14} /> 导出报告</button>
                )}
                <button onClick={() => startAnalysisSimulation(false)} disabled={isChecking} className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-slate-600 disabled:opacity-50">重新分析</button>
             </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
             {/* Left: Original Data */}
             <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 font-bold text-slate-700 flex items-center gap-2"><FileText size={16} /> 需求原始内容</div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                   <section>
                      <h3 className="font-bold text-slate-900 text-base mb-4 pb-2 border-b border-gray-100">基本信息</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                         <div className="flex"><span className="text-slate-500 w-24">单位:</span><span>{selectedRequirement?.unit}</span></div>
                         <div className="flex"><span className="text-slate-500 w-24">负责人:</span><span>{selectedRequirement?.detail.manager}</span></div>
                         <div className="flex"><span className="text-slate-500 w-24">预算:</span><span>{selectedRequirement?.budget}万元</span></div>
                      </div>
                   </section>
                   <section>
                      <h3 className="font-bold text-slate-900 text-base mb-4 pb-2 border-b border-gray-100">建设内容</h3>
                      <p className="text-sm text-slate-600 leading-7 whitespace-pre-line text-justify bg-slate-50 p-4 rounded border border-slate-100">{selectedRequirement?.detail.content}</p>
                   </section>
                </div>
             </div>
             {/* Right: AI Analysis */}
             <div className="w-1/2 flex flex-col bg-slate-50/50 overflow-hidden relative">
                <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100 font-bold text-blue-800 flex items-center gap-2"><Sparkles size={16} /> 智能分析结果</div>
                <div className="flex-1 overflow-y-auto p-6">
                   <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-sm font-bold text-slate-700">分析进度</span>
                         <span className="text-xl font-bold text-blue-600">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6">
                         <div className="h-full bg-blue-600 transition-all duration-200 ease-out" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                         {steps.map((step, idx) => (
                            <div key={step.id} className={`text-center p-2 rounded-lg border text-xs transition-all duration-300 ${step.status === 'COMPLETED' ? 'bg-green-50 border-green-200 text-green-700' : step.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                               {step.label}
                            </div>
                         ))}
                      </div>
                   </div>
                   {!isChecking && risks.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                         <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm flex items-center gap-3">
                            <div className="p-3 bg-blue-50 rounded-full text-blue-600"><LayoutList size={20} /></div>
                            <div><div className="text-2xl font-bold text-slate-800">{stats.unifiedListCount}</div><div className="text-xs text-slate-500">统建清单风险</div></div>
                         </div>
                         <div className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm flex items-center gap-3">
                            <div className="p-3 bg-orange-50 rounded-full text-orange-600"><Ban size={20} /></div>
                            <div><div className="text-2xl font-bold text-slate-800">{stats.negativeListCount}</div><div className="text-xs text-slate-500">负面清单风险</div></div>
                         </div>
                      </div>
                   )}
                   {!isChecking && risks.length > 0 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                         {renderRiskList("统建清单风险发现", risks.filter(r => r.category === 'UNIFIED_LIST'))}
                         {renderRiskList("负面清单风险发现", risks.filter(r => r.category === 'NEGATIVE_LIST'))}
                      </div>
                   )}
                </div>
             </div>
          </div>
       </div>
     );
  }

  // Fallback
  return null;
};
