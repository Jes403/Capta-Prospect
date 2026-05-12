import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Building2, MapPin, Users, Settings, MessageSquare, 
  Search, Zap, Plus, Edit, Trash2, Database, Activity, 
  ArrowRight, CheckCircle, ExternalLink, Globe, LogOut, 
  Mail, Phone, Instagram, Linkedin, Twitter, MoreVertical, 
  X, Camera, GripVertical, Filter, Download, AlertCircle, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const BACKEND_URL = 'http://localhost:3006';

function LoginForm({ onLogin }) {
  const [user, setUser] = useState({ username: '', password: '' });
  return (
    <div className="h-screen w-screen bg-capta-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#2fd9f4 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      <Card className="w-full max-w-md bg-capta-surface-low border-white/5 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-capta-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(47,217,244,0.3)]">
            <Database size={32} className="text-capta-bg" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-space font-bold tracking-widest text-white">CAPTA PROSPECT</CardTitle>
            <CardDescription className="text-xs font-space uppercase tracking-[0.3em] text-capta-primary">Intelligence Command</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <div className="space-y-2">
            <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest ml-1">Access ID</label>
            <Input 
              className="h-12 bg-capta-surface-lowest border-white/5 font-space text-white"
              value={user.username}
              onChange={(e) => setUser({...user, username: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest ml-1">Quantum Key</label>
            <Input 
              type="password"
              className="h-12 bg-capta-surface-lowest border-white/5 font-space text-white"
              value={user.password}
              onChange={(e) => setUser({...user, password: e.target.value})}
            />
          </div>
          <Button 
            className="w-full h-12 bg-capta-primary text-capta-bg font-space font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(47,217,244,0.4)] transition-all"
            onClick={() => onLogin(user)}
          >
            Authenticate
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AuthenticatedApp({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  
  // States para Receita
  const [filtrosReceita, setFiltrosReceita] = useState({ uf: 'SP', cidade: '', cnae: '', segmento: '', niche: '' });
  const [receitaResults, setReceitaResults] = useState([]);
  const [isScanningReceita, setIsScanningReceita] = useState(false);
  const [receitaProgress, setReceitaProgress] = useState(0);

  // States para Maps
  const [filtrosMaps, setFiltrosMaps] = useState({ keyword: '', location: '' });
  const [isScanningMaps, setIsScanningMaps] = useState(false);
  const [mapsLogs, setMapsLogs] = useState([]);
  const [mapsProgress, setMapsProgress] = useState({ processed: 0, total: 0 });

  // API Keys (Persistência no LocalStorage)
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('capta_api_keys');
    return saved ? JSON.parse(saved) : { gemini: '', maps: '', backend: 'http://localhost:3006' };
  });

  useEffect(() => {
    localStorage.setItem('capta_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  // Monitoramento do Backend
  useEffect(() => {
    const checkBackend = async () => {
      if (!apiKeys.backend) return;
      try {
        const response = await fetch(`${apiKeys.backend}/health`, { method: 'GET' }).catch(() => null);
        setIsBackendOnline(response && response.ok);
      } catch (err) {
        setIsBackendOnline(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, [apiKeys.backend]);

  // CRM States
  const [crmColumns, setCrmColumns] = useState([
    { id: 'leads', title: 'Novos Leads', color: 'border-capta-primary' },
    { id: 'contato', title: 'Em Contato', color: 'border-yellow-500' },
    { id: 'qualificado', title: 'Qualificados', color: 'border-blue-500' },
    { id: 'fechamento', title: 'Fechamento', color: 'border-green-500' }
  ]);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [activeMenuColumn, setActiveMenuColumn] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [draggedLeadId, setDraggedLeadId] = useState(null);

  // Convex Data
  const leads = useQuery(api.leads.getAll) || [];
  const createLead = useMutation(api.leads.add);
  const updateLead = useMutation(api.leads.updateStatus);
  const deleteLead = useMutation(api.leads.remove);

  const displayLeads = leads;

  // Lógica de Scan
  const handleStartReceitaScan = () => {
    setIsScanningReceita(true);
    setReceitaProgress(0);
    const interval = setInterval(() => {
      setReceitaProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanningReceita(false);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const handleStartMapsScan = (mode) => {
    setIsScanningMaps(true);
    setMapsLogs(prev => [...prev, { type: 'info', text: `Iniciando motor GMN via ${mode}...` }]);
  };

  const moveToCRM = async (lead, origin = 'Receita') => {
    try {
      await createLead({
        name: lead.name || lead["Nome Empresa"] || 'Lead Sem Nome',
        contact: lead.contact || lead["Telefone 1"] || '',
        origin: origin,
        site: lead.site || lead["Site"] || '',
        dono: lead.dono || '',
        email: lead.email || lead["E-mail"] || '',
        instagram: lead.instagram || lead["Instagram"] || '',
        loc: lead.loc || lead["Endereço"] || '',
        cnpj: lead.cnpj || ''
      });
      alert('Lead movido para o CRM com sucesso!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragStart = (e, id) => {
    setDraggedLeadId(id);
    e.dataTransfer.setData('leadId', id);
  };

  const handleDragEnd = () => setDraggedLeadId(null);
  const handleDragOver = (e) => e.preventDefault();
  
  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('leadId');
    await updateLead({ id, status: columnId });
  };

  const handleAddColumn = () => {
    const newId = `col_${Date.now()}`;
    setCrmColumns([...crmColumns, { id: newId, title: 'Nova Etapa', color: 'border-slate-500' }]);
  };

  const handleRemoveColumn = (id) => {
    setCrmColumns(crmColumns.filter(c => c.id !== id));
  };

  const handleUpdateColumnTitle = (id, title) => {
    setCrmColumns(crmColumns.map(c => c.id === id ? { ...c, title } : c));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-capta-bg font-inter">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#2fd9f4 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <Header 
          title={activeTab === 'dashboard' ? 'Capta Command Center' : activeTab.replace('_', ' ')} 
          onLogout={onLogout} 
          isBackendOnline={isBackendOnline}
        />

        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="relative overflow-hidden bg-gradient-to-br from-capta-primary/10 via-transparent to-transparent border border-white/5 p-10 group">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 max-w-2xl">
                    <h2 className="text-4xl md:text-5xl font-space font-bold uppercase tracking-tighter leading-none">
                      Bem-vindo ao <span className="text-capta-primary">Capta Command</span>
                    </h2>
                    <p className="text-slate-400 font-inter text-sm leading-relaxed max-w-xl">
                      Sua central de inteligência para prospecção de alta performance. 
                    </p>
                    <div className="flex gap-4 pt-4">
                      <Button onClick={() => setActiveTab('receita')} className="bg-capta-primary text-capta-bg font-space font-bold h-11 px-6">Iniciar Mineração</Button>
                    </div>
                  </div>
                  <Database size={40} className="text-capta-primary animate-bounce hidden lg:block" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Leads no CRM', value: displayLeads.length, icon: BarChart },
                  { label: 'Mineração Ativa', value: isScanningReceita || isScanningMaps ? 'ON' : 'IDLE', icon: Activity },
                  { label: 'Base Validada', value: displayLeads.filter(l => l.cnpj).length, icon: Database },
                ].map((stat, i) => {
                  const StatIcon = stat.icon;
                  return (
                    <Card key={i} className="bg-capta-surface-low/30 border-white/5 backdrop-blur-md p-6">
                      <StatIcon size={18} className="text-capta-primary mb-2" />
                      <div className="text-3xl font-space font-bold text-white">{stat.value}</div>
                      <div className="text-[10px] font-space uppercase text-slate-500 mt-1">{stat.label}</div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* EXTRATOR RECEITA */}
          {activeTab === 'receita' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <Card className="bg-capta-surface-low/50 border-white/5 backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/[0.02] px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-space uppercase tracking-[0.3em] flex items-center gap-3 text-capta-primary">
                        <Database size={18} /> Deep Data Mining
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 font-mono">
                        Inteligência Artificial aplicada à base da Receita Federal
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest ml-1">Estado (UF)</label>
                      <select 
                        value={filtrosReceita.uf}
                        onChange={(e) => setFiltrosReceita({...filtrosReceita, uf: e.target.value})}
                        className="w-full h-11 bg-capta-surface-lowest border border-white/5 px-4 text-sm font-space text-white focus:border-capta-primary outline-none transition-all"
                      >
                        <option value="SP">São Paulo (SP)</option>
                        <option value="RJ">Rio de Janeiro (RJ)</option>
                        <option value="MG">Minas Gerais (MG)</option>
                        <option value="PR">Paraná (PR)</option>
                        <option value="SC">Santa Catarina (SC)</option>
                        <option value="RS">Rio Grande do Sul (RS)</option>
                        <option value="BA">Bahia (BA)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest ml-1">Cidade Alvo</label>
                      <Input value={filtrosReceita.cidade} onChange={(e) => setFiltrosReceita({...filtrosReceita, cidade: e.target.value})} placeholder="Ex: Rio de Janeiro" className="h-11 bg-capta-surface-lowest border-white/5" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest ml-1">CNAE Específico</label>
                      <Input value={filtrosReceita.cnae} onChange={(e) => setFiltrosReceita({...filtrosReceita, cnae: e.target.value})} placeholder="Ex: 4741500" className="h-11 bg-capta-surface-lowest border-white/5" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest ml-1">Palavra-Chave</label>
                      <Input value={filtrosReceita.segmento} onChange={(e) => setFiltrosReceita({...filtrosReceita, segmento: e.target.value})} placeholder="Ex: PADARIA, CONSTRUTORA" className="h-11 bg-capta-surface-lowest border-white/5" />
                    </div>
                  </div>

                  {/* Seletor de Nicho Estratégico */}
                  <div className="mt-6 p-4 bg-capta-primary/5 border border-capta-primary/20 flex flex-wrap items-center gap-4">
                    <div className="text-[10px] font-space text-capta-primary uppercase tracking-[0.2em] w-full mb-2">🎯 Inteligência de Nicho (Estratégia NSTI)</div>
                    {[
                      { id: '', label: 'TODOS OS SETORES' },
                      { id: 'SAUDE', label: 'SAÚDE / CLÍNICAS' },
                      { id: 'EDUCACAO', label: 'EDUCAÇÃO / ESCOLAS' },
                      { id: 'ESCRITORIOS', label: 'ESCRITÓRIOS (CONTAB/ADV)' },
                      { id: 'ENGENHARIA', label: 'ENGENHARIA / ARQ' },
                    ].map(n => (
                      <button
                        key={n.id}
                        onClick={() => setFiltrosReceita({...filtrosReceita, niche: n.id})}
                        className={`px-4 py-2 text-[10px] font-space uppercase tracking-wider transition-all duration-200 border ${
                          filtrosReceita.niche === n.id 
                            ? 'bg-capta-primary text-capta-bg border-capta-primary' 
                            : 'border-capta-surface-high text-slate-400 hover:border-capta-primary/50'
                        }`}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end gap-4 items-center">
                    {isScanningReceita && (
                      <div className="flex-1 mr-6">
                        <div className="flex justify-between text-[10px] font-space mb-2 text-capta-primary tracking-widest uppercase">
                          <span>Scanning Quantum Database...</span>
                          <span>{receitaProgress}%</span>
                        </div>
                        <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden">
                          <div className="h-full bg-capta-primary shadow-[0_0_10px_#2fd9f4]" style={{ width: `${receitaProgress}%` }}></div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleStartReceitaScan}
                      disabled={isScanningReceita}
                      size="lg"
                      className={`min-w-[200px] font-space font-bold uppercase tracking-[0.2em] text-[10px] ${
                        isScanningReceita ? 'bg-slate-800 text-slate-500' : 'bg-capta-primary text-capta-bg hover:shadow-[0_0_20px_rgba(47,217,244,0.4)]'
                      }`}
                    >
                      {isScanningReceita ? 'Infiltrating...' : 'Execute Extraction'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {receitaResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {receitaResults.map((lead, i) => (
                    <Card key={i} className="bg-capta-surface-lowest/40 border-white/5 p-5">
                      <h4 className="font-space font-bold text-white uppercase text-sm">{lead.name}</h4>
                      <Button onClick={() => moveToCRM(lead)} className="mt-4 bg-capta-primary text-capta-bg text-[10px] uppercase font-bold">Salvar no CRM</Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EXTRAÇÃO MAPS - GMN HÍBRIDO PRO */}
          {activeTab === 'maps' && (
            <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-180px)] flex flex-col">
              <div className="flex items-center justify-between bg-capta-surface-low border border-white/5 p-4 backdrop-blur-md">
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-capta-primary animate-pulse"></div>
                     <span className="text-[10px] font-space uppercase tracking-widest text-capta-primary font-bold">GMN Hybrid Engine v4.0</span>
                   </div>
                   <div className="h-4 w-[1px] bg-white/10"></div>
                   <Input value={filtrosMaps.location} onChange={(e) => setFiltrosMaps({...filtrosMaps, location: e.target.value})} placeholder="Localização" className="h-9 w-48 bg-black/20 border-white/5 font-space text-[11px]" />
                   <Input value={filtrosMaps.keyword} onChange={(e) => setFiltrosMaps({...filtrosMaps, keyword: e.target.value})} placeholder="Nicho/Keyword" className="h-9 w-48 bg-black/20 border-white/5 font-space text-[11px]" />
                </div>
                <div className="flex gap-3">
                   <Button onClick={() => handleStartMapsScan('Cloud')} disabled={isScanningMaps} className="bg-capta-primary/10 text-capta-primary border border-capta-primary/20 text-[9px] font-space font-bold uppercase px-4 h-9">
                      Cloud Mining
                   </Button>
                   <Button onClick={() => handleStartMapsScan('Local')} disabled={isScanningMaps} className="bg-capta-primary text-capta-bg text-[9px] font-space font-bold uppercase px-4 h-9">
                      Local Injector
                   </Button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-2 bg-black/40 border border-white/5 relative group">
                  <iframe 
                    src={`https://www.google.com/maps?q=${encodeURIComponent(filtrosMaps.keyword + ' em ' + filtrosMaps.location)}&output=embed`}
                    className="w-full h-full border-none grayscale-[0.3] opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute top-4 left-4 p-3 bg-capta-bg/90 border border-capta-primary/30 backdrop-blur-md">
                    <div className="text-[10px] font-mono text-capta-primary flex items-center gap-2">
                      <Activity size={12} className="animate-pulse" />
                      COORD_STREAM: ACTIVE
                    </div>
                  </div>
                </div>

                <div className="bg-capta-surface-low/50 border border-white/5 flex flex-col font-mono text-[10px] overflow-hidden">
                  <div className="p-3 border-b border-white/5 bg-white/5 font-space uppercase tracking-widest text-slate-400">
                    Console de Mineração
                  </div>
                  <div className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar bg-black/20">
                    {mapsLogs.length === 0 ? (
                      <div className="text-slate-700 italic">Aguardando comando de inicialização...</div>
                    ) : (
                      mapsLogs.map((log, i) => (
                        <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-capta-primary/70'}`}>
                          <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                          <span>{log.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {isScanningMaps && (
                    <div className="p-4 border-t border-white/5 bg-capta-primary/5">
                      <div className="flex justify-between mb-2">
                        <span className="text-capta-primary uppercase">Progresso</span>
                        <span>{mapsProgress.processed} / {mapsProgress.total}</span>
                      </div>
                      <div className="h-1 bg-white/5 w-full">
                        <div className="h-full bg-capta-primary" style={{ width: `${(mapsProgress.processed / mapsProgress.total) * 100 || 0}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CRM PIPELINE */}
          {activeTab === 'crm' && (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="text-xl font-space uppercase tracking-widest flex items-center gap-2"><Users className="text-capta-primary" /> CRM Pipeline</div>
                <Button onClick={handleAddColumn} className="bg-capta-surface-low border border-capta-surface-high text-xs px-4 h-9">Adicionar Etapa</Button>
              </div>

              <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start">
                {crmColumns.map(col => (
                  <div 
                    key={col.id} 
                    className="flex-none w-[320px] bg-capta-surface-low border border-capta-surface-high min-h-[100px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                    <div className={`p-4 border-t-2 ${col.color} bg-capta-surface-lowest/50 flex justify-between items-center`}>
                       <span className="font-space text-sm uppercase text-white">{col.title}</span>
                       <span className="text-xs font-mono bg-capta-surface-high px-2 py-0.5 text-slate-300">
                         {displayLeads.filter(l => l.status === col.id).length}
                       </span>
                    </div>
                    
                    <div className="p-3 space-y-3">
                      {displayLeads.filter(l => l.status === col.id).map(lead => (
                        <Card 
                          key={lead._id || lead.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead._id || lead.id)}
                          onDragEnd={handleDragEnd}
                          className="bg-capta-surface-lowest/80 border-white/5 p-4 cursor-grab active:cursor-grabbing hover:border-capta-primary/50 transition-all"
                        >
                          <div className="text-xs font-space font-bold text-white mb-2">{lead.name}</div>
                          <div className="text-[10px] text-slate-500 mb-4">{lead.contact}</div>
                          <div className="flex justify-between items-center border-t border-white/5 pt-3">
                             <Button variant="ghost" size="sm" onClick={() => setEditingLead(lead)} className="h-6 text-[9px] uppercase font-bold text-capta-primary">View</Button>
                             <select className="bg-transparent text-[9px] text-slate-500 outline-none" value={lead.status} onChange={(e) => updateLead({id: lead._id || lead.id, status: e.target.value})}>
                                {crmColumns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                             </select>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-capta-primary/20 rounded-xl"><Settings size={32} className="text-capta-primary" /></div>
                <div>
                  <h2 className="text-2xl font-space font-bold uppercase tracking-widest text-white">Configurações</h2>
                  <p className="text-xs text-slate-500">Gerencie suas chaves de API e conexões</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-capta-surface-low border-white/5 p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-space text-slate-400 uppercase">Gemini 1.5 Flash API Key</label>
                    <Input type="password" value={apiKeys.gemini} onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})} className="bg-capta-surface-lowest border-white/10 h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-space text-slate-400 uppercase">Google Maps API Key</label>
                    <Input type="password" value={apiKeys.maps} onChange={(e) => setApiKeys({...apiKeys, maps: e.target.value})} className="bg-capta-surface-lowest border-white/10 h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-space text-slate-400 uppercase">URL do Servidor Backend</label>
                    <Input value={apiKeys.backend} onChange={(e) => setApiKeys({...apiKeys, backend: e.target.value})} placeholder="https://seu-backend.onrender.com" className="bg-capta-surface-lowest border-white/10 h-11" />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* MODAL EDIÇÃO */}
          {editingLead && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-lg bg-capta-surface-lowest border-white/5 p-6">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <div className="text-sm font-space font-bold text-capta-primary uppercase">Ficha do Lead</div>
                  <button onClick={() => setEditingLead(null)}><X size={20} /></button>
                </div>
                <div className="space-y-4">
                   <Input value={editingLead.name} onChange={(e) => setEditingLead({...editingLead, name: e.target.value})} placeholder="Nome" />
                   <Input value={editingLead.contact} onChange={(e) => setEditingLead({...editingLead, contact: e.target.value})} placeholder="Contato" />
                </div>
                <div className="mt-8 flex justify-end gap-3">
                   <Button onClick={() => setEditingLead(null)} variant="ghost">Cancelar</Button>
                   <Button onClick={() => { updateLead({id: editingLead._id || editingLead.id, status: editingLead.status}); setEditingLead(null); }} className="bg-capta-primary text-capta-bg font-bold">Salvar</Button>
                </div>
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function Header({ title, onLogout, isBackendOnline }) {
  return (
    <header className="h-16 border-b border-white/5 bg-capta-surface-low/30 backdrop-blur-md flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-space font-bold uppercase tracking-[0.3em] text-white">{title}</h1>
        <div className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
      <button onClick={onLogout} className="text-slate-400 hover:text-red-400"><LogOut size={18} /></button>
    </header>
  );
}

function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart },
    { id: 'receita', label: 'Receita Federal', icon: Building2 },
    { id: 'maps', label: 'Google Maps', icon: MapPin },
    { id: 'crm', label: 'CRM Pipeline', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
  return (
    <aside className="w-64 border-r border-white/5 bg-capta-surface-lowest flex flex-col">
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-capta-primary rounded-xl flex items-center justify-center"><Database size={22} className="text-capta-bg" /></div>
          <div><h1 className="text-lg font-space font-bold text-white">CAPTA</h1><p className="text-[8px] font-space text-capta-primary uppercase">Prospect v5.0</p></div>
        </div>
      </div>
      <nav className="flex-1 p-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 transition-all ${isActive ? 'bg-capta-primary/10 text-capta-primary' : 'text-slate-500 hover:text-white'}`}>
              <Icon size={18} />
              <span className="text-[11px] font-space uppercase font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem('capta_session');
    if (saved) setSession(JSON.parse(saved));
    setLoading(false);
  }, []);
  const handleLogin = (user) => { setSession(user); localStorage.setItem('capta_session', JSON.stringify(user)); };
  const handleLogout = () => { setSession(null); localStorage.removeItem('capta_session'); };
  if (loading) return <div className="h-screen w-screen bg-capta-bg flex items-center justify-center"><div className="w-12 h-12 border-2 border-capta-primary border-t-transparent rounded-full animate-spin"></div></div>;
  return (
    <div className="h-screen w-screen bg-capta-bg text-slate-200 overflow-hidden">
      {!session ? <LoginForm onLogin={handleLogin} /> : <AuthenticatedApp user={session} onLogout={handleLogout} />}
    </div>
  );
}

export default App;
