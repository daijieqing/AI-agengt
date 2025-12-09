import { System, SystemVersion, Requirement, Annotation } from './types';

// Helper to create a historical version based on the current one
const generateHistory = (baseVersion: SystemVersion): SystemVersion[] => {
  const v1_5: SystemVersion = {
    ...baseVersion,
    versionId: 'v1.5',
    versionName: 'V1.5版本',
    updatedAt: '2025-01-15 10:30:22',
    modifier: '李四',
    changeType: '项目资料更新',
    detail: {
      ...baseVersion.detail,
      cost: 45, // Was 50
      runStatus: '试运行', 
      isAccepted: '否',
      description: '程序v出现 - 测试版本迭代',
    },
    // Same resources
    resources: baseVersion.resources, 
  };

  const v1: SystemVersion = {
    ...baseVersion,
    versionId: 'v1',
    versionName: 'V1.0版本',
    updatedAt: '2024-05-01 09:15:00',
    modifier: '王五',
    changeType: '项目立项通过',
    detail: {
      ...baseVersion.detail,
      cost: 30, // Was 50
      runStatus: '开发中', // Was trial
      userCount: '-', 
      vendor: '暂无',
      isAccepted: '否',
      alias: '-',
      description: '初始版本建立',
    },
    // V1 had fewer resources
    resources: baseVersion.resources.slice(0, 1), 
  };

  return [v1_5, v1];
};

export const MOCK_SYSTEMS: System[] = [
  {
    id: 'sys_001',
    name: '测试系统0516',
    department: '省/市大数据局',
    createdAt: '2025-05-07 14:19:48',
    status: '在用',
    completeness: 85,
    linkedDataCount: 2,
    linkedItemsCount: 1,
    isCascaded: false,
    currentVersion: {
      versionId: 'v2',
      versionName: 'V2.0版本 (当前)',
      updatedAt: '2025-05-07 14:19:48',
      modifier: '张小六',
      changeType: '系统上线运行',
      detail: {
        constructionUnit: '省/市大数据局',
        description: '程序v出现',
        
        isNational: '是',
        alias: '-',
        systemTag: '平台',
        cost: 50,
        runStatus: '停用',
        vendor: '许昌许昌',
        isAccepted: '否',
        firstBuiltAt: '2024-05',
        isConnectedToShandong: '-',
        userLevel: '本级机关内部',
        domain: '党建工作',
        accessUrl: '15.2.3.6',
        deployment: '政务云节点',
        userCount: '-',
        userGroup: '-',
        securityLevel: '等保二级',
        contactPhone: '15098801537',
        remark: '-',
        responsibilityItems: '暂无事项',
        serviceItems: '暂无事项',
        contact: '程序许昌v',
        relatedSystems: '测试系统保存 gitf\n测试系统0516',
      },
      resources: [
        { id: 'res_1', name: '800 - 山东XXX资源7', count: 1200, type: 'DB' },
        { id: 'res_2', name: '1200 - 山东XXX资源8', count: 50000, type: 'DB' },
      ],
    },
    history: [], // Populated below
  },
  {
    id: 'sys_002',
    name: '供应链管理系统',
    department: '省/市大数据局',
    createdAt: '2025-11-21 11:14:54',
    status: '在用',
    completeness: 50,
    linkedDataCount: 0,
    linkedItemsCount: 0,
    isCascaded: false,
    currentVersion: {
      versionId: 'v2',
      versionName: 'V2.0',
      updatedAt: '2025-11-21 11:14:54',
      modifier: '管理员',
      changeType: '常规更新',
      detail: {
        constructionUnit: '省/市大数据局',
        description: '管理从原材料采购到产品交付给最终用户的整个供应链网络。',
        isNational: '是',
        alias: 'SCM系统',
        systemTag: '平台',
        cost: 500,
        runStatus: '在用',
        vendor: '浪潮软件',
        isAccepted: '否',
        firstBuiltAt: '2025-01',
        isConnectedToShandong: '是',
        userLevel: '省级',
        domain: '经济调节',
        accessUrl: '10.22.1.1',
        deployment: '政务云节点',
        userCount: '500+',
        userGroup: '企业用户',
        securityLevel: '三级',
        contactPhone: '0531-88888888',
        remark: '无',
        responsibilityItems: '暂无',
        serviceItems: '暂无',
        contact: '张三',
        relatedSystems: '无',
      },
      resources: [
         { id: 'res_3', name: '供应商信息', count: 1200, type: 'DB' }
      ],
    },
    history: [],
  },
   {
    id: 'sys_003',
    name: '数据中台系统',
    department: '省/市大数据局',
    createdAt: '2025-11-21 10:46:20',
    status: '在用',
    completeness: 50,
    linkedDataCount: 0,
    linkedItemsCount: 0,
    isCascaded: false,
    currentVersion: {
      versionId: 'v3',
      versionName: 'V3.1',
      updatedAt: '2025-11-21 10:46:20',
      modifier: 'DevOps',
      changeType: '架构升级',
      detail: {
        constructionUnit: '省/市大数据局',
        description: '对企业全域数据进行汇聚、治理、建模和整合。',
        isNational: '是',
        alias: 'DataMiddle',
        systemTag: '平台',
        cost: 1200,
        runStatus: '在用',
        vendor: '华为',
        isAccepted: '是',
        firstBuiltAt: '2024-06',
        isConnectedToShandong: '是',
        userLevel: '全省',
        domain: '数据服务',
        accessUrl: '172.16.1.1',
        deployment: '政务云',
        userCount: '1000+',
        userGroup: '政府部门',
        securityLevel: '三级',
        contactPhone: '0531-66666666',
        remark: '核心系统',
        responsibilityItems: '暂无',
        serviceItems: '暂无',
        contact: '赵六',
        relatedSystems: '无',
      },
      resources: [],
    },
    history: [],
  },
];

// Populate history for the first system to demonstrate Diff functionality
MOCK_SYSTEMS[0].history = generateHistory(MOCK_SYSTEMS[0].currentVersion);


export const MOCK_REQUIREMENTS: Requirement[] = [
  {
    id: 'req_001',
    unit: '省/市大数据局',
    name: '智慧教育资源共享平台项目',
    year: '2024',
    budget: 400.00,
    receiveTime: '2025-09-25 15:18:41',
    status: '已发布',
    projectType: '业务应用类',
    detail: {
      unitName: '省/市大数据局',
      responsibleDept: '省教育厅资源中心',
      applyTime: '2025-09-25 15:18:40',
      expectedYear: '2024年度',
      expectedPeriod: '7个月',
      manager: '刘明',
      managerPhone: '13578901234',
      contact: '孙静',
      contactPhone: '13689012345',
      baseNetwork: '互联网',
      totalBudget: 400,
      budgetSources: [
        { name: '“数字山东”发展资金', amount: 400 },
        { name: '其他资金', amount: 0 }
      ],
      policies: [
        { 
          name: '《教育部关于推进教育信息化2.0行动计划的通知》（教技〔2018〕6号）', 
          description: '要求：构建教育资源共享平台，推动资源均衡，按照“融合创新、开放共享”的原则，实行资源统一管理。省教育厅负责项目审核和备案。对于资源机制变化的，需重新履行审核手续。项目需实行验收和后评价制度。' 
        }
      ],
      provincialPolicies: [
        {
          name: '《山东省教育信息化发展规划》（鲁教发〔2023〕13号）',
          description: '强调开发共享系统。省委办公会会议纪要（2024年第4次）同意资源整合计划。上级领导批示（2024年2月）指示加强在线教育基础设施。'
        }
      ],
      content: '1、教育资源整合：开发在线资源库，支持课程上传、共享和互动学习，覆盖全省学校，通过AI推荐提升个性化教学，与教育云对接。包含但不限于资源分类、在线编辑、协作工具、考核模块、数据同步等。2、监测评估子系统：建立使用统计和反馈机制，提供资源质量评估和优化建议。'
    }
  },
  {
    id: 'req_002',
    unit: '省公安厅',
    name: '社会治安防控体系智能化建设项目',
    year: '2025',
    budget: 1500.00,
    receiveTime: '2025-11-10 09:30:00',
    status: '审核中',
    projectType: '基础设施类',
    detail: {
        unitName: '省公安厅',
        responsibleDept: '治安总队',
        applyTime: '2025-11-10 09:30:00',
        expectedYear: '2025年度',
        expectedPeriod: '12个月',
        manager: '张警官',
        managerPhone: '13800000000',
        contact: '李警官',
        contactPhone: '13900000000',
        baseNetwork: '电子政务外网',
        totalBudget: 1500,
        budgetSources: [{ name: '财政拨款', amount: 1500 }],
        policies: [],
        provincialPolicies: [],
        content: '建设全省统一的社会治安防控大数据平台，汇聚感知数据，实现风险预警和指挥调度。'
    }
  },
  {
    id: 'req_003',
    unit: '省卫生健康委',
    name: '全民健康信息平台升级改造',
    year: '2024',
    budget: 800.00,
    receiveTime: '2025-08-15 14:20:00',
    status: '草稿',
    projectType: '数据资源类',
    detail: {
        unitName: '省卫生健康委',
        responsibleDept: '规划信息处',
        applyTime: '2025-08-15 14:20:00',
        expectedYear: '2024年度',
        expectedPeriod: '6个月',
        manager: '王主任',
        managerPhone: '13700000000',
        contact: '赵科长',
        contactPhone: '13600000000',
        baseNetwork: '互联网',
        totalBudget: 800,
        budgetSources: [{ name: '自筹资金', amount: 800 }],
        policies: [],
        provincialPolicies: [],
        content: '对现有健康信息平台进行数据治理和架构升级，提升医疗数据互联互通能力。'
    }
  }
];

// Persistent Annotations
// 将此代码复制到 src/mockData.ts 文件中，替换原有的 MOCK_ANNOTATIONS 定义
export const MOCK_ANNOTATIONS: Record<string, Annotation[]> = {
  "SYSTEM_CENTER": [],
  "REQUIREMENT_APPROVAL": [
    {
      "id": "1765181830908",
      "x": 84.9869451697128,
      "y": 15.073115860517436,
      "content": "增加思考过程",
      "isOpen": true
    }
  ],
  "SMART_AGENT": []
};