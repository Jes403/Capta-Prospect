import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useAuthActions, useConvexAuth } from '@convex-dev/auth/react'
import { api } from '../convex/_generated/api'
import Login from './Login'

import { 
  LayoutDashboard, 
  MapPin, 
  Building2, 
  Users, 
  Send, 
  Settings, 
  Search, 
  BarChart, 
  Activity,
  Download,
  CheckCircle, 
  AlertCircle,
  Database,
  ArrowRight,
  Crosshair,
  Plus,
  Edit, 
  X,
  GripVertical,
  MoreVertical,
  Trash2,
  LogOut,
  Upload,
  Globe,
  Zap,
  Mail,
  Filter,
  LineChart,
  Camera,
  Instagram,
  Linkedin,
  Twitter
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"


// Layout Components
const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-space tracking-wider transition-all duration-200 border-l-2 ${
      active 
        ? 'bg-capta-surface-high border-capta-primary text-capta-primary shadow-[0_0_15px_rgba(47,217,244,0.1)]' 
        : 'border-transparent text-slate-400 hover:bg-capta-surface-low hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="uppercase">{label}</span>
  </button>
)

const Header = ({ title, onLogout, isBackendOnline }) => (
  <header className="h-20 border-b border-white/5 bg-capta-surface-lowest/40 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-50">
    <div className="flex items-center gap-6">
      <div className="relative">
        <div className={`h-3 w-3 rounded-full animate-pulse shadow-[0_0_15px] ${isBackendOnline ? 'bg-capta-primary shadow-capta-primary' : 'bg-red-500 shadow-red-500'}`}></div>
        <div className={`absolute inset-0 h-3 w-3 rounded-full animate-ping opacity-20 ${isBackendOnline ? 'bg-capta-primary' : 'bg-red-500'}`}></div>
      </div>
      <h1 className="text-2xl font-space font-bold uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
        {title}
      </h1>
    </div>
    
    <div className="flex items-center gap-8">
      <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
        <div className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
        <span className="text-[10px] font-space text-slate-400 uppercase tracking-widest">
          Motor Engine: <span className={isBackendOnline ? 'text-white font-bold' : 'text-red-400'}>{isBackendOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </span>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onLogout}
        className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 gap-2 font-space uppercase tracking-widest text-[10px]"
      >
        <LogOut size={14} />
        Logout
      </Button>
    </div>
  </header>
)


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3006';

export default function App() {
  // Acesso Direto: Ignorando autenticação para estabilidade local
  return <AuthenticatedApp onLogout={() => console.log('Logout desativado no modo local')} />
}

function AuthenticatedApp({ onLogout }) {

  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Carregar chaves do localStorage ao iniciar
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('capta_api_keys');
    return saved ? JSON.parse(saved) : { gemini: '', maps: '', backend: BACKEND_URL };
  });

  // Salvar chaves sempre que mudarem
  useEffect(() => {
    localStorage.setItem('capta_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);
  
  // States for Receita Extractor
  const [isScanningReceita, setIsScanningReceita] = useState(false)
  const [receitaProgress, setReceitaProgress] = useState(0)
  const [receitaResults, setReceitaResults] = useState([])
  const [filtrosReceita, setFiltrosReceita] = useState({ uf: 'RJ', cidade: 'Rio de Janeiro', cnae: '', segmento: '', niche: '' })
  
  // States for Maps Extractor (Premium Robo GMN)
  const [isScanningMaps, setIsScanningMaps] = useState(false)
  const [mapsResults, setMapsResults] = useState([])
  const [mapsLogs, setMapsLogs] = useState([])
  const [mapsProgress, setMapsProgress] = useState({ total: 0, processed: 0 })
  const [activeJobId, setActiveJobId] = useState(null)
  const [filtrosMaps, setFiltrosMaps] = useState({ keyword: '', location: '', minReviews: '0', minRating: '0' })
  const [storedGmnLeads, setStoredGmnLeads] = useState([])
  
  // States for Mass Qualification (Receita)
  const [isQualifying, setIsQualifying] = useState(false)
  const [qualifyJobId, setQualifyJobId] = useState(null)
  const [qualifyProgress, setQualifyProgress] = useState({ total: 0, processed: 0 })
  const [isSavingAll, setIsSavingAll] = useState(false)

  // States for LinkedIn Upload
  const [linkedinFile, setLinkedinFile] = useState(null)
  const [isUploadingLinkedin, setIsUploadingLinkedin] = useState(false)
  const [linkedinResults, setLinkedinResults] = useState([])



  // CRM — dados em tempo real do Convex
  const convexLeads = useQuery(api.leads.getAll) ?? []
  const addLeadMutation = useMutation(api.leads.add)
  const updateStatusMutation = useMutation(api.leads.updateStatus)
  const removeLeadMutation = useMutation(api.leads.remove)

  // Estado local apenas para leads de demo (fallback quando Convex estiver vazio)
  const [crmColumns, setCrmColumns] = useState([
    { id: 'new', title: 'Novos Leads', color: 'border-slate-500' },
    { id: 'contacted', title: 'Em Contato', color: 'border-blue-500' },
    { id: 'negotiating', title: 'Negociando', color: 'border-yellow-500' },
    { id: 'closed', title: 'Fechados', color: 'border-green-500' }
  ])

  const [crmLeadsFallback, setCrmLeadsFallback] = useState([
    { id: '1', name: 'TECH SOLUTIONS LTDA', contact: '(11) 98765-4321', loc: 'São Paulo - SP', origin: 'Receita', status: 'new', instagram: '@techsolutions', site: 'techsolutions.com.br', email: 'contato@tech.com' },
    { id: '2', name: 'PADARIA SILVA', contact: '(11) 91111-2222', loc: 'São Paulo - SP', origin: 'Maps', status: 'contacted', instagram: '@padariasilva', site: '', email: '' },
  ])

  // Unificando: Se tivermos dados no Convex, usamos eles. Caso contrário, usamos o fallback.
  const displayLeads = convexLeads.length > 0 ? convexLeads : crmLeadsFallback;

  const [draggedLeadId, setDraggedLeadId] = useState(null)
  const [editingLead, setEditingLead] = useState(null)
  const [editingColumnId, setEditingColumnId] = useState(null)
  const [activeMenuColumn, setActiveMenuColumn] = useState(null)
  const [activeMenuLead, setActiveMenuLead] = useState(null)
  const [isBackendOnline, setIsBackendOnline] = useState(false)

  // Check Backend Status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${apiKeys.backend}/api/receita/scan`, { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ ping: true }) 
        });
        setIsBackendOnline(res.status !== 404);
      } catch (e) {
        setIsBackendOnline(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuColumn(null);
      setActiveMenuLead(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Handlers
  const handleStartReceitaScan = async () => {
    setIsScanningReceita(true)
    setReceitaProgress(0)
    setReceitaResults([])
    
    // Inicia uma barra de progresso visual rápida (falsa, só pra UX)
    let progress = 0
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.floor(Math.random() * 10)
        setReceitaProgress(progress)
      }
    }, 500)

    try {
      const response = await fetch(`${apiKeys.backend}/api/receita/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...filtrosReceita,
          apiKey: apiKeys.gemini
        })
      });
      
      const data = await response.json();
      
      clearInterval(progressInterval);
      setReceitaProgress(100);
      
      if (response.ok) {
        setReceitaResults(data.leads || []);
      } else {
        alert(`Erro na extração: ${data.error}`);
        if (data.requiresDownload) {
          alert('Execute o script de download da Receita na pasta scripts primeiro.');
        }
      }
    } catch (error) {
      clearInterval(progressInterval);
      setReceitaProgress(0);
      alert('Falha ao conectar no Motor de Extração. Verifique se o Backend (npm run server) está rodando na porta 3006.');
    } finally {
      setIsScanningReceita(false)
    }
  }

  const fetchGmnLeads = async () => {
    try {
      const res = await fetch(`${apiKeys.backend}/api/hunter/gmn_leads`);
      const data = await res.json();
      setStoredGmnLeads(data.leads || []);
    } catch (e) { console.error('Erro ao buscar leads GMN', e); }
  }

  useEffect(() => {
    fetchGmnLeads();
  }, []);

  // Polling automático para sincronizar leads do Maps em tempo real
  useEffect(() => {
    let interval;
    if (activeTab === 'maps') {
      interval = setInterval(() => {
        fetchGmnLeads();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleStartMapsScan = async (mode = 'robot') => {
    if (!filtrosMaps.keyword) return alert("Digite um termo de busca!");
    
    setIsScanningMaps(true);
    setMapsResults([]);
    setMapsLogs([{ type: 'info', text: `[🚀] Iniciando motor ${mode === 'robot' ? 'PUPPETEER' : 'API GOOGLE'}...` }]);
    setMapsProgress({ total: 0, processed: 0 });

    try {
      const endpoint = mode === 'robot' ? '/api/hunter/gmn' : '/api/hunter/gmn_api';
      const response = await fetch(`${apiKeys.backend}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...filtrosMaps,
          apiKey: mode === 'robot' ? apiKeys.gemini : apiKeys.maps
        })
      });
      const data = await response.json();
      if (data.job_id) {
        setActiveJobId(data.job_id);
      }
    } catch (error) {
      setMapsLogs(prev => [...prev, { type: 'error', text: `[❌] Falha crítica: ${error.message}` }]);
      setIsScanningMaps(false);
    }
  }

  // Polling para Status do GMN
  useEffect(() => {
    let interval;
    if (isScanningMaps && activeJobId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${apiKeys.backend}/api/hunter/status/${activeJobId}`);
          const data = await res.json();
          
          if (data.logs) setMapsLogs(data.logs);
          setMapsProgress({ total: data.total || 0, processed: data.processed || 0 });
          
          if (data.status === 'idle' || data.status === 'error') {
            setIsScanningMaps(false);
            setActiveJobId(null);
            setMapsResults(data.results || []);
            fetchGmnLeads();
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Erro polling", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isScanningMaps, activeJobId]);

  const clearGmnLeads = async () => {
    if (!confirm("Limpar toda a base extraída?")) return;
    await fetch(`${apiKeys.backend}/api/hunter/gmn_leads`, { method: 'DELETE' });
    fetchGmnLeads();
  }

  const handleLinkedinUpload = async () => {
    if (!linkedinFile) {
      alert("Por favor, selecione uma planilha do LinkedIn (Excel) primeiro.");
      return;
    }

    setIsUploadingLinkedin(true);
    setLinkedinResults([]);

    const formData = new FormData();
    formData.append('file', linkedinFile);

    try {
      const response = await fetch(`${BACKEND_URL}/api/linkedin/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setLinkedinResults(data.leads || []);
        alert(`Processamento concluído. ${data.leads.length} leads qualificados de ${data.totalScanned} analisados.`);
      } else {
        alert(`Erro ao processar: ${data.error}`);
      }
    } catch (error) {
      alert('Falha de conexão com o servidor. Verifique se o backend está rodando.');
    } finally {
      setIsUploadingLinkedin(false);
    }
  }

  const moveToCRM = async (lead, origin = 'Receita') => {
    try {
      const nicheLabel = filtrosReceita.niche ? `[${filtrosReceita.niche}]` : '';
      
      const leadName = lead.name || lead["Nome Empresa"] || "LEAD SEM NOME";
      const leadContact = lead.contact || lead["Telefone 1"] || lead["Telefone 2"] || "";
      const leadLoc = lead.loc || lead["Endereço"] || "";
      const leadDono = lead.dono || lead["Dono"] || lead["Sócio"] || "Não identificado";

      await addLeadMutation({
        name: leadName,
        contact: leadContact,
        email: lead.email || lead["E-mail"] || '',
        phones: lead.phones || [],
        loc: leadLoc,
        origin: origin,
        site: lead.site || lead["Site"] || '',
        instagram: lead.instagram || lead["Instagram"] || '',
        dono: leadDono,
        cnpj: lead.cnpj || '',
        notes: `${nicheLabel} | Origin: ${origin}`.trim(),
      })
      
      // Marcar como movido localmente
      setReceitaResults(prev => prev.map(l => 
        l.cnpj === lead.cnpj ? { ...l, status: 'moved' } : l
      ));
      
      alert(`✅ Lead "${lead.name}" salvo no CRM com sucesso!`)
    } catch (err) {
      console.error('Erro ao salvar no CRM:', err);
      alert('Erro ao salvar lead no CRM. Verifique sua conexão.')
    }
  }

  const saveAllToCRM = async () => {
    try {
      const leadsToSave = receitaResults.filter(l => l.status !== 'moved');
      if (leadsToSave.length === 0) return alert('Nenhum lead novo para salvar.');
      
      if (!window.confirm(`Deseja mover ${leadsToSave.length} leads para o CRM agora?`)) return;

      setIsSavingAll(true);
      for (const lead of leadsToSave) {
        await addLeadMutation({
          name: lead.name,
          contact: lead.contact || '',
          email: lead.email || '',
          phones: lead.phones || [],
          loc: lead.loc || '',
          origin: 'Receita',
          site: lead.site || '',
          instagram: lead.instagram || '',
          dono: lead.dono || 'Não identificado',
          cnpj: lead.cnpj || '',
        });
      }

      setReceitaResults(prev => prev.map(l => ({ ...l, status: 'moved' })));
      alert('✅ Todos os leads foram movidos com sucesso!');
    } catch (error) {
      console.error('Erro ao mover todos:', error);
      alert('Erro ao salvar alguns leads no CRM.');
    } finally {
      setIsSavingAll(false);
    }
  }

  const handleQualify = async (leadsToQualify, isMass = false) => {
    if (leadsToQualify.length === 0) return;
    
    setIsQualifying(true);
    try {
      const response = await fetch(`${apiKeys.backend}/api/receita/qualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leads: leadsToQualify,
          apiKey: apiKeys.gemini // Enviando a chave do usuário
        })
      });
      
      const data = await response.json();
      if (data.job_id) {
        setQualifyJobId(data.job_id);
      }
    } catch (error) {
      console.error('Erro ao iniciar qualificação:', error);
      setIsQualifying(false);
    }
  }

  // Polling para Qualificação da Receita
  useEffect(() => {
    let interval;
    if (isQualifying && qualifyJobId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${apiKeys.backend}/api/hunter/status/${qualifyJobId}`);
          const data = await res.json();
          
          setQualifyProgress({ total: data.total || 0, processed: data.processed || 0 });

          if (data.status === 'idle' || data.status === 'error') {
            setIsQualifying(false);
            setQualifyJobId(null);
            
            // Atualizar os resultados da receita com os dados qualificados
            setReceitaResults(prev => prev.map(lead => {
              const qualified = data.results.find(r => r.cnpj === lead.cnpj || r.id === lead.id);
              return qualified ? { ...qualified, status: 'new' } : lead;
            }));
            
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Erro polling qualificação", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isQualifying, qualifyJobId]);

  const updateLeadStatus = async (id, newStatus) => {
    try {
      await updateStatusMutation({ id, status: newStatus })
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  const handleRemoveColumn = (id) => {
    if (window.confirm('Deseja realmente remover esta etapa?')) {
      setCrmColumns(prev => prev.filter(col => col.id !== id));
      setActiveMenuColumn(null);
    }
  };

  const handleRemoveLead = async (id) => {
    if (window.confirm('Deseja remover este lead do CRM?')) {
      try {
        await removeLeadMutation({ id })
      } catch (err) {
        console.error('Erro ao remover lead:', err)
      }
      setActiveMenuLead(null);
    }
  };

  const handleAddLeadToColumn = async (columnId) => {
    try {
      await addLeadMutation({
        name: 'NOVO LEAD MANUAL',
        contact: '(00) 00000-0000',
        origin: 'Manual',
        status: columnId,
      })
    } catch (err) {
      console.error('Erro ao adicionar lead:', err)
    }
    setActiveMenuColumn(null);
  };

  const handleAddColumn = () => {
    const newId = `col_${Date.now()}`
    setCrmColumns(prev => [...prev, { id: newId, title: 'Nova Etapa', color: 'border-slate-400' }])
  }

  const handleUpdateColumnTitle = (id, newTitle) => {
    if (!newTitle.trim()) return
    setCrmColumns(crmColumns.map(col => col.id === id ? { ...col, title: newTitle } : col))
  }

  // Drag and Drop
  const handleDragStart = (e, id) => {
    setDraggedLeadId(id)
    setTimeout(() => {
      e.target.classList.add('opacity-50')
    }, 0)
  }

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50')
    setDraggedLeadId(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault() // Impede o comportamento padrão para permitir o drop
  }

  const handleDrop = (e, columnId) => {
    e.preventDefault()
    if (draggedLeadId) {
      updateLeadStatus(draggedLeadId, columnId)
    }
  }

  const handleSaveLead = (updatedLead) => {
    // Se o lead tiver um ID numérico (Diferente de ID do Convex), atualizamos o fallback
    if (typeof updatedLead.id === 'number' || !updatedLead.id.startsWith('k_')) {
      setCrmLeadsFallback(prev => prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead))
    }
    setEditingLead(null)
  }

  return (
    <div className="flex h-screen bg-capta-bg font-inter text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-capta-surface-lowest border-r border-capta-surface-high flex flex-col z-10">
        <div className="p-8 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-capta-primary flex items-center justify-center">
              <span className="text-capta-bg font-bold">C</span>
            </div>
            <span className="font-space text-xl tracking-tighter">CAPTA<span className="text-capta-primary">NC</span></span>
          </div>
          <div className="text-[10px] text-slate-500 font-space tracking-widest uppercase">Lead Intelligence Unit</div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Building2} label="Extrator Receita" active={activeTab === 'receita'} onClick={() => setActiveTab('receita')} />
          <SidebarItem icon={MapPin} label="Extração Maps" active={activeTab === 'maps'} onClick={() => setActiveTab('maps')} />
          <SidebarItem icon={Users} label="Gestão CRM" active={activeTab === 'crm'} onClick={() => setActiveTab('crm')} />
          <SidebarItem icon={Send} label="Disparo Whats" active={activeTab === 'whatsapp'} onClick={() => setActiveTab('whatsapp')} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-capta-surface-high opacity-20">
          <div className="text-[8px] font-mono text-center uppercase tracking-widest text-slate-600">Capta v4.0.1 Stable</div>
        </div>
      </aside>

      {/* Main Content */}
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
              {/* Hero Section */}
              <div className="relative overflow-hidden bg-gradient-to-br from-capta-primary/10 via-transparent to-transparent border border-white/5 p-10 group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-capta-primary/5 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-capta-primary/10 border border-capta-primary/20 rounded-full">
                      <Zap size={12} className="text-capta-primary animate-pulse" />
                      <span className="text-[9px] font-space text-capta-primary uppercase tracking-[0.2em] font-bold">Quantum Intelligence Active</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-space font-bold uppercase tracking-tighter leading-none">
                      Bem-vindo ao <span className="text-capta-primary">Capta Command</span>
                    </h2>
                    <p className="text-slate-400 font-inter text-sm leading-relaxed max-w-xl">
                      Sua central de inteligência para prospecção de alta performance. 
                      Utilize nossos motores de extração para minerar dados da Receita Federal 
                      e Google Maps com filtros neurais avançados.
                    </p>
                    <div className="flex gap-4 pt-4">
                      <Button 
                        onClick={() => setActiveTab('receita')}
                        className="bg-capta-primary text-capta-bg font-space font-bold uppercase tracking-widest text-[10px] h-11 px-6 hover:shadow-[0_0_20px_rgba(47,217,244,0.4)]"
                      >
                        Iniciar Mineração
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setActiveTab('crm')}
                        className="border-white/10 text-white font-space uppercase tracking-widest text-[10px] h-11 px-6 hover:bg-white/5"
                      >
                        Ver Pipeline
                      </Button>
                    </div>
                  </div>
                  <div className="hidden lg:block relative">
                    <div className="w-48 h-48 border-2 border-capta-primary/20 rounded-full flex items-center justify-center animate-[spin_20s_linear_infinite]">
                      <div className="w-40 h-40 border border-capta-primary/10 rounded-full border-dashed"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Database size={40} className="text-capta-primary animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Leads no CRM', value: displayLeads.length, change: '+12%', icon: BarChart, trend: 'up' },
                  { label: 'Mineração Ativa', value: isScanningReceita || isScanningMaps ? 'ON' : 'IDLE', change: 'LIVE', icon: Activity, trend: 'neutral' },
                  { label: 'Nicho Estratégico', value: displayLeads.filter(l => l.notes?.includes('SAUDE') || l.name?.includes('CLINICA')).length, change: 'PRIORITY', icon: Crosshair, trend: 'up' },
                  { label: 'Base Validada', value: displayLeads.filter(l => l.cnpj).length, change: 'Verified', icon: Database, trend: 'up' },
                ].map((stat, i) => {
                  const StatIcon = stat.icon;
                  return (
                    <Card key={i} className="bg-capta-surface-low/30 border-white/5 backdrop-blur-md hover:border-capta-primary/50 transition-all duration-300 group overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
                        <StatIcon size={80} />
                      </div>
                      <CardHeader className="p-6 pb-2">
                        <div className="flex justify-between items-center mb-2">
                           <div className="p-2 bg-capta-primary/10 rounded-lg">
                             <StatIcon size={18} className="text-capta-primary" />
                           </div>
                           <span className={`text-[9px] font-space px-2 py-1 rounded-full ${
                             stat.trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-capta-primary/10 text-capta-primary'
                           }`}>
                             {stat.change}
                           </span>
                        </div>
                        <CardTitle className="text-3xl font-space font-bold tracking-tighter text-white">
                          {stat.value}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-space uppercase tracking-[0.2em] text-slate-500 mt-1">
                          {stat.label}
                        </CardDescription>
                      </CardHeader>
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
                    <div className="px-3 py-1 bg-capta-surface-lowest border border-white/5 rounded text-[9px] font-space text-slate-500 tracking-widest uppercase">
                      Local Node Instance: Active
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
                        className="w-full h-11 bg-capta-surface-lowest border border-white/5 px-4 text-sm font-space text-white focus:border-capta-primary focus:ring-1 focus:ring-capta-primary/20 outline-none transition-all"
                      >
                        <option value="SP">São Paulo (SP)</option>
                        <option value="RJ">Rio de Janeiro (RJ)</option>
                        <option value="MG">Minas Gerais (MG)</option>
                        <option value="PR">Paraná (PR)</option>
                        <option value="SC">Santa Catarina (SC)</option>
                        <option value="RS">Rio Grande do Sul (RS)</option>
                        <option value="BA">Bahia (BA)</option>
                        {/* Outros estados omitidos para brevidade, mantendo lógica anterior */}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest ml-1">Cidade Alvo</label>
                      <Input 
                        value={filtrosReceita.cidade}
                        onChange={(e) => setFiltrosReceita({...filtrosReceita, cidade: e.target.value})}
                        placeholder="Ex: Rio de Janeiro"
                        className="h-11 bg-capta-surface-lowest border-white/5 focus:border-capta-primary/50 text-sm font-space"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest ml-1">CNAE Específico</label>
                      <Input 
                        value={filtrosReceita.cnae}
                        onChange={(e) => setFiltrosReceita({...filtrosReceita, cnae: e.target.value})}
                        placeholder="Ex: 4741500"
                        className="h-11 bg-capta-surface-lowest border-white/5 focus:border-capta-primary/50 text-sm font-space"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-space text-slate-500 uppercase tracking-widest ml-1">Palavra-Chave</label>
                      <Input 
                        value={filtrosReceita.segmento}
                        onChange={(e) => setFiltrosReceita({...filtrosReceita, segmento: e.target.value})}
                        placeholder="Ex: PADARIA, CONSTRUTORA"
                        className="h-11 bg-capta-surface-lowest border-white/5 focus:border-capta-primary/50 text-sm font-space"
                      />
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
                          ? 'bg-capta-primary text-capta-bg border-capta-primary shadow-[0_0_10px_rgba(47,217,244,0.3)]' 
                          : 'border-capta-surface-high text-slate-400 hover:border-capta-primary/50'
                      }`}
                    >
                      {n.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-auto">
                    <input 
                      type="checkbox" 
                      id="excludeMei" 
                      checked={true} 
                      readOnly
                      className="accent-capta-primary"
                    />
                    <label htmlFor="excludeMei" className="text-[10px] font-space text-slate-500 uppercase">Filtrar apenas Empresas (Sem MEI)</label>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-4 items-center">
                  {isScanningReceita && (
                    <div className="flex-1 mr-6">
                      <div className="flex justify-between text-[10px] font-space mb-2 text-capta-primary tracking-widest uppercase">
                        <span>Scanning Quantum Database...</span>
                        <span>{receitaProgress}%</span>
                      </div>
                      <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-capta-primary/50 to-capta-primary shadow-[0_0_10px_#2fd9f4] transition-all duration-300" 
                          style={{ width: `${receitaProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-space uppercase tracking-widest text-[10px]"
                  >
                    Reset Filters
                  </Button>
                  
                  <Button 
                    onClick={handleStartReceitaScan}
                    disabled={isScanningReceita}
                    size="lg"
                    className={`min-w-[200px] font-space font-bold uppercase tracking-[0.2em] text-[10px] transition-all duration-500 ${
                      isScanningReceita 
                        ? 'bg-slate-800 text-slate-500' 
                        : 'bg-capta-primary text-capta-bg hover:shadow-[0_0_25px_rgba(47,217,244,0.4)] hover:scale-[1.02]'
                    }`}
                  >
                    {isScanningReceita ? (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                        Infiltrating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Zap size={16} fill="currentColor" />
                        Execute Extraction
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

              {/* Tabela Receita */}
              {!isScanningReceita && receitaResults.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center bg-capta-surface-low border border-capta-surface-high p-4">
                    <div className="text-xs font-space uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 bg-capta-primary"></div>
                      Intelligence Results: {receitaResults.length} Leads
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleQualify(receitaResults.filter(l => l.site && l.status !== 'moved'), true)}
                        disabled={isQualifying}
                        className="bg-capta-primary hover:bg-capta-primary/80 text-capta-bg font-space uppercase tracking-widest text-[10px] gap-2 px-6 h-9"
                      >
                        <Zap size={14} />
                        {isQualifying ? 'Qualificando...' : 'Qualificar Leads'}
                      </Button>
                      <Button 
                        onClick={saveAllToCRM}
                        disabled={isSavingAll}
                        className="bg-green-500 hover:bg-green-600 text-white font-space uppercase tracking-widest text-[10px] gap-2 px-6 h-9"
                      >
                        <Zap size={14} className={isSavingAll ? 'animate-spin' : ''} />
                        {isSavingAll ? 'Movendo...' : 'Mover Todos para CRM'}
                      </Button>
                    </div>
                  </div>

                  {/* Barra de Progresso de Qualificação */}
                  {isQualifying && (
                    <div className="bg-capta-surface-low border border-capta-primary/20 p-4 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Activity size={14} className="text-capta-primary animate-pulse" />
                          <span className="text-[10px] font-space uppercase tracking-widest text-capta-primary font-bold">
                            Inteligência Robótica em Ação
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {qualifyProgress.processed} / {qualifyProgress.total} Leads ({Math.round((qualifyProgress.processed / qualifyProgress.total) * 100) || 0}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-capta-primary shadow-[0_0_10px_rgba(47,217,244,0.5)] transition-all duration-500 ease-out" 
                          style={{ width: `${(qualifyProgress.processed / qualifyProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {receitaResults.map((lead, i) => (
                      <Card key={i} className="bg-capta-surface-lowest/40 border-white/5 hover:border-capta-primary/30 transition-all group rounded-none backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                          <Building2 size={40} className="text-capta-primary" />
                        </div>
                        
                        <CardContent className="p-5 flex flex-col gap-4">
                          <div className="space-y-2">
                            <h4 className="font-space font-bold text-white uppercase tracking-tight text-sm leading-tight group-hover:text-capta-primary transition-colors">{lead.name}</h4>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-[8px] font-space px-2 py-0.5 bg-white/5 text-slate-400 border border-white/5 uppercase tracking-widest">
                                CNPJ: {lead.cnpj}
                              </span>
                              <span className="text-[8px] font-space px-2 py-0.5 bg-capta-primary/5 text-capta-primary border border-capta-primary/10 tracking-widest uppercase">
                                {lead.natureza_juridica === '2062' ? 'LTDA' : 'SOCIEDADE'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3 py-3 border-y border-white/5">
                            <div className="flex items-center gap-3 text-[10px] font-space text-slate-400">
                              <Users size={14} className="text-capta-primary/50" />
                              <span className="italic">Responsável: <span className="text-slate-200">{lead.dono || 'Não identificado'}</span></span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-space text-slate-400">
                              <Mail size={14} className="text-capta-primary/50" />
                              <span className="truncate">{lead.contact}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 min-h-[24px]">
                            {lead.site && (
                              <a href={lead.site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[9px] font-space text-blue-400 bg-blue-400/5 px-2 py-1 border border-blue-400/10 hover:bg-blue-400/10 transition-all uppercase tracking-widest">
                                <Globe size={10} /> Website
                              </a>
                            )}
                            {lead.instagram && (
                              <span className="flex items-center gap-2 text-[9px] font-space text-pink-400 bg-pink-400/5 px-2 py-1 border border-pink-400/10 uppercase tracking-widest">
                                <Instagram size={10} /> {lead.instagram}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <Button 
                              onClick={() => handleQualify([lead])}
                              disabled={isQualifying || !lead.site}
                              className="h-9 bg-capta-primary/10 hover:bg-capta-primary/20 text-capta-primary border border-capta-primary/20 text-[9px] font-space uppercase tracking-widest flex-1 rounded-none transition-all"
                            >
                              {isQualifying && qualifyJobId ? (
                                <div className="flex items-center gap-2 justify-center">
                                  <div className="w-2 h-2 border border-capta-primary border-t-transparent animate-spin rounded-full" />
                                  ...
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 justify-center">
                                  <Search size={12} /> Qualificar
                                </div>
                              )}
                            </Button>
                            
                            {lead.status === 'moved' ? (
                              <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-space uppercase tracking-widest h-9">
                                <CheckCircle size={12} />
                                No CRM
                              </div>
                            ) : (
                              <Button 
                                size="sm"
                                onClick={() => moveToCRM(lead)}
                                className="bg-capta-primary text-capta-bg font-space font-bold uppercase tracking-widest text-[10px] transition-all rounded-none h-9 px-6 border border-capta-primary/30 flex-1"
                              >
                                Salvar no CRM
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

          {/* EXTRAÇÃO MAPS - GMN HÍBRIDO PRO */}
          {activeTab === 'maps' && (
            <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-180px)] flex flex-col">
              
              {/* Top Controls Bar */}
              <div className="flex items-center justify-between bg-capta-surface-low border border-white/5 p-4 backdrop-blur-md">
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-capta-primary animate-pulse"></div>
                     <span className="text-[10px] font-space uppercase tracking-widest text-capta-primary font-bold">GMN Hybrid Engine v4.0</span>
                   </div>
                   <div className="h-4 w-[1px] bg-white/10"></div>
                   <div className="flex items-center gap-4">
                     <span className="text-[10px] font-space text-slate-500 uppercase tracking-widest">Target Area:</span>
                     <Input 
                       value={filtrosMaps.location}
                       onChange={(e) => setFiltrosMaps({...filtrosMaps, location: e.target.value})}
                       placeholder="Ex: Rio de Janeiro, RJ"
                       className="h-8 w-48 bg-black/20 border-white/5 text-[10px] font-space"
                     />
                   </div>
                   <div className="flex items-center gap-4">
                     <span className="text-[10px] font-space text-slate-500 uppercase tracking-widest">Niche:</span>
                     <Input 
                       value={filtrosMaps.keyword}
                       onChange={(e) => setFiltrosMaps({...filtrosMaps, keyword: e.target.value})}
                       placeholder="Ex: Construtoras"
                       className="h-8 w-48 bg-black/20 border-white/5 text-[10px] font-space"
                     />
                   </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={clearGmnLeads}
                    variant="ghost" 
                    className="text-red-400 hover:bg-red-400/10 text-[9px] font-space uppercase tracking-widest h-9"
                  >
                    <Trash2 size={14} className="mr-2" /> Limpar Base
                  </Button>
                  
                  {/* Bookmarklet Injetor */}
                  <a 
                    href={`javascript:(function(){const leads=[];const items=document.querySelectorAll('div[role="article"]');items.forEach(el=>{const name=el.querySelector('div.fontHeadlineSmall')?.innerText;const link=el.querySelector('a')?.href;if(name&&link){const text=el.innerText||"";const phone=text.match(/\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}/)?.[0]||"";const rating=text.match(/(\\d\\.\\d)\\s\\(\\d+\\)/)?.[1]||"";const site=el.querySelector('a[aria-label*="website"], a[aria-label*="site"]')?.href||"";leads.push({name,link,phone,rating,site,address:text.split('\\n').find(l=>l.includes(',')&&/\\d/.test(l))||""});}});if(leads.length===0)return alert('Nenhum lead detectado. Certifique-se de rolar a lista lateral no Google Maps!');fetch('${BACKEND_URL}/api/gmn/inject',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({leads})}).then(r=>r.json()).then(d=>alert('🚀 '+d.message)).catch(e=>alert('❌ Erro: '+e.message));})();`}
                    className="flex items-center gap-2 bg-capta-primary text-capta-bg px-6 py-2 rounded-none text-[10px] font-space font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(47,217,244,0.5)] transition-all cursor-move active:scale-95"
                    title="Arraste para sua barra de favoritos"
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", e.target.href);
                    }}
                  >
                    <Zap size={14} fill="currentColor" /> INJETOR GMN (Arraste p/ Favoritos)
                  </a>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                
                {/* Google Maps Iframe Area */}
                <div className="lg:col-span-8 bg-black/40 border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 flex flex-col">
                    <div className="p-2 bg-capta-surface-low/80 backdrop-blur-md border-b border-white/5 z-10 flex justify-between items-center">
                      <span className="text-[8px] font-mono text-slate-500 uppercase flex items-center gap-2">
                        <Globe size={10} className="animate-spin-slow" /> maps.google.com integrated_terminal
                      </span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                      </div>
                    </div>
                    <iframe 
                      src={`https://www.google.com/maps?q=${encodeURIComponent(filtrosMaps.keyword + ' em ' + filtrosMaps.location)}&output=embed&authuser=0&hl=pt-BR`}
                      className="flex-1 w-full border-none grayscale-[0.3] invert-[0.05] contrast-[1.1]"
                      title="Google Maps Mining Area"
                    />
                    
                    {/* Botão de Emergência para Abrir em Nova Aba */}
                    <div className="absolute top-14 right-4 z-30">
                      <Button 
                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(filtrosMaps.keyword + ' em ' + filtrosMaps.location)}`, '_blank')}
                        className="bg-black/60 hover:bg-black/90 text-white border border-white/10 text-[8px] font-space uppercase h-8 px-3 backdrop-blur-md"
                      >
                        <ExternalLink size={10} className="mr-2" /> Abrir Maps (Nova Aba)
                      </Button>
                    </div>
                  </div>
                  
                  {/* Tutorial Overlay (Auto-hide) */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-capta-bg/90 border border-capta-primary/30 backdrop-blur-xl z-20 translate-y-0 group-hover:translate-y-full transition-transform duration-500">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-capta-primary/20 rounded-full">
                        <Activity size={24} className="text-capta-primary" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-space font-bold uppercase tracking-widest">Como Minerar com o Injetor:</h4>
                        <p className="text-[10px] text-slate-400 font-inter">
                          1. Arraste o botão azul acima para sua <b>Barra de Favoritos</b>.<br/>
                          2. Pesquise e <b>role a lista lateral</b> do Google Maps até o fim.<br/>
                          3. Clique no favorito <b>"INJETOR GMN"</b> para enviar os dados para a IA.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Results Panel */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                  
                  {/* Dashboard Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-capta-surface-low border-white/5 p-4 rounded-none">
                       <div className="text-[9px] font-space text-slate-500 uppercase tracking-widest mb-1">Fila Global</div>
                       <div className="text-2xl font-space font-bold text-capta-primary">{storedGmnLeads.length}</div>
                    </Card>
                    <Card className="bg-capta-surface-low border-white/5 p-4 rounded-none">
                       <div className="text-[9px] font-space text-slate-500 uppercase tracking-widest mb-1">Processando</div>
                       <div className="text-2xl font-space font-bold text-white flex items-center gap-2">
                         {isScanningMaps ? <Activity size={20} className="text-capta-primary animate-pulse" /> : '0'}
                       </div>
                    </Card>
                  </div>

                  {/* Terminal de Logs Compacto */}
                  <div className="bg-black/60 border border-white/5 h-[200px] flex flex-col overflow-hidden font-mono text-[9px]">
                    <div className="p-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
                       <span className="text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Terminal_Output
                       </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
                       {mapsLogs.length === 0 ? (
                         <div className="text-slate-700 italic">Pronto para receber injeção de dados...</div>
                       ) : (
                         mapsLogs.map((log, i) => (
                           <div key={i} className={`flex gap-2 ${
                             log.type === 'error' ? 'text-red-400' : 
                             log.type === 'success' ? 'text-green-400' : 
                             'text-slate-400'
                           }`}>
                             <span className="opacity-20">{new Date().toLocaleTimeString()}</span>
                             <span className="truncate">{log.text}</span>
                           </div>
                         ))
                       )}
                       <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                    </div>
                  </div>

                  {/* Tabela de Resultados Rápidos */}
                  <div className="flex-1 bg-capta-surface-low/40 border border-white/5 overflow-hidden flex flex-col">
                    <div className="p-3 bg-white/5 border-b border-white/5 text-[9px] font-space uppercase tracking-widest text-slate-400 flex justify-between">
                      <span>Últimos Capturados</span>
                      <span className="text-capta-primary">Live Sync</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                       {storedGmnLeads.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center opacity-20 gap-2 grayscale">
                            <Database size={32} />
                            <span className="text-[8px] font-space uppercase">Sem dados</span>
                         </div>
                       ) : (
                         <table className="w-full text-left border-collapse">
                            <tbody className="divide-y divide-white/5 font-space text-[10px]">
                               {storedGmnLeads.slice(0, 50).map((lead, i) => (
                                 <tr key={i} className="hover:bg-capta-primary/5 transition-colors group">
                                   <td className="p-3">
                                     <div className="font-bold text-white uppercase truncate w-48 group-hover:text-capta-primary transition-colors">{lead["Nome Empresa"]}</div>
                                     <div className="text-[8px] text-slate-500 truncate w-48 italic">{lead["Site"] || 'Sem site'}</div>
                                   </td>
                                   <td className="p-3 text-right">
                                      <Button 
                                        onClick={() => moveToCRM(lead, 'Maps')}
                                        className="h-7 w-7 p-0 bg-capta-primary/10 text-capta-primary border border-capta-primary/20 hover:bg-capta-primary hover:text-capta-bg transition-all"
                                      >
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
            )}

          {/* LINKEDIN REMOVED */}

          {/* GESTÃO CRM (Kanban Estilo Kommo) */}
          {activeTab === 'crm' && (
            <div className="h-full flex flex-col animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="text-xl font-space uppercase tracking-[0.2em] flex items-center gap-2">
                  <Users className="text-capta-primary" /> CRM Pipeline
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={handleAddColumn} className="flex items-center gap-2 bg-capta-surface-low border border-capta-surface-high px-4 py-2 text-xs font-space text-slate-300 hover:text-white hover:border-capta-primary transition-colors cursor-pointer">
                    <Plus size={14} /> Adicionar Etapa
                  </button>
                  <div className="text-xs font-space text-slate-400 border border-capta-surface-high bg-capta-surface-low px-4 py-2">
                    Total Leads: <span className="text-capta-primary font-bold">{displayLeads.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
                {crmColumns.map(col => (
                  <div 
                    key={col.id} 
                    className="flex-none w-[320px] flex flex-col bg-capta-surface-low border border-capta-surface-high rounded-sm kanban-column max-h-full"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                    <div className={`p-4 border-t-2 ${col.color} bg-capta-surface-lowest/50 flex justify-between items-center group`}>
                      {editingColumnId === col.id ? (
                        <input 
                          type="text"
                          autoFocus
                          defaultValue={col.title}
                          onBlur={(e) => {
                            handleUpdateColumnTitle(col.id, e.target.value)
                            setEditingColumnId(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateColumnTitle(col.id, e.target.value)
                              setEditingColumnId(null)
                            }
                          }}
                          className="bg-capta-surface-highest text-sm font-space uppercase tracking-wider text-white px-2 py-1 outline-none w-2/3"
                        />
                      ) : (
                        <span 
                          onClick={() => setEditingColumnId(col.id)}
                          className="font-space text-sm uppercase tracking-wider cursor-pointer hover:text-capta-primary transition-colors flex-1"
                        >
                          {col.title} <Edit size={10} className="inline opacity-0 group-hover:opacity-100 ml-1" />
                        </span>
                      )}
                      
                      <span className="text-xs font-mono bg-capta-surface-high px-2 py-0.5 text-slate-300 mr-8">
                        {displayLeads.filter(l => l.status === col.id).length}
                      </span>

                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenuColumn(activeMenuColumn === col.id ? null : col.id)}
                          className="p-1 hover:bg-capta-surface-high text-slate-400 hover:text-white transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeMenuColumn === col.id && (
                          <div className="absolute right-0 top-8 w-48 glass-menu z-50 py-2 animate-in slide-in-from-top-2 duration-200">
                            <button 
                              onClick={() => handleAddLeadToColumn(col.id)}
                              className="w-full text-left px-4 py-2 text-xs font-space uppercase hover:bg-capta-primary/10 hover:text-capta-primary flex items-center gap-2"
                            >
                              <Plus size={14} /> Adicionar Lead
                            </button>
                            <button 
                              onClick={() => setEditingColumnId(col.id)}
                              className="w-full text-left px-4 py-2 text-xs font-space uppercase hover:bg-capta-primary/10 hover:text-capta-primary flex items-center gap-2"
                            >
                              <Edit size={14} /> Renomear Etapa
                            </button>
                            <div className="h-[1px] bg-capta-surface-high my-1"></div>
                            <button 
                              onClick={() => handleRemoveColumn(col.id)}
                              className="w-full text-left px-4 py-2 text-xs font-space uppercase hover:bg-red-500/10 text-red-400 hover:text-red-300 flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Excluir Etapa
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar min-h-[100px]">
                      {displayLeads.filter(l => l.status === col.id).map(lead => (
                        <Card 
                          key={lead._id || lead.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead._id || lead.id)}
                          onDragEnd={handleDragEnd}
                          className={`kanban-card bg-capta-surface-lowest/80 border-white/5 hover:border-capta-primary/50 group relative cursor-grab active:cursor-grabbing p-4 transition-all duration-300 ${draggedLeadId === (lead._id || lead.id) ? 'opacity-40 scale-95' : 'opacity-100'}`}
                        >
                          <div className="absolute top-3 right-3 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                             <GripVertical size={14} />
                          </div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[8px] font-space font-bold uppercase tracking-[0.2em] text-capta-primary bg-capta-primary/5 px-2 py-0.5 rounded-full border border-capta-primary/10">
                              {lead.origin}
                            </span>
                          </div>
                          <CardTitle className="text-sm font-space font-bold text-white mb-2 leading-tight pr-6 group-hover:text-capta-primary transition-colors">
                            {lead.name}
                          </CardTitle>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-space">
                               <Users size={12} className="text-capta-primary/50" />
                               <span className="truncate">{lead.dono || 'Sem contato identificado'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                               <Mail size={12} className="opacity-30" />
                               <span className="truncate">{lead.contact}</span>
                            </div>
                          </div>
                          
                          {lead.site && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              <span className="flex items-center gap-1 text-[8px] font-space text-blue-400 bg-blue-400/5 px-2 py-0.5 border border-blue-400/10 rounded-full">
                                WEBSITE
                              </span>
                            </div>
                          )}
                          
                          <CardFooter className="p-0 pt-3 border-t border-white/5 flex justify-between items-center bg-transparent">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingLead(lead)}
                              className="h-7 px-2 text-[10px] font-space uppercase tracking-widest text-slate-500 hover:text-capta-primary hover:bg-capta-primary/5 gap-1.5"
                            >
                              <Edit size={12} /> View
                            </Button>
                            
                            <select 
                              className="bg-transparent text-[9px] font-space text-slate-500 uppercase focus:outline-none cursor-pointer hover:text-white transition-colors text-right outline-none"
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead._id || lead.id, e.target.value)}
                            >
                              {crmColumns.map(c => (
                                <option key={c.id} value={c.id} className="bg-capta-surface-high text-white">{c.title.split(' ')[0]}</option>
                              ))}
                            </select>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODAL EDIÇÃO DO LEAD */}
          {editingLead && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
              <div className="bg-capta-surface-lowest border border-capta-surface-high w-full max-w-lg shadow-[0_0_50px_rgba(47,217,244,0.1)]">
                <div className="p-4 border-b border-capta-surface-high flex justify-between items-center bg-capta-surface-low">
                  <div className="font-space uppercase tracking-widest text-capta-primary text-sm flex items-center gap-2">
                    <Database size={16} /> Inteligência do Lead
                  </div>
                  <button onClick={() => setEditingLead(null)} className="text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-space text-slate-400 uppercase tracking-wider mb-2">Razão Social / Nome</label>
                    <input 
                      type="text" 
                      value={editingLead.name}
                      onChange={(e) => setEditingLead({...editingLead, name: e.target.value})}
                      className="w-full bg-capta-surface-high border border-transparent focus:border-capta-primary p-3 text-sm font-space text-white outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-space text-slate-400 uppercase tracking-wider mb-2">Responsável / Sócio / Dono</label>
                    <input 
                      type="text" 
                      value={editingLead.dono || ''}
                      onChange={(e) => setEditingLead({...editingLead, dono: e.target.value})}
                      placeholder="Não identificado"
                      className="w-full bg-capta-surface-high border border-transparent focus:border-capta-primary p-3 text-sm font-space text-white outline-none placeholder-slate-600" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-space text-slate-400 uppercase tracking-wider mb-2">Contato Principal</label>
                      <input 
                        type="text" 
                        value={editingLead.contact}
                        onChange={(e) => setEditingLead({...editingLead, contact: e.target.value})}
                        className="w-full bg-capta-surface-high border border-transparent focus:border-capta-primary p-3 text-sm font-space text-white outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-space text-slate-400 uppercase tracking-wider mb-2">Email</label>
                      <input 
                        type="email" 
                        value={editingLead.email || ''}
                        onChange={(e) => setEditingLead({...editingLead, email: e.target.value})}
                        placeholder="Não informado"
                        className="w-full bg-capta-surface-high border border-transparent focus:border-capta-primary p-3 text-sm font-space text-white outline-none placeholder-slate-600" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-space text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">@ Instagram</label>
                      <input 
                        type="text" 
                        value={editingLead.instagram || ''}
                        onChange={(e) => setEditingLead({...editingLead, instagram: e.target.value})}
                        placeholder="@empresa"
                        className="w-full bg-capta-surface-high border border-transparent focus:border-capta-primary p-3 text-sm font-space text-white outline-none placeholder:text-slate-600" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-space text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">WWW Site</label>
                      <input 
                        type="text" 
                        value={editingLead.site || ''}
                        onChange={(e) => setEditingLead({...editingLead, site: e.target.value})}
                        placeholder="Ex: www.empresa.com.br"
                        className="w-full bg-capta-surface-high border border-transparent focus:border-capta-primary p-3 text-sm font-space text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-space text-slate-400 uppercase tracking-wider mb-2">Localização / Endereço</label>
                    <textarea 
                      value={editingLead.loc}
                      onChange={(e) => setEditingLead({...editingLead, loc: e.target.value})}
                      className="w-full bg-capta-surface-high border border-capta-surface-highest text-white px-3 py-2 text-sm focus:outline-none focus:border-capta-primary h-20 resize-none"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-capta-surface-high flex justify-end gap-3 bg-capta-surface-low/30">
                  <button 
                    onClick={() => {
                      const query = `${editingLead.name} ${(editingLead.loc || '').split('|')[1] || ''}`.replace(/ /g, '+');
                      window.open(`https://www.google.com/maps/search/${query}`, '_blank');
                    }}
                    className="px-4 py-2 text-[10px] font-space uppercase border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                  >
                    Abrir no Google Maps
                  </button>
                  <button 
                    onClick={() => {
                      handleSaveLead(editingLead);
                      setEditingLead(null);
                    }}
                    className="px-6 py-2 text-[10px] font-space uppercase bg-capta-primary text-black font-bold hover:bg-capta-secondary transition-all shadow-[0_0_20px_rgba(47,217,244,0.3)]"
                  >
                    Salvar Lead
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DISPARO WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 font-space space-y-4 animate-in slide-in-from-bottom-4 duration-500">
               <div className="text-4xl uppercase tracking-[0.3em]">Module: Disparo Whats</div>
               <div className="text-sm tracking-widest">Awaiting Command Initialization</div>
               <div className="w-64 h-px bg-capta-surface-high relative">
                  <div className="absolute inset-0 bg-capta-primary w-1/4 animate-ping"></div>
               </div>
            </div>
          )}

          {/* CONFIGURAÇÕES E CHAVES DE API */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-capta-primary/20 rounded-xl">
                  <Settings size={32} className="text-capta-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-space font-bold uppercase tracking-widest text-white">Configurações de Inteligência</h2>
                  <p className="text-xs text-slate-500 font-mono">Gerencie suas chaves de API e conexões de rede</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Coluna 1: Chaves de API */}
                <div className="space-y-6">
                  <Card className="bg-capta-surface-low border-white/5 overflow-hidden">
                    <CardHeader className="bg-white/5 border-b border-white/5 p-6">
                      <CardTitle className="text-sm font-space uppercase tracking-widest flex items-center gap-2">
                        <Zap size={16} className="text-yellow-500" /> Credenciais IA & Mapas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-space text-slate-400 uppercase tracking-widest">Gemini 1.5 Flash API Key</label>
                        <Input 
                          type="password"
                          value={apiKeys.gemini}
                          onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                          placeholder="AIzaSy..."
                          className="bg-capta-surface-lowest border-white/10 focus:border-capta-primary h-12 font-mono text-xs"
                        />
                        <p className="text-[9px] text-slate-600">Necessária para a qualificação automática de leads.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-space text-slate-400 uppercase tracking-widest">Google Maps API Key</label>
                        <Input 
                          type="password"
                          value={apiKeys.maps}
                          onChange={(e) => setApiKeys({...apiKeys, maps: e.target.value})}
                          placeholder="AIzaSy..."
                          className="bg-capta-surface-lowest border-white/10 focus:border-capta-primary h-12 font-mono text-xs"
                        />
                        <p className="text-[9px] text-slate-600">Usada para buscas robóticas de alta precisão.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-space text-slate-400 uppercase tracking-widest">URL do Servidor Backend</label>
                        <Input 
                          value={apiKeys.backend}
                          onChange={(e) => setApiKeys({...apiKeys, backend: e.target.value})}
                          placeholder="http://localhost:3006"
                          className="bg-capta-surface-lowest border-white/10 focus:border-capta-primary h-12 font-mono text-xs"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="bg-capta-primary/5 p-4 border-t border-white/5">
                       <div className="flex items-center gap-3 text-capta-primary">
                          <CheckCircle size={14} />
                          <span className="text-[10px] font-space uppercase">As alterações são salvas automaticamente</span>
                       </div>
                    </CardFooter>
                  </Card>
                </div>

                {/* Coluna 2: Status e Diagnóstico */}
                <div className="space-y-6">
                  <Card className="bg-capta-surface-low border-white/5">
                    <CardHeader className="bg-white/5 border-b border-white/5 p-6">
                      <CardTitle className="text-sm font-space uppercase tracking-widest">Diagnóstico de Sistema</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                       <div className="flex justify-between items-center p-3 bg-capta-surface-lowest rounded border border-white/5">
                          <span className="text-xs text-slate-400">Status do Banco (Convex)</span>
                          <span className="text-xs font-bold text-green-400">CONECTADO</span>
                       </div>
                       <div className="flex justify-between items-center p-3 bg-capta-surface-lowest rounded border border-white/5">
                          <span className="text-xs text-slate-400">Motor de Extração (Render)</span>
                          <span className={`text-xs font-bold ${isBackendOnline ? 'text-green-400' : 'text-red-400'}`}>
                            {isBackendOnline ? 'ATIVO' : 'OFFLINE'}
                          </span>
                       </div>
                       <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded">
                          <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-1">Informação de Segurança</h4>
                          <p className="text-[9px] text-blue-400/70 leading-relaxed">
                            Suas chaves são armazenadas localmente no seu navegador e nunca são enviadas para nossos servidores, exceto para processar suas requisições de mineração.
                          </p>
                       </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}



