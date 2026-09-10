import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import './App.css';

type SystemInfo = { system: string; cpu: string; total_memory: string };

const App = () => {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<SystemInfo>('system_info').then(setInfo).catch(() => setError('请在 Tauri 应用中运行以获取系统信息'));
  }, []);

  return (
    <div className="App">
      <main className="system-card">
        <p className="eyebrow">SYSTEM OVERVIEW</p>
        <h1>设备信息</h1>
        <div className="system-list" aria-live="polite">
          <div className="system-row"><span>系统</span><strong>{info?.system ?? (error ?? '读取中...')}</strong></div>
          <div className="system-row"><span>CPU</span><strong>{info?.cpu ?? (error ? '暂不可用' : '读取中...')}</strong></div>
          <div className="system-row"><span>总内存</span><strong>{info?.total_memory ?? (error ? '暂不可用' : '读取中...')}</strong></div>
        </div>
      </main>
    </div>
  );
};

export default App;
