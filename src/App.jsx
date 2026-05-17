import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Building2, MapPin, Users, Settings, MessageSquare, 
  Search, Zap, Plus, Edit, Trash2, Database, Activity, 
  ArrowRight, CheckCircle, ExternalLink, Globe, LogOut, 
  Mail, Phone, Instagram, Linkedin, Twitter, MoreVertical, 
  X, Camera, GripVertical, Filter, Download, AlertCircle, Save,
  Send, Star, Shield, Paperclip
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const API_BASE = 'http://localhost:3007';

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
  const [serverStats, setServerStats] = useState({ latency: 0, dbCount: 0, uptime: 0 });
  
  // States para Receita
  const [filtrosReceita, setFiltrosReceita] = useState({ uf: 'SP', cidade: '', bairro: '', cnae: '', segmento: '', niche: '' });
  const [receitaResults, setReceitaResults] = useState([]);
  const [allReceitaLeads, setAllReceitaLeads] = useState([]);
  const [receitaPage, setReceitaPage] = useState(0);
  const [isScanningReceita, setIsScanningReceita] = useState(false);
  const [receitaProgress, setReceitaProgress] = useState(0);

  // States para Maps
  const [filtrosMaps, setFiltrosMaps] = useState({ keyword: '', location: '', minRating: '0', minReviews: '0' });
  const [isScanningMaps, setIsScanningMaps] = useState(false);
  const [mapsLogs, setMapsLogs] = useState([]);
  const [mapsScanResults, setMapsScanResults] = useState([]);
  const [storedGmnLeads, setStoredGmnLeads] = useState([]);
  const [activeMapJobId, setActiveMapJobId] = useState(null);
  const [mapsProgress, setMapsProgress] = useState({ processed: 0, total: 0 });

  // API Keys (Persistência no LocalStorage)
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('capta_api_keys');
    const parsed = saved ? JSON.parse(saved) : { gemini: '', maps: '', backend: 'http://localhost:3007' };
    
    // MIGRATION: Se estiver na porta antiga, força a 3007
    if (parsed.backend === 'http://localhost:3006') {
      parsed.backend = 'http://localhost:3007';
    }
    
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem('capta_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  // Monitoramento do Backend
  useEffect(() => {
    const checkBackend = async () => {
      if (!apiKeys.backend) return;
      const start = Date.now();
      try {
        const response = await fetch(`${apiKeys.backend}/health`, { method: 'GET' }).catch((e) => {
          console.error("[HEALTH CHECK ERROR]", e);
          return null;
        });
        if (response && response.ok) {
          const data = await response.json();
          console.log("[HEALTH CHECK SUCCESS]", data);
          setServerStats({
            latency: Date.now() - start,
            dbCount: data.db?.count || 0,
            uptime: data.uptime || 0
          });
          setIsBackendOnline(true);
        } else {
          console.warn("[HEALTH CHECK OFFLINE] Resposta inválida do servidor");
          setIsBackendOnline(false);
        }
      } catch (err) {
        console.error("[HEALTH CHECK CRITICAL]", err);
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
    { id: 'receita', title: 'RECEITA QUALIFICADA', color: 'border-blue-500' },
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
  const updateDetails = useMutation(api.leads.updateDetails);
  const deleteLead = useMutation(api.leads.remove);

  const displayLeads = leads;

  // States para WhatsApp
  const [waMessage, setWaMessage] = useState("Olá [NOME], vi que sua empresa está crescendo e gostaria de apresentar nossas soluções de TI e Segurança Eletrônica da NSTI. Podemos conversar?");
  const [waLogs, setWaLogs] = useState([]);
  const [isSendingWA, setIsSendingWA] = useState(false);
  // States Evolution API (aditivo)
  const [waStatus, setWaStatus] = useState({ state: 'close', connected: false, label: 'Desconectado' });
  const [waQrCode, setWaQrCode] = useState(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [waSelectedList, setWaSelectedList] = useState('qualificado');
  const waQrPollRef = useRef(null);
  // States Abordagem Rápida (modal do card)
  const [waCardCheck, setWaCardCheck] = useState(null); // null | 'checking' | {exists, jid, formattedPhone} | 'error'
  const [waCardMsg, setWaCardMsg] = useState('');
  const [waCardSending, setWaCardSending] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadData, setNewLeadData] = useState({ name: '', contact: '', socio: '', loc: '', status: 'leads' });
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [waProgress, setWaProgress] = useState({ processed: 0, total: 0 });

  const [attachDropdown, setAttachDropdown] = useState(false);
  const [attachUrlInput, setAttachUrlInput] = useState('');
  const [attachTypeInput, setAttachTypeInput] = useState('instagram');

  // Lógica de Scan
  const handleNicheSelect = (nicheId) => {
    const nicheMap = {
      'SAUDE': '8630',
      'EDUCACAO': '8513',
      'ESCRITORIOS': '6911',
      'ENGENHARIA': '7112'
    };
    setFiltrosReceita({
      ...filtrosReceita,
      niche: nicheId,
      cnae: nicheMap[nicheId] || ''
    });
  };

  const handleStartReceitaScan = async (filtrosOverride = null) => {
    const filtros = filtrosOverride || filtrosReceita;
    setIsScanningReceita(true);
    setReceitaProgress(0);
    setReceitaResults([]);
    setAllReceitaLeads([]);
    setReceitaPage(0);
    
    // Simulação de progresso visual enquanto o fetch acontece
    const progressInterval = setInterval(() => {
       setReceitaProgress(prev => (prev < 90 ? prev + 2 : prev));
    }, 500);

    try {
      const res = await fetch(`${apiKeys.backend}/api/receita/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtros)
      });
      const data = await res.json();
      console.log("[DEBUG] Receita Results:", data);
      
      const validLeads = (data.leads || [])
        .filter(l => l.name && l.name !== 'SEM NOME FANTASIA' && l.name !== 'EMPRESA SEM NOME');

      setAllReceitaLeads(validLeads);
      setReceitaPage(0);
      setReceitaResults(validLeads.slice(0, 100));
      clearInterval(progressInterval);
      setReceitaProgress(100);
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Erro na extração:", err);
      alert("Erro ao conectar com o motor backend. Verifique se ele está rodando na porta 3007.");
    } finally {
      setIsScanningReceita(false);
    }
  };

  const handleDeepQualify = async () => {
    if (receitaResults.length === 0) return;
    setIsScanningReceita(true);
    setReceitaProgress(0);
    
    try {
      const res = await fetch(`${apiKeys.backend}/api/receita/qualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: receitaResults })
      });
      const { job_id } = await res.json();
      
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`${apiKeys.backend}/api/hunter/status/${job_id}`);
          if (!statusRes.ok) return;
          const job = await statusRes.json();
          
          setReceitaProgress(Math.floor((job.processed / job.total) * 100));
          
          if (job.status === 'idle') {
            clearInterval(poll);
            setIsScanningReceita(false);
            setReceitaProgress(100);
            
            const leadsToMove = job.results || [];
            console.log(`[DEEP MINING] Movendo ${leadsToMove.length} leads para o CRM...`);

            try {
              // Movimentação em lotes de 10 para estabilidade
              for (let i = 0; i < leadsToMove.length; i += 10) {
                const batch = leadsToMove.slice(i, i + 10);
                await Promise.all(batch.map(lead => moveToCRM(lead, 'Receita (Qualificado)', 'receita')));
              }

              const totalBlocks = Math.ceil(allReceitaLeads.length / 100);
              const isLastBlock = (receitaPage + 1) >= totalBlocks;

              if (!isLastBlock) {
                alert(`Robô finalizou a Etapa ${receitaPage + 1}! ${leadsToMove.length} leads qualificados foram movidos para o CRM.\n\nPreparando o próximo bloco...`);
                const nextPage = receitaPage + 1;
                setReceitaPage(nextPage);
                setReceitaResults(allReceitaLeads.slice(nextPage * 100, (nextPage + 1) * 100));
              } else {
                alert(`Robô finalizou todos os leads! ${leadsToMove.length} leads da última etapa movidos com sucesso.`);
                setAllReceitaLeads([]);
                setReceitaResults([]);
              }
            } catch (moveErr) {
              console.error("[CRM MOVE ERROR]", moveErr);
            }
          }
        } catch (e) {
          console.error("Erro no polling:", e);
          clearInterval(poll);
          setIsScanningReceita(false);
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      setIsScanningReceita(false);
    }
  };

  const handleAddLeadManually = (status = 'leads') => {
    setNewLeadData({ name: '', contact: '', socio: '', loc: '', status });
    setIsAddModalOpen(true);
  };

  const submitNewLead = async () => {
    if (!newLeadData.name) {
      alert("O nome da empresa é obrigatório.");
      return;
    }
    try {
      await createLead({
        name: newLeadData.name.toUpperCase(),
        contact: newLeadData.contact,
        socio: newLeadData.socio,
        loc: newLeadData.loc,
        origin: 'Manual',
        status: newLeadData.status,
        instagram: newLeadData.instagram,
        linkedin: newLeadData.linkedin,
        site: newLeadData.site,
        mapsUrl: newLeadData.mapsUrl
      });
      setIsAddModalOpen(false);
      console.log("[CRM] Card criado com sucesso!");
    } catch (err) {
      console.error("[CRM CREATE FAIL]", err);
      alert(`Falha ao criar card: ${err.message}`);
    }
  };

  const fetchGmnLeads = async () => {
    if (!apiKeys.backend) return;
    try {
      const res = await fetch(`${apiKeys.backend}/api/hunter/gmn_leads`);
      const data = await res.json();
      const normalized = (data.leads || []).map(l => ({
        ...l,
        name: l.name || l["Nome Empresa"] || 'SEM NOME',
        phone: l.phone || l["Telefone 1"] || '',
        rating: l.rating || l["Nota"] || '0',
        reviews: l.reviews || l["Avaliações"] || '0',
        address: l.address || l["Endereço"] || '',
        site: l.site || l["Site"] || '',
        instagram: l.instagram || l["Instagram"] || '',
        mapsUrl: l.mapsUrl || l["Google Maps"] || '',
        socio: l.socio || l["Decisor"] || '',
        email: l.email || l["E-mail"] || '',
        origin: 'Google Maps'
      }));
      setStoredGmnLeads(normalized);
    } catch (e) { console.error('Erro ao buscar leads GMN', e); }
  };

  useEffect(() => { fetchGmnLeads(); }, [apiKeys.backend]);
  useEffect(() => {
    if (activeTab !== 'maps') return;
    const interval = setInterval(fetchGmnLeads, 5000);
    return () => clearInterval(interval);
  }, [activeTab, apiKeys.backend]);

  const clearGmnLeads = async () => {
    if (!confirm("Limpar toda a base extraída do Google Maps?")) return;
    await fetch(`${apiKeys.backend}/api/hunter/gmn_leads`, { method: 'DELETE' });
    setStoredGmnLeads([]);
    setMapsScanResults([]);
  };

  const handleStartMapsScan = async (mode) => {
    if (!filtrosMaps.keyword) return alert("Digite um Nicho/Keyword antes de iniciar!");
    setIsScanningMaps(true);
    setMapsLogs([{ type: 'info', text: `[🚀] Iniciando motor ${mode === 'Cloud' ? 'API GOOGLE' : 'PUPPETEER'}...` }]);
    setMapsScanResults([]);
    setMapsProgress({ total: 0, processed: 0 });
    const endpoint = mode === 'Cloud' ? '/api/hunter/gmn_api' : '/api/hunter/gmn';
    try {
      const res = await fetch(`${apiKeys.backend}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtrosMaps)
      });
      const data = await res.json();
      const jobId = data.job_id;
      if (jobId) setActiveMapJobId(jobId);
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`${apiKeys.backend}/api/hunter/status/${jobId}`);
          if (!statusRes.ok) return;
          const job = await statusRes.json();
          setMapsLogs(job.logs || []);
          setMapsProgress({ processed: job.processed, total: job.total });
          if (job.status === 'idle' || job.status === 'error') {
            clearInterval(poll);
            setIsScanningMaps(false);
            setActiveMapJobId(null);
            if (job.results && job.results.length > 0) {
              const normalized = job.results.map(l => ({
                ...l,
                name: l.name || l["Nome Empresa"] || 'SEM NOME',
                phone: l.phone || l["Telefone 1"] || '',
                rating: l.rating || l["Nota"] || '0',
                reviews: l.reviews || l["Avaliações"] || '0',
                address: l.address || l["Endereço"] || '',
                site: l.site || l["Site"] || '',
                instagram: l.instagram || l["Instagram"] || '',
                mapsUrl: l.mapsUrl || l["Google Maps"] || '',
                socio: l.socio || l["Decisor"] || '',
                email: l.email || l["E-mail"] || '',
                origin: 'Google Maps'
              }));
              setMapsScanResults(normalized);
            }
            fetchGmnLeads();
          }
        } catch (e) {
          clearInterval(poll);
          setIsScanningMaps(false);
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setIsScanningMaps(false);
    }
  };

  const handleStartWhatsAppSequence = async () => {
    const targetLeads = leads.filter(l => l.status === 'qualificado');
    if (targetLeads.length === 0) {
      alert("Nenhum lead na coluna 'Qualificados' para disparar.");
      return;
    }

    setIsSendingWA(true);
    setWaLogs([{ type: 'info', text: `[📡] Iniciando sequência para ${targetLeads.length} leads...` }]);
    
    try {
      const res = await fetch(`${apiKeys.backend}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: targetLeads, messageTemplate: waMessage })
      });
      
      const { job_id } = await res.json();
      
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`${apiKeys.backend}/api/hunter/status/${job_id}`);
          if (!statusRes.ok) return;
          const job = await statusRes.json();
          
          setWaLogs(job.logs || []);
          setWaProgress({ processed: job.processed, total: job.total });
          
          if (job.status === 'idle' || job.status === 'error') {
            clearInterval(poll);
            setIsSendingWA(false);
          }
        } catch (e) {
          clearInterval(poll);
          setIsSendingWA(false);
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setIsSendingWA(false);
      setWaLogs(prev => [...prev, { type: 'error', text: `[💥] Erro ao conectar com o servidor: ${err.message}` }]);
    }
  };

  // Evolution API — funções (aditivo, não interferem em nada existente)
  const fetchWaStatus = React.useCallback(async () => { // eslint-disable-line react-hooks/exhaustive-deps
    if (!apiKeys.backend) return;
    try {
      const r = await fetch(`${apiKeys.backend}/api/whatsapp/status`);
      if (!r.ok) return;
      const data = await r.json();
      setWaStatus(data);
      if (data.connected && waQrPollRef.current) {
        clearInterval(waQrPollRef.current);
        waQrPollRef.current = null;
        setWaQrCode(null);
      }
    } catch {}
  }, [apiKeys.backend]);

  const fetchWaQr = async () => {
    setIsLoadingQr(true);
    setWaQrCode(null);
    try {
      const r = await fetch(`${apiKeys.backend}/api/whatsapp/qr`);
      const data = await r.json();
      if (data.qrCode) {
        setWaQrCode(data.qrCode);
        // Polling para detectar conexão após escanear
        if (waQrPollRef.current) clearInterval(waQrPollRef.current);
        waQrPollRef.current = setInterval(fetchWaStatus, 4000);
      } else {
        alert(data.error || 'Não foi possível gerar QR Code.');
      }
    } catch (e) {
      alert('Evolution API offline. Verifique se está rodando na VPS ou localmente.');
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleStartWaCampaign = async () => {
    const listMap = { qualificado: 'qualificado', contato: 'contato', all: null };
    const filter = listMap[waSelectedList];
    const targetLeads = filter ? leads.filter(l => l.status === filter) : leads;
    if (targetLeads.length === 0) { alert('Nenhum lead na lista selecionada.'); return; }
    setIsSendingWA(true);
    setWaLogs([{ type: 'info', text: `[📡] Iniciando campanha para ${targetLeads.length} leads...` }]);
    try {
      const res = await fetch(`${apiKeys.backend}/api/whatsapp/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: targetLeads, messageTemplate: waMessage })
      });
      const { job_id } = await res.json();
      const poll = setInterval(async () => {
        try {
          const s = await fetch(`${apiKeys.backend}/api/hunter/status/${job_id}`);
          if (!s.ok) return;
          const job = await s.json();
          setWaLogs(job.logs || []);
          setWaProgress({ processed: job.processed, total: job.total });
          if (job.status === 'idle' || job.status === 'error') { clearInterval(poll); setIsSendingWA(false); }
        } catch { clearInterval(poll); setIsSendingWA(false); }
      }, 2000);
    } catch (err) { setIsSendingWA(false); setWaLogs([{ type: 'error', text: `[💥] ${err.message}` }]); }
  };
  const handleCheckWaNumber = async (phone) => {
    setWaCardCheck('checking');
    try {
      const r = await fetch(`${apiKeys.backend}/api/whatsapp/check-number`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await r.json();
      setWaCardCheck(data.error ? 'error' : data);
    } catch { setWaCardCheck('error'); }
  };

  const handleSendWaSingle = async (lead) => {
    if (!waCardCheck?.exists || waCardSending) return;
    setWaCardSending(true);
    try {
      const r = await fetch(`${apiKeys.backend}/api/whatsapp/send-single`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: waCardCheck.formattedPhone, message: waCardMsg })
      });
      const data = await r.json();
      if (data.success) {
        await updateLead({ id: lead._id || lead.id, status: 'contato' });
        setEditingLead(null);
        setWaCardCheck(null);
        setWaCardMsg('');
      } else {
        alert(`Erro ao enviar: ${data.error}`);
      }
    } catch (e) { alert(`Erro: ${e.message}`); }
    finally { setWaCardSending(false); }
  };
  // FIM Evolution API funções

  const moveToCRM = async (lead, origin = 'Receita', targetStatus = 'leads') => {
    try {
      await createLead({
        name: lead.name || lead["Nome Empresa"] || 'Lead Sem Nome',
        contact: lead.contact || lead["Telefone 1"] || '',
        origin: origin,
        status: targetStatus,
        site: lead.site || lead["Site"] || '',
        dono: lead.dono || '',
        email: lead.email || lead["E-mail"] || '',
        instagram: lead.instagram || lead["Instagram"] || '',
        linkedin: lead.linkedin || lead["LinkedIn"] || '',
        socio: lead.socio || '',
        loc: lead.loc || lead["Endereço"] || '',
        cnpj: lead.cnpj || '',
        mapsUrl: lead.googleMaps || lead.mapsUrl || '',
        security_hook: lead.security_hook
      });
      console.log("[CRM] Lead movido com sucesso!");
    } catch (err) {
      console.error("[CRM MOVE FAIL]", err);
      alert(`Falha ao mover lead: ${err.message}`);
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
              {/* SERVER HEALTH MONITOR */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-capta-surface-low/20 border border-white/5 p-4 flex items-center justify-between">
                    <div className="space-y-1">
                       <div className="text-[9px] font-space text-slate-500 uppercase tracking-widest">Network Latency</div>
                       <div className={`text-xl font-space font-bold ${serverStats.latency < 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {serverStats.latency}ms
                       </div>
                    </div>
                    <Activity size={20} className="text-capta-primary/30" />
                 </div>
                 <div className="bg-capta-surface-low/20 border border-white/5 p-4 flex items-center justify-between">
                    <div className="space-y-1">
                       <div className="text-[9px] font-space text-slate-500 uppercase tracking-widest">Total Database Leads</div>
                       <div className="text-xl font-space font-bold text-white">
                          {(serverStats.dbCount / 1000000).toFixed(1)}M
                       </div>
                    </div>
                    <Database size={20} className="text-capta-primary/30" />
                 </div>
                 <div className="bg-capta-surface-low/20 border border-white/5 p-4 flex items-center justify-between">
                    <div className="space-y-1">
                       <div className="text-[9px] font-space text-slate-500 uppercase tracking-widest">System Engine Uptime</div>
                       <div className="text-xl font-space font-bold text-white">
                          {(serverStats.uptime / 3600).toFixed(1)}h
                       </div>
                    </div>
                    <Zap size={20} className="text-capta-primary/30" />
                 </div>
              </div>

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
                  <div className="flex flex-col items-center gap-4 bg-capta-surface-low/40 border border-capta-primary/30 p-6 backdrop-blur-xl">
                     <div className="text-[10px] font-space text-capta-primary uppercase tracking-[0.3em] animate-pulse">Auto-Pilot Mode</div>
                     <Shield size={48} className="text-capta-primary" />
                     <Button 
                       onClick={() => {
                         setActiveTab('receita');
                         setFiltrosReceita({...filtrosReceita, niche: 'SAUDE', cnae: '8630'});
                       }}
                       className="w-full bg-capta-primary/10 text-capta-primary border border-capta-primary/20 hover:bg-capta-primary hover:text-capta-bg transition-all font-space font-bold uppercase text-[10px] tracking-widest h-10"
                     >
                       Prospectar Clientes (Gancho CFTV)
                     </Button>
                  </div>
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
                      <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest ml-1">Bairro</label>
                      <Input value={filtrosReceita.bairro} onChange={(e) => setFiltrosReceita({...filtrosReceita, bairro: e.target.value})} placeholder="Ex: Copacabana" className="h-11 bg-capta-surface-lowest border-white/5" />
                    </div>
                    
                    <div className="space-y-2 col-span-1 md:col-span-2">
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
                        onClick={() => handleNicheSelect(n.id)}
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
                          <span>ESCANEANDO BASE DE DADOS...</span>
                          <span>{receitaResults.length} LEADS ENCONTRADOS</span>
                        </div>
                        <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden">
                          <div className="h-full bg-capta-primary shadow-[0_0_10px_#2fd9f4]" style={{ width: `${receitaProgress}%` }}></div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={() => handleStartReceitaScan()}
                      disabled={isScanningReceita}
                      size="lg"
                      className={`min-w-[150px] font-space font-bold uppercase tracking-[0.2em] text-[10px] ${
                        isScanningReceita ? 'bg-slate-800 text-slate-500' : 'bg-capta-primary text-capta-bg hover:shadow-[0_0_20px_rgba(47,217,244,0.4)]'
                      }`}
                    >
                      {isScanningReceita ? 'EXTRAINDO...' : 'EXTRAIR BASE DE DADOS'}
                    </Button>

                    {receitaResults.length > 0 && !isScanningReceita && (
                      <div className="flex items-center gap-3">
                        {allReceitaLeads.length > 100 && (
                          <div className="flex gap-2 mr-2">
                             <Button 
                               onClick={() => {
                                 const prevPage = Math.max(0, receitaPage - 1);
                                 setReceitaPage(prevPage);
                                 setReceitaResults(allReceitaLeads.slice(prevPage * 100, (prevPage + 1) * 100));
                               }}
                               disabled={receitaPage === 0}
                               variant="outline"
                               className="h-11 border-white/10 text-slate-400 hover:text-white"
                             >
                               Anterior
                             </Button>
                             <div className="flex items-center px-4 bg-white/5 border border-white/10 text-[10px] font-space text-capta-primary uppercase tracking-widest">
                               Parte {receitaPage + 1} de {Math.ceil(allReceitaLeads.length / 100)}
                             </div>
                             <Button 
                               onClick={() => {
                                 const nextPage = Math.min(Math.ceil(allReceitaLeads.length / 100) - 1, receitaPage + 1);
                                 setReceitaPage(nextPage);
                                 setReceitaResults(allReceitaLeads.slice(nextPage * 100, (nextPage + 1) * 100));
                               }}
                               disabled={(receitaPage + 1) >= Math.ceil(allReceitaLeads.length / 100)}
                               variant="outline"
                               className="h-11 border-white/10 text-slate-400 hover:text-white"
                             >
                               Próxima
                             </Button>
                          </div>
                        )}
                        
                        <Button 
                          onClick={handleDeepQualify}
                          size="lg"
                          className="min-w-[150px] font-space font-bold uppercase tracking-[0.2em] text-[10px] bg-capta-primary/20 text-capta-primary border border-capta-primary/30 hover:bg-capta-primary/40"
                        >
                          QUALIFICAR ESTA PARTE
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {allReceitaLeads.length > 100 && (
                <div className="text-center text-slate-400 text-[10px] font-space tracking-widest uppercase mt-2">
                  Total da base local: {allReceitaLeads.length} leads. Fragmentado em blocos de 100 para segurança.
                </div>
              )}

              {receitaResults.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8 animate-in slide-in-from-bottom duration-500">
                  {receitaResults.map((lead, i) => (
                    <Card key={i} className="bg-capta-surface-lowest/40 border border-white/5 p-5 group hover:border-capta-primary/30 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <h4 className="font-space font-bold text-white uppercase text-sm group-hover:text-capta-primary transition-colors">{lead.name}</h4>
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                             {lead.socio ? (
                               <span className="text-[9px] font-space font-bold bg-capta-primary/10 text-capta-primary px-2 py-0.5 rounded uppercase tracking-wider">
                                 Sócio: {lead.socio}
                               </span>
                             ) : (
                               <span className="bg-white/5 px-2 py-0.5 rounded">CNPJ: {lead.cnpj}</span>
                             )}
                             <span className="text-capta-primary/50">|</span>
                             <span>{lead.loc}</span>
                             {lead.instagram && (
                             <div className="flex items-center gap-2 text-[10px] text-pink-500/70">
                               <Instagram size={12} />
                               Instagram OK
                             </div>
                           )}
                           {lead.site && (
                             <div className="flex items-center gap-2 text-[10px] text-blue-500/70">
                               <Globe size={12} />
                               Site OK
                             </div>
                           )}
                           {!lead.qualified ? (
                             <div className="flex items-center gap-2 text-[10px] text-slate-500">
                               <Activity size={12} />
                               AGUARDANDO ANÁLISE
                             </div>
                           ) : lead.security_hook ? (
                             <div className="flex items-center gap-2 text-[10px] text-red-500 font-bold">
                               <AlertCircle size={12} />
                               SEGURANÇA JÁ INSTALADA
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 text-[10px] text-green-500 font-bold">
                               <Shield size={12} />
                               POTENCIAL PARA CFTV
                             </div>
                           )}
                        </div>
                        </div>
                        <div className="bg-capta-primary/10 px-2 py-1 border border-capta-primary/20 rounded text-[9px] font-space text-capta-primary uppercase">
                          {lead.origin}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-4">
                           {lead.contact && (
                             <div className="flex items-center gap-2 text-[10px] text-slate-400">
                               <Phone size={12} className="text-capta-primary" />
                               {lead.contact}
                             </div>
                           )}
                        </div>
                        <Button 
                          onClick={() => moveToCRM(lead)} 
                          size="sm"
                          className="bg-capta-primary text-capta-bg text-[10px] uppercase font-bold px-4 hover:shadow-[0_0_15px_rgba(47,217,244,0.3)]"
                        >
                          Mover para CRM
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EXTRAÇÃO MAPS - GMN HÍBRIDO PRO */}
          {activeTab === 'maps' && (
            <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-180px)] flex flex-col">

              {/* Top Controls Bar */}
              <div className="flex items-center justify-between bg-capta-surface-low border border-white/5 p-4 backdrop-blur-md">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-capta-primary animate-pulse"></div>
                    <span className="text-[10px] font-space uppercase tracking-widest text-capta-primary font-bold">GMN Hybrid Engine v4.0</span>
                  </div>
                  <div className="h-4 w-[1px] bg-white/10 hidden lg:block"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-space text-slate-500 uppercase tracking-widest hidden lg:block">Target:</span>
                    <Input value={filtrosMaps.location} onChange={(e) => setFiltrosMaps({...filtrosMaps, location: e.target.value})} placeholder="Ex: Rio de Janeiro, RJ" className="h-8 w-44 bg-black/20 border-white/5 font-space text-[10px]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-space text-slate-500 uppercase tracking-widest hidden lg:block">Nicho:</span>
                    <Input value={filtrosMaps.keyword} onChange={(e) => setFiltrosMaps({...filtrosMaps, keyword: e.target.value})} placeholder="Ex: Clínicas Estéticas" className="h-8 w-44 bg-black/20 border-white/5 font-space text-[10px]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-space text-slate-500 uppercase tracking-widest hidden lg:block">Min ⭐:</span>
                    <Input value={filtrosMaps.minRating} onChange={(e) => setFiltrosMaps({...filtrosMaps, minRating: e.target.value})} placeholder="0" className="h-8 w-16 bg-black/20 border-white/5 font-space text-[10px] text-center" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-space text-slate-500 uppercase tracking-widest hidden lg:block">Min Aval.:</span>
                    <Input value={filtrosMaps.minReviews} onChange={(e) => setFiltrosMaps({...filtrosMaps, minReviews: e.target.value})} placeholder="0" className="h-8 w-16 bg-black/20 border-white/5 font-space text-[10px] text-center" />
                  </div>
                </div>
                <div className="flex gap-2 items-center shrink-0">
                  <Button onClick={clearGmnLeads} variant="ghost" className="text-red-400 hover:bg-red-400/10 text-[9px] font-space uppercase tracking-widest h-8 px-3">
                    <Trash2 size={12} className="mr-1" /> Limpar
                  </Button>
                  <Button onClick={() => handleStartMapsScan('Cloud')} disabled={isScanningMaps} className="bg-capta-primary/10 text-capta-primary border border-capta-primary/20 text-[9px] font-space font-bold uppercase px-4 h-9">
                    {isScanningMaps ? <Activity size={12} className="animate-spin mr-1" /> : null} Cloud Mining
                  </Button>
                  <Button onClick={() => handleStartMapsScan('Local')} disabled={isScanningMaps} className="bg-capta-primary text-capta-bg text-[9px] font-space font-bold uppercase px-4 h-9">
                    Local Injector
                  </Button>
                </div>
              </div>

              {/* Main Grid: Mapa + Painel Lateral */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-0">

                {/* Google Maps Iframe */}
                <div className="lg:col-span-8 bg-black/40 border border-white/5 relative overflow-hidden group flex flex-col">
                  <div className="p-2 bg-capta-surface-low/80 backdrop-blur-md border-b border-white/5 flex justify-between items-center shrink-0">
                    <span className="text-[8px] font-mono text-slate-500 uppercase flex items-center gap-2">
                      <Globe size={10} /> maps.google.com — integrated_terminal
                    </span>
                    <Button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(filtrosMaps.keyword + ' em ' + filtrosMaps.location)}`, '_blank')}
                      className="bg-black/40 hover:bg-black/70 text-white border border-white/10 text-[8px] font-space uppercase h-6 px-2">
                      <ExternalLink size={9} className="mr-1" /> Abrir Maps
                    </Button>
                  </div>
                  {(filtrosMaps.keyword || filtrosMaps.location) ? (
                    <iframe
                      src={`https://www.google.com/maps?q=${encodeURIComponent(filtrosMaps.keyword + ' em ' + filtrosMaps.location)}&output=embed&hl=pt-BR`}
                      className="flex-1 w-full border-none grayscale-[0.2]"
                      title="Google Maps Mining Area"
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center space-y-3 opacity-25">
                        <MapPin size={40} className="text-capta-primary mx-auto" />
                        <p className="text-[11px] font-space uppercase tracking-widest text-slate-500">Digite Localização e Nicho para ativar o mapa</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-12 left-4 p-2 bg-capta-bg/90 border border-capta-primary/30 backdrop-blur-md">
                    <div className="text-[9px] font-mono text-capta-primary flex items-center gap-2">
                      <Activity size={10} className="animate-pulse" /> COORD_STREAM: ACTIVE
                    </div>
                  </div>
                </div>

                {/* Painel Lateral: Stats + Terminal + Resultados */}
                <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 shrink-0">
                    <Card className="bg-capta-surface-low border-white/5 p-4 rounded-none">
                      <div className="text-[9px] font-space text-slate-500 uppercase tracking-widest mb-1">Fila Global</div>
                      <div className="text-2xl font-space font-bold text-capta-primary">{storedGmnLeads.length}</div>
                    </Card>
                    <Card className="bg-capta-surface-low border-white/5 p-4 rounded-none">
                      <div className="text-[9px] font-space text-slate-500 uppercase tracking-widest mb-1">Processando</div>
                      <div className="text-2xl font-space font-bold text-white flex items-center gap-2">
                        {isScanningMaps ? <Activity size={20} className="text-capta-primary animate-pulse" /> : <span className="text-slate-600">—</span>}
                      </div>
                    </Card>
                  </div>

                  {/* Terminal de Logs */}
                  <div className="bg-black/60 border border-white/5 flex flex-col overflow-hidden font-mono text-[9px] shrink-0" style={{height: '160px'}}>
                    <div className="p-2 bg-white/5 border-b border-white/5 flex items-center gap-2 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-slate-500 uppercase tracking-widest text-[8px]">Terminal Output</span>
                      {isScanningMaps && <span className="text-capta-primary animate-pulse text-[8px] ml-auto">{mapsProgress.processed}/{mapsProgress.total}</span>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {mapsLogs.length === 0 ? (
                        <div className="text-slate-700 italic">Pronto para receber dados...</div>
                      ) : (
                        mapsLogs.map((log, i) => (
                          <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-slate-400'}`}>
                            <span className="opacity-30 shrink-0">{new Date().toLocaleTimeString()}</span>
                            <span className="truncate">{log.text}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tabela Leads Qualificados GMN */}
                  <div className="flex-1 bg-capta-surface-low/40 border border-white/5 overflow-hidden flex flex-col min-h-0">
                    <div className="p-3 bg-white/5 border-b border-white/5 text-[9px] font-space uppercase tracking-widest text-slate-400 flex justify-between shrink-0">
                      <span>Leads Qualificados Maps</span>
                      <span className="text-capta-primary">Live Sync</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {storedGmnLeads.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 gap-2">
                          <Database size={32} />
                          <span className="text-[8px] font-space uppercase">Sem dados extraídos</span>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <tbody className="divide-y divide-white/5 font-space text-[10px]">
                            {storedGmnLeads.map((lead, i) => (
                              <tr key={i} className="hover:bg-capta-primary/5 transition-colors group">
                                <td className="p-3">
                                  <div className="font-bold text-white uppercase truncate w-36 group-hover:text-capta-primary transition-colors">{lead.name}</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-yellow-400 text-[8px] flex items-center gap-1">
                                      <Star size={8} fill="currentColor" /> {lead.rating || '0'}
                                    </span>
                                    <span className="text-slate-600 text-[8px]">({lead.reviews || '0'} aval.)</span>
                                  </div>
                                  <div className="text-[8px] text-slate-500 truncate w-36 italic mt-0.5">{lead.site || lead.address || 'Sem site'}</div>
                                </td>
                                <td className="p-3 text-right">
                                  <Button onClick={() => moveToCRM(lead, 'Maps')}
                                    className="h-7 w-7 p-0 bg-capta-primary/10 text-capta-primary border border-capta-primary/20 hover:bg-capta-primary hover:text-capta-bg transition-all">
                                    <ArrowRight size={14} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* CRM PIPELINE / KANBAN */}
          {activeTab === 'crm' && (
            <div className="flex gap-6 h-[calc(100vh-160px)] overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {crmColumns.map(col => (
                <div 
                  key={col.id} 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className="flex-shrink-0 w-85 flex flex-col bg-capta-surface-low/20 border-t-2 border-white/5 backdrop-blur-md rounded-t-xl"
                  style={{ borderTopColor: col.color.includes('capta-primary') ? '#2fd9f4' : col.color.replace('border-', '') }}
                >
                  <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                      <h3 className="font-space font-bold text-[11px] uppercase tracking-[0.2em] text-white">{col.title}</h3>
                      <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                        {displayLeads.filter(l => l.status === col.id).length}
                      </span>
                    </div>
                    <Button onClick={() => handleAddLeadManually(col.id)} size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-capta-primary hover:bg-capta-primary/10">
                      <Plus size={16} />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {displayLeads
                      .filter(lead => lead.status === col.id)
                      .map(lead => (
                        <div
                          key={lead._id || lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead._id || lead.id)}
                          onDragEnd={handleDragEnd}
                          className="bg-capta-surface-lowest/60 border border-white/5 p-4 group hover:border-capta-primary/40 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden flex flex-col gap-3 rounded-md shadow-md"
                        >
                          <div className="flex justify-between items-start">
                            <span className={`text-[8px] font-space px-2 py-0.5 uppercase tracking-tighter rounded ${
                              lead.origin === 'Receita' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-capta-primary/10 text-capta-primary border border-capta-primary/20'
                            }`}>
                              {lead.origin || 'MAPS'}
                            </span>
                            {lead.security_hook === false && (
                              <span className="text-[8px] font-space px-2 py-0.5 uppercase tracking-tighter rounded bg-green-500/10 text-green-400 border border-green-500/20">
                                Oportunidade
                              </span>
                            )}
                            {lead.security_hook === true && (
                              <span className="text-[8px] font-space px-2 py-0.5 uppercase tracking-tighter rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                Concorrente
                              </span>
                            )}
                            <Button 
                              onClick={(e) => { e.stopPropagation(); deleteLead({ id: lead._id || lead.id }); }} 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                          
                          <div>
                            <h4 className="font-space font-bold text-white text-[13px] uppercase leading-tight group-hover:text-capta-primary transition-colors">{lead.name}</h4>
                            {lead.socio && <div className="text-[10px] font-space text-slate-400 mt-1 uppercase tracking-tighter flex items-center gap-1"><Users size={10} className="text-capta-primary/70" /> SÓCIO: <span className="text-white">{lead.socio}</span></div>}
                          </div>
                          
                          <div className="space-y-2 bg-black/30 p-3 rounded-lg border border-white/5 text-[10px] text-slate-400">
                             {lead.contact && (
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                   <Phone size={10} className="text-green-500/70" /> 
                                   <span className="font-mono text-white/90">{lead.contact}</span>
                                 </div>
                                 <span className="text-[8px] bg-green-500/10 text-green-500 px-1.5 rounded">DIRECT</span>
                               </div>
                             )}
                             {lead.email && <div className="flex items-center gap-2 truncate"><Mail size={10} className="text-yellow-500/70" /> <span className="truncate text-white/80">{lead.email}</span></div>}
                             {lead.loc && <div className="flex items-center gap-2 truncate opacity-60"><MapPin size={10} className="text-blue-500/70" /> <span className="truncate">{lead.loc}</span></div>}
                          </div>

                          <div className="mt-2 pt-3 border-t border-white/5 flex justify-between items-center">
                             <div className="flex gap-2">
                               {lead.linkedin && (
                                 <a href={lead.linkedin.startsWith('http') ? lead.linkedin : `https://${lead.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all flex items-center gap-1.5 px-3" title="LinkedIn" onClick={(e) => e.stopPropagation()}>
                                   <Linkedin size={12} />
                                   <span className="text-[9px] font-space font-bold uppercase tracking-wider">LinkedIn</span>
                                 </a>
                               )}
                               {lead.instagram && (
                                 <a href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded transition-colors" title="Instagram" onClick={(e) => e.stopPropagation()}>
                                   <Instagram size={12} />
                                 </a>
                               )}
                               {lead.linkedin && (
                                 <a href={lead.linkedin.startsWith('http') ? lead.linkedin : `https://${lead.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition-colors" title="LinkedIn" onClick={(e) => e.stopPropagation()}>
                                   <Linkedin size={12} />
                                 </a>
                               )}
                               {lead.site && (
                                 <a href={lead.site.startsWith('http') ? lead.site : `https://${lead.site}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors" title="Website" onClick={(e) => e.stopPropagation()}>
                                   <Globe size={12} />
                                 </a>
                               )}
                             </div>
                             <Button onClick={(e) => { e.stopPropagation(); setEditingLead(lead); setWaCardCheck(null); setWaCardMsg(''); }} variant="ghost" size="sm" className="h-6 px-2 text-[9px] uppercase hover:bg-white/5 border border-transparent hover:border-white/10">Ficha</Button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))
            }
              <Button onClick={handleAddColumn} className="flex-shrink-0 w-12 h-full bg-transparent border border-dashed border-white/5 hover:border-capta-primary/30"><Plus size={20}/></Button>
            </div>
          )}

          {/* WHATSAPP — Evolution API Premium Panel */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6 animate-in fade-in duration-500">

              {/* Status Card */}
              <div className={`flex items-center justify-between px-6 py-4 rounded-xl border ${waStatus.connected ? 'bg-emerald-950/40 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-900/60 border-white/5'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${waStatus.connected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="font-space text-sm font-bold uppercase tracking-widest text-white">{waStatus.label}</span>
                  {waStatus.connected && <span className="text-[10px] font-mono text-emerald-400/70 border border-emerald-500/20 px-2 py-0.5 rounded">Evolution API • Ativo</span>}
                </div>
                <button onClick={fetchWaStatus} className="text-[10px] font-space uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors px-3 py-1 border border-white/5 rounded hover:border-white/10">
                  Verificar
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Coluna Esquerda — QR Code ou Painel de Campanha */}
                <Card className="bg-capta-surface-low/50 border-white/5 backdrop-blur-md p-6 space-y-5">

                  {!waStatus.connected ? (
                    /* QR Code Section */
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-lg font-space font-bold uppercase text-white tracking-widest">Conectar WhatsApp</h2>
                        <p className="text-[11px] text-slate-500 font-mono mt-1">Gere o QR Code e escaneie com seu celular para vincular a instância.</p>
                      </div>
                      {waQrCode ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-3 bg-white rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                            <img src={waQrCode.startsWith('data:') ? waQrCode : `data:image/png;base64,${waQrCode}`} alt="QR Code WhatsApp" className="w-52 h-52" />
                          </div>
                          <p className="text-[11px] text-cyan-400/80 font-mono animate-pulse text-center">Aguardando leitura... verificando a cada 4s</p>
                          <button onClick={() => { if (waQrPollRef.current) clearInterval(waQrPollRef.current); setWaQrCode(null); }} className="text-[10px] font-space uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={fetchWaQr}
                          disabled={isLoadingQr}
                          className="w-full h-14 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-300 font-space font-bold uppercase tracking-[0.15em] text-sm rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] flex items-center justify-center gap-2"
                        >
                          {isLoadingQr ? <><Activity className="animate-spin" size={16} /> Gerando QR...</> : <><Send size={16} /> Gerar QR Code de Conexão</>}
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Campanha Section — só aparece quando conectado */
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-lg font-space font-bold uppercase text-white tracking-widest">Disparos Estratégicos</h2>
                        <p className="text-[11px] text-emerald-400/70 font-mono mt-1">WhatsApp conectado via Evolution API.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest">Lista de Destino</label>
                        <select
                          value={waSelectedList}
                          onChange={e => setWaSelectedList(e.target.value)}
                          className="w-full h-10 bg-black/30 border border-white/10 px-3 text-white font-space text-sm outline-none focus:border-cyan-500/50 transition-colors rounded"
                        >
                          <option value="qualificado">Leads Qualificados ({leads.filter(l => l.status === 'qualificado').length})</option>
                          <option value="contato">Em Contato ({leads.filter(l => l.status === 'contato').length})</option>
                          <option value="all">Toda a Base ({leads.length})</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest">Template (use [NOME])</label>
                        <textarea
                          value={waMessage}
                          onChange={e => setWaMessage(e.target.value)}
                          className="w-full h-40 bg-black/30 border border-white/10 p-3 text-white font-space text-sm outline-none focus:border-cyan-500/50 transition-all resize-none rounded"
                          placeholder="Olá [NOME], ..."
                        />
                      </div>

                      <button
                        onClick={handleStartWaCampaign}
                        disabled={isSendingWA}
                        className={`w-full h-14 font-space font-bold uppercase tracking-[0.15em] text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${isSendingWA ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]'}`}
                      >
                        {isSendingWA ? <><Activity className="animate-spin" size={16} /> Enviando...</> : <><Send size={16} /> Iniciar Campanha</>}
                      </button>
                    </div>
                  )}
                </Card>

                {/* Coluna Direita — Console */}
                <div className="bg-capta-surface-low/30 border border-white/5 flex flex-col font-mono text-[11px] h-[calc(100vh-320px)] min-h-[400px] overflow-hidden rounded-xl">
                  <div className="p-4 border-b border-white/5 bg-white/5 font-space uppercase tracking-[0.2em] text-slate-400 flex justify-between items-center">
                    <span>Console de Operações WA</span>
                    {isSendingWA && <span className="text-[10px] text-emerald-400 animate-pulse">● Campanha Ativa</span>}
                  </div>
                  <div className="flex-1 p-5 space-y-1.5 overflow-y-auto custom-scrollbar bg-black/20">
                    {waLogs.length === 0 ? (
                      <div className="text-slate-700 italic">Aguardando comando...</div>
                    ) : (
                      waLogs.map((log, i) => (
                        <div key={i} className={`flex gap-3 leading-relaxed ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-400'}`}>
                          <span className="opacity-30 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                          <span className="break-all">{log.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {isSendingWA && (
                    <div className="p-4 border-t border-white/5 bg-white/5">
                      <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-space uppercase tracking-widest text-cyan-400">Progresso</span>
                        <span className="font-mono text-white">{waProgress.processed} / {waProgress.total}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 w-full rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                          style={{ width: `${(waProgress.processed / waProgress.total) * 100 || 0}%` }} />
                      </div>
                    </div>
                  )}
                </div>
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

          {/* MODAL EDIÇÃO (TRELLO CLONE) */}
          {editingLead && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-capta-surface-low border border-white/10 w-full max-w-4xl shadow-2xl rounded-xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
                
                {/* MAIN CONTENT (LEFT) */}
                <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar">
                  <div className="flex items-start gap-4">
                    <Building2 className="text-slate-400 mt-2" size={24} />
                    <div className="flex-1">
                      <Input 
                        value={editingLead.name} 
                        onChange={(e) => setEditingLead({...editingLead, name: e.target.value})} 
                        placeholder="Nome da Empresa" 
                        className="text-2xl font-bold bg-transparent border-transparent hover:border-white/10 focus:bg-black/20 focus:border-capta-primary h-auto py-2 px-3 -ml-3 text-white"
                      />
                      <div className="text-xs text-slate-500 ml-1 mt-1 font-space">
                        na lista <span className="underline decoration-slate-600 cursor-pointer">{editingLead.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pl-[40px] space-y-8">
                    {/* Contato & Localização */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold font-space text-sm">
                        <MapPin size={18} className="text-slate-400"/> Contato e Localização
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-space tracking-wider">Telefone / WhatsApp</label>
                          <Input value={editingLead.contact} onChange={e => setEditingLead({...editingLead, contact: e.target.value})} placeholder="(00) 00000-0000" className="bg-black/20 border-white/5" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-space tracking-wider">E-mail Corporativo</label>
                          <Input value={editingLead.email} onChange={e => setEditingLead({...editingLead, email: e.target.value})} placeholder="contato@empresa.com" className="bg-black/20 border-white/5" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] text-slate-500 uppercase font-space tracking-wider">Endereço / Cidade</label>
                          <Input value={editingLead.loc} onChange={e => setEditingLead({...editingLead, loc: e.target.value})} placeholder="São Paulo - SP" className="bg-black/20 border-white/5" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Sócio / Decisor */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold font-space text-sm">
                        <Users size={18} className="text-slate-400"/> Sócio / Decisor
                      </div>
                      <div className="space-y-1 w-full md:w-1/2">
                        <label className="text-[10px] text-slate-500 uppercase font-space tracking-wider">Nome Completo</label>
                        <Input value={editingLead.socio} onChange={e => setEditingLead({...editingLead, socio: e.target.value})} placeholder="Ex: João da Silva" className="bg-black/20 border-white/5" />
                      </div>
                    </div>

                    {/* Abordagem Rápida WhatsApp — ADITIVO */}
                    <div className="border border-emerald-500/15 rounded-xl bg-emerald-950/20 p-5 space-y-4">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold font-space text-sm">
                        <Send size={16} className="text-emerald-400"/> Abordagem Rápida NSTI
                      </div>

                      {/* Telefone + Validar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-black/30 border border-white/10 px-3 py-2 rounded text-white font-mono text-sm">
                          {editingLead.contact || <span className="text-slate-600 italic text-xs">Sem telefone cadastrado</span>}
                        </div>
                        <button
                          onClick={() => { setWaCardCheck(null); handleCheckWaNumber(editingLead.contact); }}
                          disabled={!editingLead.contact || waCardCheck === 'checking'}
                          className="px-4 py-2 rounded bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 font-space text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        >
                          {waCardCheck === 'checking' ? <><Activity className="animate-spin" size={12}/> Validando...</> : 'Validar WhatsApp'}
                        </button>
                      </div>

                      {/* Badge resultado */}
                      {waCardCheck && waCardCheck !== 'checking' && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded text-[11px] font-mono font-bold ${waCardCheck === 'error' ? 'bg-red-950/40 border border-red-500/20 text-red-400' : waCardCheck.exists ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-400' : 'bg-red-950/40 border border-red-500/20 text-red-400'}`}>
                          {waCardCheck === 'error' ? '⚠️ Evolution API offline' : waCardCheck.exists ? `✅ WhatsApp Confirmado — ${waCardCheck.formattedPhone}` : '❌ Número Sem WhatsApp Ativo'}
                        </div>
                      )}

                      {/* Editor de mensagem — só mostra se número válido */}
                      {waCardCheck?.exists && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest">Mensagem Personalizada</label>
                            <textarea
                              value={waCardMsg || waMessage.replace(/\[NOME\]/gi, (editingLead.name || '').split(' ')[0])}
                              onChange={e => setWaCardMsg(e.target.value)}
                              rows={4}
                              className="w-full bg-black/30 border border-white/10 p-3 text-white font-space text-xs outline-none focus:border-emerald-500/40 transition-all resize-none rounded"
                            />
                          </div>
                          <button
                            onClick={() => handleSendWaSingle(editingLead)}
                            disabled={waCardSending}
                            className={`w-full h-11 rounded font-space font-bold uppercase tracking-[0.15em] text-xs transition-all flex items-center justify-center gap-2 ${waCardSending ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}
                          >
                            {waCardSending ? <><Activity className="animate-spin" size={14}/> Enviando...</> : <><Send size={14}/> Disparar e Mover para Em Contato</>}
                          </button>
                        </>
                      )}
                    </div>
                    {/* FIM Abordagem Rápida */}

                    {/* Links e Anexos */}
                    {(editingLead.instagram || editingLead.site || editingLead.linkedin || editingLead.mapsUrl) && (
                      <div>
                        <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold font-space text-sm">
                          <Paperclip size={18} className="text-slate-400"/> Anexos do Lead
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {editingLead.instagram && (
                            <a href={editingLead.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 px-4 py-2.5 rounded border border-pink-500/20 transition-all font-space uppercase text-[10px] tracking-widest font-bold">
                              <Instagram size={14} /> Instagram
                            </a>
                          )}
                          {editingLead.site && (
                            <a href={editingLead.site} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded border border-emerald-500/20 transition-all font-space uppercase text-[10px] tracking-widest font-bold">
                              <Globe size={14} /> Site Oficial
                            </a>
                          )}
                          {editingLead.linkedin && (
                            <a href={editingLead.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2.5 rounded border border-blue-500/20 transition-all font-space uppercase text-[10px] tracking-widest font-bold">
                              <Linkedin size={14} /> LinkedIn
                            </a>
                          )}
                          {editingLead.mapsUrl && (
                            <a href={editingLead.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2.5 rounded border border-amber-500/20 transition-all font-space uppercase text-[10px] tracking-widest font-bold">
                              <MapPin size={14} /> Google Maps
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SIDEBAR (RIGHT) */}
                <div className="w-full md:w-64 bg-black/40 p-6 border-l border-white/5 flex flex-col gap-6">
                  <div className="flex justify-end">
                    <button onClick={() => { setEditingLead(null); setAttachDropdown(false); }} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded transition-colors"><X size={20}/></button>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[11px] font-space text-slate-400 uppercase tracking-widest mb-2 font-bold">Adicionar ao cartão</div>
                    
                    <div className="space-y-2">
                       <div className="text-[10px] font-space text-slate-500 uppercase tracking-widest mb-1">Análise NSTI</div>
                       <div className="flex flex-col gap-2">
                          <button 
                             onClick={() => setEditingLead({...editingLead, security_hook: false})}
                             className={`flex items-center gap-2 px-3 py-2 rounded text-[10px] font-space uppercase font-bold border transition-all ${editingLead.security_hook === false ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-black/20 text-slate-500 border-white/5 hover:border-white/10'}`}
                          >
                             <CheckCircle size={14}/> Oportunidade
                          </button>
                          <button 
                             onClick={() => setEditingLead({...editingLead, security_hook: true})}
                             className={`flex items-center gap-2 px-3 py-2 rounded text-[10px] font-space uppercase font-bold border transition-all ${editingLead.security_hook === true ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-black/20 text-slate-500 border-white/5 hover:border-white/10'}`}
                          >
                             <AlertCircle size={14}/> Concorrente
                          </button>
                       </div>
                    </div>

                    <div className="h-px bg-white/5 my-2"></div>

                    
                    {attachDropdown ? (
                      <div className="bg-black/60 p-4 rounded border border-white/10 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] uppercase font-space text-slate-400 font-bold tracking-widest">Novo Anexo</span>
                          <button onClick={() => setAttachDropdown(false)} className="text-slate-500 hover:text-white"><X size={14}/></button>
                        </div>
                        <select 
                          value={attachTypeInput} 
                          onChange={e=>setAttachTypeInput(e.target.value)} 
                          className="w-full bg-black/40 text-[11px] font-space border border-white/5 p-2.5 rounded text-slate-300 outline-none focus:border-capta-primary transition-colors"
                        >
                          <option value="instagram">Instagram</option>
                          <option value="site">Site</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="mapsUrl">Google Maps</option>
                        </select>
                        <Input 
                          value={attachUrlInput} 
                          onChange={e=>setAttachUrlInput(e.target.value)} 
                          placeholder="Cole o link aqui..." 
                          className="h-9 text-[11px] bg-black/40 border-white/5 focus:border-capta-primary rounded" 
                        />
                        <Button 
                          onClick={() => {
                            const newLeadState = {...editingLead, [attachTypeInput]: attachUrlInput};
                            setEditingLead(newLeadState);
                            // Auto-save no backend igual ao Trello
                            updateDetails({ 
                              id: newLeadState._id || newLeadState.id, 
                              [attachTypeInput]: attachUrlInput 
                            });
                            setAttachDropdown(false);
                            setAttachUrlInput('');
                          }} 
                          size="sm" 
                          className="w-full h-9 text-[10px] bg-slate-200 text-black hover:bg-white font-bold uppercase tracking-widest rounded"
                        >
                          Anexar
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => setAttachDropdown(true)} variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 h-10 bg-black/20 rounded">
                        <Paperclip size={16}/> Anexar Link
                      </Button>
                    )}

                    <div className="pt-6 space-y-3">
                      <div className="text-[11px] font-space text-slate-400 uppercase tracking-widest mb-2 font-bold">Ações do Cartão</div>
                      
                      <Button 
                        onClick={() => { 
                          updateDetails({ 
                            id: editingLead._id || editingLead.id, 
                            name: editingLead.name, 
                            contact: editingLead.contact, 
                            email: editingLead.email, 
                            loc: editingLead.loc, 
                            socio: editingLead.socio, 
                            instagram: editingLead.instagram, 
                            site: editingLead.site,
                            linkedin: editingLead.linkedin,
                            mapsUrl: editingLead.mapsUrl,
                            security_hook: editingLead.security_hook
                          }); 
                          setEditingLead(null); 
                          setAttachDropdown(false);
                        }} 
                        className="w-full justify-start gap-3 bg-capta-primary text-capta-bg font-bold hover:bg-capta-primary/80 h-10 rounded uppercase tracking-widest text-[10px]"
                      >
                        <Save size={16}/> Salvar Alterações
                      </Button>
                      
                      <Button onClick={() => { deleteLead({id: editingLead._id || editingLead.id}); setEditingLead(null); setAttachDropdown(false); }} variant="ghost" className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/10 h-10 rounded uppercase tracking-widest text-[10px] mt-4">
                        <Trash2 size={16}/> Excluir Card
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      
      {/* MODAL ADICIONAR LEAD (TRELLO CLONE) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-capta-surface-low border border-white/10 w-full max-w-4xl shadow-2xl rounded-xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            
            {/* MAIN CONTENT (LEFT) */}
            <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar">
              <div className="flex items-start gap-4">
                <Building2 className="text-capta-primary mt-2" size={24} />
                <div className="flex-1">
                  <Input 
                    autoFocus
                    value={newLeadData.name} 
                    onChange={e => setNewLeadData({...newLeadData, name: e.target.value})} 
                    placeholder="Nome da Nova Empresa" 
                    className="text-2xl font-bold bg-transparent border-transparent hover:border-white/10 focus:bg-black/20 focus:border-capta-primary h-auto py-2 px-3 -ml-3 text-white placeholder:text-slate-600"
                  />
                  <div className="text-xs text-slate-500 ml-1 mt-1 font-space">
                    criando na lista <span className="text-capta-primary">{newLeadData.status}</span>
                  </div>
                </div>
              </div>

              <div className="pl-[40px] space-y-8">
                {/* Contato & Localização */}
                <div>
                  <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold font-space text-sm">
                    <MapPin size={18} className="text-slate-400"/> Contato e Localização
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-space tracking-wider">Telefone / WhatsApp</label>
                      <Input value={newLeadData.contact} onChange={e => setNewLeadData({...newLeadData, contact: e.target.value})} placeholder="(00) 00000-0000" className="bg-black/20 border-white/5" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-space tracking-wider">E-mail Corporativo</label>
                      <Input value={newLeadData.email} onChange={e => setNewLeadData({...newLeadData, email: e.target.value})} placeholder="contato@empresa.com" className="bg-black/20 border-white/5" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] text-slate-500 uppercase font-space tracking-wider">Endereço / Cidade</label>
                      <Input value={newLeadData.loc} onChange={e => setNewLeadData({...newLeadData, loc: e.target.value})} placeholder="São Paulo - SP" className="bg-black/20 border-white/5" />
                    </div>
                  </div>
                </div>
                
                {/* Sócio / Decisor */}
                <div>
                  <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold font-space text-sm">
                    <Users size={18} className="text-slate-400"/> Sócio / Decisor
                  </div>
                  <div className="space-y-1 w-full md:w-1/2">
                    <label className="text-[10px] text-slate-500 uppercase font-space tracking-wider">Nome Completo</label>
                    <Input value={newLeadData.socio} onChange={e => setNewLeadData({...newLeadData, socio: e.target.value})} placeholder="Ex: João da Silva" className="bg-black/20 border-white/5" />
                  </div>
                </div>

                {/* Links e Anexos */}
                {(newLeadData.instagram || newLeadData.site || newLeadData.linkedin || newLeadData.mapsUrl) && (
                  <div>
                    <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold font-space text-sm">
                      <Paperclip size={18} className="text-slate-400"/> Anexos do Lead
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {newLeadData.instagram && (
                        <a href={newLeadData.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 px-4 py-2.5 rounded border border-pink-500/20 transition-all font-space uppercase text-[10px] tracking-widest font-bold">
                          <Instagram size={14} /> Instagram
                        </a>
                      )}
                      {newLeadData.site && (
                        <a href={newLeadData.site} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded border border-emerald-500/20 transition-all font-space uppercase text-[10px] tracking-widest font-bold">
                          <Globe size={14} /> Site Oficial
                        </a>
                      )}
                      {newLeadData.linkedin && (
                        <a href={newLeadData.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2.5 rounded border border-blue-500/20 transition-all font-space uppercase text-[10px] tracking-widest font-bold">
                          <Linkedin size={14} /> LinkedIn
                        </a>
                      )}
                      {newLeadData.mapsUrl && (
                        <a href={newLeadData.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-4 py-2.5 rounded border border-amber-500/20 transition-all font-space uppercase text-[10px] tracking-widest font-bold">
                          <MapPin size={14} /> Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SIDEBAR (RIGHT) */}
            <div className="w-full md:w-64 bg-black/40 p-6 border-l border-white/5 flex flex-col gap-6">
              <div className="flex justify-end">
                <button onClick={() => { setIsAddModalOpen(false); setAttachDropdown(false); }} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded transition-colors"><X size={20}/></button>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-space text-slate-400 uppercase tracking-widest mb-2 font-bold">Adicionar ao cartão</div>
                
                {attachDropdown ? (
                  <div className="bg-black/60 p-4 rounded border border-white/10 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-space text-slate-400 font-bold tracking-widest">Novo Anexo</span>
                      <button onClick={() => setAttachDropdown(false)} className="text-slate-500 hover:text-white"><X size={14}/></button>
                    </div>
                    <select 
                      value={attachTypeInput} 
                      onChange={e=>setAttachTypeInput(e.target.value)} 
                      className="w-full bg-black/40 text-[11px] font-space border border-white/5 p-2.5 rounded text-slate-300 outline-none focus:border-capta-primary transition-colors"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="site">Site</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="mapsUrl">Google Maps</option>
                    </select>
                    <Input 
                      value={attachUrlInput} 
                      onChange={e=>setAttachUrlInput(e.target.value)} 
                      placeholder="Cole o link aqui..." 
                      className="h-9 text-[11px] bg-black/40 border-white/5 focus:border-capta-primary rounded" 
                    />
                    <Button 
                      onClick={() => {
                        setNewLeadData({...newLeadData, [attachTypeInput]: attachUrlInput});
                        setAttachDropdown(false);
                        setAttachUrlInput('');
                      }} 
                      size="sm" 
                      className="w-full h-9 text-[10px] bg-slate-200 text-black hover:bg-white font-bold uppercase tracking-widest rounded"
                    >
                      Anexar
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setAttachDropdown(true)} variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 h-10 bg-black/20 rounded">
                    <Paperclip size={16}/> Anexar Link
                  </Button>
                )}

                <div className="pt-6 space-y-3">
                  <div className="text-[11px] font-space text-slate-400 uppercase tracking-widest mb-2 font-bold">Ações do Cartão</div>
                  
                  <Button 
                    onClick={() => { submitNewLead(); setAttachDropdown(false); }} 
                    className="w-full justify-start gap-3 bg-capta-primary text-capta-bg font-bold hover:shadow-[0_0_20px_rgba(47,217,244,0.4)] h-10 transition-all rounded uppercase tracking-widest text-[10px]"
                  >
                    <Plus size={16}/> Criar Cartão
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
    { id: 'whatsapp', label: 'WhatsApp Dispatch', icon: MessageSquare },
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
