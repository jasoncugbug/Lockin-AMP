import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Settings2, 
  Monitor, 
  Save, 
  FileSpreadsheet,
  RefreshCcw,
  FilePlus2,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

/**
 * --- 逻辑工具与常量 ---
 */
const DAYS_PER_MONTH = 30;
const UNIT_OPTIONS = ["个", "根", "处", "项"];

const INITIAL_DETECTION_ITEMS = [
  { id: 'd1', name: '锚杆基本试验', unit: '根', pointCount: 3, unitPrice: 1500, category: 'Detection' },
  { id: 'd2', name: '锚固承载力验收试验', unit: '根', pointCount: 10, unitPrice: 800, category: 'Detection' },
  { id: 'd3', name: '边坡回填压实检测', unit: '项', pointCount: 1, unitPrice: 5000, category: 'Detection' },
  { id: 'd4', name: '声波透射法检测', unit: '根', pointCount: 20, unitPrice: 450, category: 'Detection' },
];

const INITIAL_MONITORING_ITEMS = [
  { id: 'm1', name: '地下水位监测', unit: '处', pointCount: 5, unitPrice: 120, category: 'Monitoring' },
  { id: 'm2', name: '水平位移监测', unit: '处', pointCount: 8, unitPrice: 150, category: 'Monitoring' },
  { id: 'm3', name: '垂直位移监测', unit: '处', pointCount: 8, unitPrice: 150, category: 'Monitoring' },
  { id: 'm4', name: '沉降监测', unit: '处', pointCount: 12, unitPrice: 100, category: 'Monitoring' },
  { id: 'm5', name: '降雨量监测', unit: '处', pointCount: 8, unitPrice: 150, category: 'Monitoring' },
  { id: 'm6', name: '锚杆应力监测', unit: '根', pointCount: 8, unitPrice: 150, category: 'Monitoring' },
  { id: 'm7', name: '锚索应力监测', unit: '根', pointCount: 12, unitPrice: 100, category: 'Monitoring' },
  { id: 'm8', name: '宏观监测', unit: '处', pointCount: 12, unitPrice: 100, category: 'Monitoring' },
];

const calculateItemQuantity = (pointCount, config) => {
  if (!config || !config.stages) return { quantity: 0, instruction: '' };
  
  let totalTimes = 0;
  const stageDescs = config.stages.map((stage, idx) => {
    const times = Math.ceil((stage.durationMonths * DAYS_PER_MONTH) / stage.frequencyDays);
    totalTimes += times;
    return `阶段${idx + 1}(${stage.durationMonths}月, ${stage.frequencyDays}天/次)`;
  });

  const quantity = pointCount * totalTimes;
  return {
    quantity,
    totalTimes,
    instruction: `总周期${config.totalCycleMonths}个月: ${stageDescs.join(' + ')}，共计执行 ${totalTimes} 次。`
  };
};

/**
 * --- 子组件: 阶段编辑器 ---
 */
const StageEditor = ({ config, onConfigChange }) => {
  const { totalCycleMonths, stages } = config;

  const updateStage = (index, field, value) => {
    const newStages = [...stages];
    const val = parseFloat(value) || 0;

    if (field === 'durationMonths') {
      newStages[index].durationMonths = val;
      const currentSum = newStages.slice(0, index + 1).reduce((sum, s) => sum + s.durationMonths, 0);
      
      if (currentSum < totalCycleMonths) {
        if (index === newStages.length - 1) {
          newStages.push({
            id: Math.random().toString(36).substr(2, 9),
            durationMonths: Number((totalCycleMonths - currentSum).toFixed(2)),
            frequencyDays: 7
          });
        } else {
          const nextStage = newStages[index + 1];
          const remaining = totalCycleMonths - currentSum;
          nextStage.durationMonths = Number(Math.max(0, remaining).toFixed(2));
        }
      } else if (currentSum >= totalCycleMonths) {
        newStages.length = index + 1;
        newStages[index].durationMonths = Number((totalCycleMonths - (currentSum - val)).toFixed(2));
      }
    } else {
      newStages[index][field] = val;
    }
    onConfigChange({ ...config, stages: newStages });
  };

  const removeStage = (index) => {
    if (stages.length <= 1) return;
    const removedDuration = stages[index].durationMonths;
    const newStages = stages.filter((_, i) => i !== index);
    newStages[newStages.length - 1].durationMonths += removedDuration;
    onConfigChange({ ...config, stages: newStages });
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between font-medium text-slate-700">
        <span>阶段分配 ({totalCycleMonths}月)</span>
        <span className={Math.abs(stages.reduce((s, st) => s + st.durationMonths, 0) - totalCycleMonths) < 0.01 ? "text-green-600" : "text-amber-600"}>
          已分: {stages.reduce((s, st) => s + st.durationMonths, 0).toFixed(2)}
        </span>
      </div>
      {stages.map((stage, idx) => (
        <div key={stage.id} className="flex items-end gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex-1">
            <label className="text-[9px] uppercase text-slate-400 font-bold">时长(月)</label>
            <input
              type="number"
              value={stage.durationMonths}
              onChange={(e) => updateStage(idx, 'durationMonths', e.target.value)}
              className="w-full p-1 border rounded outline-none focus:ring-1 focus:ring-indigo-500"
              step="0.1" min="0"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] uppercase text-slate-400 font-bold">频率(天/次)</label>
            <input
              type="number"
              value={stage.frequencyDays}
              onChange={(e) => updateStage(idx, 'frequencyDays', e.target.value)}
              className="w-full p-1 border rounded outline-none focus:ring-1 focus:ring-indigo-500"
              min="1"
            />
          </div>
          {stages.length > 1 && (
            <button onClick={() => removeStage(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * --- 主应用组件 ---
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('Detection');
  const [globalConfig, setGlobalConfig] = useState({
    totalCycleMonths: 12,
    stages: [{ id: 'g1', durationMonths: 12, frequencyDays: 7 }]
  });
  
  const [items, setItems] = useState(() => {
    // 默认加载初始数据
    const all = [...INITIAL_DETECTION_ITEMS, ...INITIAL_MONITORING_ITEMS];
    return all.map(it => ({
      ...it,
      useCustomSettings: false,
      customConfig: null
    }));
  });

  const [editingItemId, setEditingItemId] = useState(null);
  const [expandedInstructionId, setExpandedInstructionId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const fileInputRef = useRef(null);

  // 显示提示
  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const processItems = (itemList, configSource) => {
    return itemList.map(item => {
      const config = item.useCustomSettings ? item.customConfig : configSource;
      const calc = calculateItemQuantity(item.pointCount, config);
      return { ...item, ...calc, amount: calc.quantity * (item.unitPrice || 0) };
    });
  };

  const currentItems = useMemo(() => {
    return processItems(items.filter(it => it.category === activeTab), globalConfig);
  }, [items, activeTab, globalConfig]);

  const totalAmount = useMemo(() => {
    return currentItems.reduce((sum, it) => sum + it.amount, 0);
  }, [currentItems]);

  const handleGlobalCycleChange = (val) => {
    const cycle = parseFloat(val) || 0;
    setGlobalConfig(prev => ({
      totalCycleMonths: cycle,
      stages: [{ id: Math.random().toString(36).substr(2, 9), durationMonths: cycle, frequencyDays: prev.stages[0]?.frequencyDays || 7 }]
    }));
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(it => {
      if (it.id === id) {
        let finalVal = value;
        if (field === 'pointCount' || field === 'unitPrice') {
          finalVal = value === '' ? '' : parseFloat(value);
          if (isNaN(finalVal) && value !== '') finalVal = 0;
        }
        return { ...it, [field]: finalVal };
      }
      return it;
    }));
  };

  const deleteItem = (id) => {
    setItems(prev => prev.filter(it => it.id !== id));
    if (editingItemId === id) setEditingItemId(null);
  };

  const addNewItem = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新项目',
      unit: '处',
      pointCount: 1,
      unitPrice: 0,
      category: activeTab,
      useCustomSettings: false,
      customConfig: null
    };
    setItems(prev => [...prev, newItem]);
  };

  const toggleCustom = (id) => {
    setItems(prev => prev.map(it => {
      if (it.id === id) {
        const willUseCustom = !it.useCustomSettings;
        return {
          ...it,
          useCustomSettings: willUseCustom,
          customConfig: willUseCustom ? JSON.parse(JSON.stringify(globalConfig)) : null
        };
      }
      return it;
    }));
  };

  /**
   * 功能实现：存档 (下载 JSON 项目文件)
   */
  const handleSave = () => {
    try {
      // 保存完整状态：包括全局配置和项目列表
      const saveData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        globalConfig: globalConfig,
        items: items
      };
      
      const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // 使用 ISO 时间戳作为文件名的一部分
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.download = `EQS_Project_Backup_${dateStr}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast("项目存档文件已下载，请妥善保存");
    } catch (e) {
      console.error(e);
      showToast("存档失败，请重试", "error");
    }
  };

  /**
   * 功能实现：导出报表 (下载 CSV 报表)
   */
  const handleExport = () => {
    try {
      const allProcessed = processItems(items, globalConfig);
      const headers = ["项目分类", "项目名称", "点位数量", "单位", "工程总量", "单价(元)", "合价(元)", "计算备注"];
      
      const rows = allProcessed.map(it => [
        it.category === 'Detection' ? '检测类' : '监测类',
        // 防止 CSV 内容包含逗号导致错位
        `"${it.name.replace(/"/g, '""')}"`,
        it.pointCount,
        it.unit,
        it.quantity,
        it.unitPrice,
        it.amount,
        `"${it.instruction.replace(/"/g, '""')}"`
      ]);

      const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `工程量统计报表_${new Date().toLocaleDateString()}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast("报表已生成并开始下载");
    } catch (e) {
      console.error(e);
      showToast("导出失败", "error");
    }
  };

  /**
   * 功能实现：导入 (读取 JSON 项目文件)
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // 兼容性检查：确保数据结构正确
        if (data && Array.isArray(data.items)) {
          setItems(data.items);
          if (data.globalConfig) {
            setGlobalConfig(data.globalConfig);
          }
          showToast("项目数据导入成功");
        } else if (Array.isArray(data)) {
          // 兼容旧版纯数组格式
          setItems(data);
          showToast("旧版数据导入成功 (仅项目列表)");
        } else {
          showToast("文件格式错误，请导入正确的存档", "error");
        }
      } catch (err) {
        showToast("文件解析失败", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // 重置 input，允许重复选择同一文件
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32 text-xs sm:text-sm">
      {/* 提示组件 */}
      {toast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />}
            <span className="font-bold text-xs">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <header className="bg-white border-b sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Monitor size={18} />
          </div>
          <h1 className="font-bold text-base hidden sm:block tracking-tight text-slate-800">检测和监测工程量计算</h1>
        </div>
        <div className="flex gap-2">
           <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".json"
          />
           <button 
            onClick={handleImportClick}
            className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-xs font-bold text-slate-600 transition-colors"
          >
            <Upload size={14} /> 导入
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-xs font-bold transition-colors"
          >
            <Save size={14} /> 存档
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 内容区 */}
        <div className="lg:col-span-10 space-y-4">
          <div className="flex items-center justify-between bg-white p-2 rounded-2xl border shadow-sm">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              {['Detection', 'Monitoring'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1 rounded-lg font-bold text-xs transition-all ${activeTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  {tab === 'Detection' ? '检测类' : '监测类'}
                </button>
              ))}
            </div>
            <button onClick={addNewItem} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold text-xs transition-all">
              <Plus size={14} /> 新增项
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-50 border-b">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-3 w-[22%]">项目名称</th>
                  <th className="p-3 w-[120px]">数量/单位</th>
                  <th className="p-3 w-[80px] text-center">工程量</th>
                  <th className="p-3 w-[240px]">单价 / 合价 (¥)</th>
                  <th className="p-3 w-[90px]">数据设置</th>
                  <th className="p-3 w-[18%]">计算备注</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentItems.map(item => (
                  <tr key={item.id} className="hover:bg-indigo-50/10 transition-colors align-middle">
                    <td className="p-3">
                      <input 
                        className="font-bold text-slate-800 bg-transparent focus:bg-slate-50 p-1 rounded border-none w-full outline-none focus:ring-1 focus:ring-indigo-300 transition-all text-xs"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="项目名称"
                      />
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          value={item.pointCount}
                          onChange={(e) => updateItem(item.id, 'pointCount', e.target.value)}
                          className="w-14 p-1 bg-slate-50 border rounded text-xs font-bold text-center outline-none focus:ring-1 focus:ring-indigo-300"
                        />
                        <select 
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          className="bg-transparent border-none text-[11px] font-bold text-slate-500 cursor-pointer outline-none w-10 p-0"
                        >
                          {UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <span className="font-mono font-black text-indigo-600 text-base">{item.quantity}</span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                           <input 
                            type="number" 
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                            className="w-full pl-3 pr-1 py-1 bg-amber-50/30 border border-amber-200 rounded text-xs font-bold text-amber-700 outline-none"
                            placeholder="单价"
                          />
                          <span className="absolute left-1 top-1.5 text-[8px] text-amber-500 font-bold">¥</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100"></div>
                        <div className="flex-1 font-black text-emerald-600 truncate text-xs">
                          ¥{item.amount.toLocaleString()}
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setEditingItemId(editingItemId === item.id ? null : item.id)}
                          className={`p-1.5 rounded-lg transition-all ${editingItemId === item.id ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-400'}`}
                          title="独立配置"
                        >
                          <Settings2 size={14} />
                        </button>
                        <button 
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                    <td className="p-3">
                      <div 
                        onClick={() => setExpandedInstructionId(expandedInstructionId === item.id ? null : item.id)}
                        className={`text-[10px] leading-relaxed cursor-pointer transition-all ${expandedInstructionId === item.id ? 'bg-indigo-50 p-2 rounded-lg text-indigo-700 ring-1 ring-indigo-100 whitespace-normal' : 'text-slate-400 line-clamp-2 hover:text-slate-500 max-h-[28px] overflow-hidden'}`}
                      >
                        {item.instruction || "无配置说明"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {currentItems.length === 0 && (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <FilePlus2 className="mx-auto opacity-10" size={40} />
                <p className="text-xs">暂无项目</p>
              </div>
            )}
          </div>
        </div>

        {/* 右侧面板 */}
        <aside className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4 sticky top-20">
            <div className="flex items-center gap-2 border-b pb-2 text-indigo-600">
              <RefreshCcw size={14} />
              <h2 className="font-black text-[10px] uppercase">全局时间设置</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">检测和监测总时长 (月)</label>
                <input 
                  type="number" 
                  value={globalConfig.totalCycleMonths}
                  onChange={(e) => handleGlobalCycleChange(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl font-black text-indigo-700 outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
                />
              </div>
              <StageEditor config={globalConfig} onConfigChange={setGlobalConfig} />
            </div>

            {/* 新增：使用说明文字框 */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 mb-2 text-slate-400">
                 <AlertCircle size={12} />
                 <span className="text-[9px] font-bold uppercase">使用说明</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <ul className="text-[10px] text-slate-500 space-y-1.5 list-none leading-relaxed">
                  <li>1、本应用可快速统计检测和监测的工程量和费用；</li>
                  <li>2、可自由新增和添加其它项，可导出表格数据；</li>
                  <li>3、全局时间设置可快速将设置数据覆盖到所有项；</li>
                  <li>4、只需要为每个阶段分配时长，程序可自动新增下一阶段时长；</li>
                  <li>5、每个项目可以单独设置时间数据；</li>
                  <li>6、如果喜欢，欢迎将网页地址添加至收藏夹，更多功能敬请期待！</li>
                </ul>
              </div>
            </div>

          </div>
        </aside>
      </main>

      {/* 独立配置 Modal */}
      {editingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-xs">项目数据设置</h3>
              <button onClick={() => setEditingItemId(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-400">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="space-y-0.5">
                  <div className="font-bold text-[11px] text-indigo-900">独立时间设置</div>
                  <p className="text-[9px] text-indigo-500">独立数据覆盖本项全局配置数据，对其他项不影响</p>
                </div>
                <button 
                  onClick={() => toggleCustom(editingItemId)}
                  className={`w-10 h-5 rounded-full transition-all relative ${items.find(i => i.id === editingItemId)?.useCustomSettings ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${items.find(i => i.id === editingItemId)?.useCustomSettings ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>

              {items.find(i => i.id === editingItemId)?.useCustomSettings ? (
                <div className="space-y-4 animate-in slide-in-from-top-1">
                   <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">本项时间长度 (月)</label>
                    <input 
                      type="number" 
                      value={items.find(i => i.id === editingItemId)?.customConfig.totalCycleMonths}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setItems(prev => prev.map(it => it.id === editingItemId ? {
                          ...it,
                          customConfig: { ...it.customConfig, totalCycleMonths: val, stages: [{ id: 'lc1', durationMonths: val, frequencyDays: 7 }] }
                        } : it));
                      }}
                      className="w-full p-2 border rounded-xl font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                  <StageEditor 
                    config={items.find(i => i.id === editingItemId).customConfig}
                    onConfigChange={(newCfg) => {
                      setItems(prev => prev.map(it => it.id === editingItemId ? { ...it, customConfig: newCfg } : it));
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-[10px] text-slate-400">
                  当前处于全局同步模式
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setEditingItemId(null)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                完成保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部汇总 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t p-3 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="space-y-0.5">
              <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest">本项费用合计</div>
              <div className="text-xl font-black text-slate-900 leading-none tracking-tight">
                <span className="text-xs mr-1 font-normal opacity-50">¥</span>{totalAmount.toLocaleString()}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="hidden sm:block space-y-0.5">
              <div className="text-[9px] text-slate-400 uppercase font-black">检测和监测费用合计</div>
              <div className="text-lg font-bold text-indigo-600 leading-none">
                ¥{items.reduce((sum, item) => {
                  const config = item.useCustomSettings ? item.customConfig : globalConfig;
                  const calc = calculateItemQuantity(item.pointCount, config);
                  return sum + (calc.quantity * (item.unitPrice || 0));
                }, 0).toLocaleString()}
              </div>
            </div>
          </div>
          <button 
            onClick={handleExport}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 text-xs"
          >
             <FileSpreadsheet size={16} />
             <span>导出到表格</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
