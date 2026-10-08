import { useState, useEffect, useCallback } from 'react';
import { CustomAgent } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'customAgents';

// 默认的 Agent
const DEFAULT_AGENT: CustomAgent = {
  id: 'default',
  name: '微信账单助手',
  description: '智能统计与分析日常微信支付账单',
  systemPrompt: `你是一个专业的微信支付账单统计助手，帮助用户记录、分类和分析日常微信支付支出。

核心能力：
1. 账单记录：用户可以通过自然语言描述一笔支出（如"今天午饭花了35"、"打车12元"），你需要提取金额、类别、备注等信息并记录到账单文件中。
2. 分类统计：按照支出类别（餐饮、交通、购物、生活缴费、娱乐、医疗、教育、转账红包、其他）自动归类。
3. 多维分析：支持按日/周/月/年统计支出总额、分类占比、趋势变化，并以清晰的表格或文字形式展示。
4. 数据管理：将所有账单数据以 JSON 或 CSV 格式持久化存储到工作目录下的文件中（如 bills.json），方便后续读取和更新。
5. 智能提醒：当某类支出异常增长时，主动提醒用户。

工作流程：
- 首次使用时，在工作目录创建 data/bills.json 文件作为账单数据库。
- 每次用户描述支出时，读取现有数据、追加新记录、写回文件。
- 用户查询统计时，读取数据并计算汇总结果。

记录格式（JSON）：
{ "id": "唯一ID", "date": "YYYY-MM-DD HH:mm", "amount": 数字, "category": "分类", "note": "备注" }

回复时请用简洁清晰的中文，金额保留两位小数。统计数据尽量用表格形式展示。`,
  icon: 'Wallet',
  color: '#07c160',
  permissionMode: 'acceptEdits',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function useAgents() {
  const [agents, setAgents] = useState<CustomAgent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [DEFAULT_AGENT, ...parsed.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        }))];
      }
    } catch (e) {
      console.error('Failed to load agents:', e);
    }
    return [DEFAULT_AGENT];
  });

  // 保存到 localStorage（排除默认 agent）
  const saveAgents = useCallback((newAgents: CustomAgent[]) => {
    const toSave = newAgents.filter(a => a.id !== 'default');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, []);

  const addAgent = useCallback((agent: Omit<CustomAgent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAgent: CustomAgent = {
      ...agent,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAgents(prev => {
      const updated = [...prev, newAgent];
      saveAgents(updated);
      return updated;
    });
    return newAgent;
  }, [saveAgents]);

  const updateAgent = useCallback((id: string, updates: Partial<Omit<CustomAgent, 'id' | 'createdAt'>>) => {
    setAgents(prev => {
      const updated = prev.map(a => 
        a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
      );
      saveAgents(updated);
      return updated;
    });
  }, [saveAgents]);

  const deleteAgent = useCallback((id: string) => {
    if (id === 'default') return; // 不能删除默认 agent
    setAgents(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveAgents(updated);
      return updated;
    });
  }, [saveAgents]);

  const getAgent = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  return {
    agents,
    addAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    defaultAgent: DEFAULT_AGENT,
  };
}
