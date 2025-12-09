export interface DataResource {
  id: string;
  name: string;
  count: number;
  type: 'DB' | 'API' | 'FILE';
}

// Fields matching the screenshot details exactly
export interface SystemDetail {
  // Top header info
  constructionUnit: string; // 建设单位
  description: string; // 系统功能描述

  // Basic Info Grid
  isNational: string; // 是否国家建设省级使用
  alias: string; // 曾用名或别名
  systemTag: string; // 系统标识
  cost: number; // 总建设费用 (万元)
  runStatus: string; // 运行情况
  vendor: string; // 承建厂商
  isAccepted: string; // 是否验收
  firstBuiltAt: string; // 首次建成时间
  isConnectedToShandong: string; // 是否接入爱山东
  userLevel: string; // 用户层级
  domain: string; // 应用领域
  accessUrl: string; // 访问地址
  deployment: string; // 部署云节点
  userCount: string; // 用户数量
  userGroup: string; // 使用群体及群众感受
  securityLevel: string; // 安全保护等级
  contactPhone: string; // 联系电话
  remark: string; // 备注
  responsibilityItems: string; // 权责事项
  serviceItems: string; // 政务服务事项
  contact: string; // 联系人
  relatedSystems: string; // 对应系统
}

export interface SystemVersion {
  versionId: string;
  versionName: string; // e.g., "V2.0"
  updatedAt: string; // e.g., "2025-05-01 12:00:00"
  modifier: string; // e.g., "张三"
  changeType: string; // e.g., "项目预审驳回", "资料更新"
  detail: SystemDetail;
  resources: DataResource[];
}

export interface System {
  id: string;
  name: string;
  department: string; // 建设单位 (List view)
  createdAt: string; // 初次建成时间
  status: '在用' | '已批未建' | '维护中' | '已归档'; // 建设情况
  completeness: number; // 资料完整度 0-100
  linkedDataCount: number; // 已关联数据 count
  linkedItemsCount: number; // 已关联事项 count
  isCascaded: boolean; // 级联状态
  
  // Current active data
  currentVersion: SystemVersion;
  // History for comparison
  history: SystemVersion[];
}

export enum DiffType {
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
  MODIFIED = 'MODIFIED',
  UNCHANGED = 'UNCHANGED'
}

export interface FieldDiff {
  key: string;
  label: string;
  oldValue?: any;
  newValue?: any;
  type: DiffType;
}

export interface ResourceDiff {
  resource: DataResource;
  type: DiffType;
}

export interface ComparisonResult {
  stats: {
    added: number;
    removed: number;
    modified: number;
  };
  fieldDiffs: Record<string, FieldDiff>; // Changed to map for easier lookup
  resourceDiffs: ResourceDiff[];
}

// --- REQUIREMENT APPROVAL TYPES ---

export interface PolicyDocument {
  name: string;
  description: string;
}

export interface RequirementDetail {
  unitName: string; // 需求单位名称
  responsibleDept: string; // 负责处室或二级单位
  applyTime: string; // 申请时间
  expectedYear: string; // 预期项目建设年度
  expectedPeriod: string; // 预期建设周期
  
  // Basic Info
  manager: string; // 负责人
  managerPhone: string; // 负责人电话
  contact: string; // 联系人
  contactPhone: string; // 联系人电话
  baseNetwork: string; // 基于网络

  // Budget
  totalBudget: number; // 总预算 (万元)
  budgetSources: { name: string; amount: number }[]; // 资金来源列表

  // Basis
  policies: PolicyDocument[]; // 政策文件
  provincialPolicies: PolicyDocument[]; // 省级颁布的政策文件

  // Content
  content: string; // 需求内容
}

export interface Requirement {
  id: string;
  unit: string; // 需求单位
  name: string; // 需求名称
  year: string; // 建设年度
  budget: number; // 总预算
  receiveTime: string; // 接收时间
  status: string; // 会审状态 (e.g. 已发布)
  projectType: string; // 项目类型 (e.g. 业务应用类)
  detail: RequirementDetail;
}

// --- COMPLIANCE CHECK TYPES ---

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export interface ComplianceRisk {
  id: string;
  category: 'UNIFIED_LIST' | 'NEGATIVE_LIST';
  title: string;
  description?: string;
  level: RiskLevel;
  // New detailed fields
  involvedContent?: string; // 申报项目涉及内容
  hitClause?: string;      // 命中负面清单条款 或 统建清单项目
  suggestion?: string;     // 预警提示与整改建议
  riskLabel?: string;      // 风险标签 (e.g. "驳回新建", "建议核减")
}

export interface CheckStep {
  id: string;
  label: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

// --- ANNOTATION TYPES ---

export interface Annotation {
  id: string;
  x: number; // percentage relative to viewport width
  y: number; // percentage relative to viewport height
  content: string;
  isOpen: boolean; // Is the detail card open?
}