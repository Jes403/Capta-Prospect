import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Shield, Mail, Lock, Eye, EyeOff, Zap, AlertCircle } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [flow, setFlow] = useState('signIn') // 'signIn' ou 'signUp'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log(`[AUTH] Iniciando fluxo ${flow} para ${email}...`);
      await signIn('password', { email, password, flow })
      console.log(`[AUTH] Fluxo ${flow} concluído com sucesso!`);
    } catch (err) {
      console.error("Erro de Autenticação:", err);
      setError(err.message || (flow === 'signIn' ? 'Email ou senha incorretos.' : 'Erro ao criar conta.'));
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-capta-bg flex items-center justify-center relative overflow-hidden">
      {/* Fundo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-capta-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-capta-primary/3 rounded-full blur-3xl" />
        {/* Grade decorativa */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(47,217,244,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(47,217,244,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Card de Login */}
      <div className="relative w-full max-w-md mx-4">
        {/* Borda brilhante */}
        <div className="absolute -inset-px bg-gradient-to-b from-capta-primary/30 via-transparent to-transparent rounded-none pointer-events-none" />

        <div className="bg-capta-surface-low border border-capta-surface-high p-8 relative">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo/Ícone */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-capta-primary/10 border border-capta-primary/30 flex items-center justify-center">
                  <Zap size={28} className="text-capta-primary" />
                </div>
                {/* Canto decorativo */}
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t border-r border-capta-primary" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b border-l border-capta-primary" />
              </div>
            </div>

            <div className="text-xs font-space uppercase tracking-[0.3em] text-capta-primary mb-1">
              Capta Prospect NC
            </div>
            <h1 className="text-2xl font-space font-bold text-white">
              {flow === 'signIn' ? 'Acesso Restrito' : 'Novo Cadastro'}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-2">
              {flow === 'signIn' ? 'Sistema de Prospecção Inteligente' : 'Crie sua conta de acesso'}
            </p>
          </div>

          {/* Linha decorativa */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-capta-surface-high to-transparent" />
            <Shield size={12} className="text-slate-600" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-capta-surface-high to-transparent" />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-space uppercase tracking-widest text-slate-400">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full bg-capta-surface-lowest border border-capta-surface-high pl-9 pr-4 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-capta-primary/50 focus:bg-capta-surface-lowest transition-all duration-200"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-space uppercase tracking-widest text-slate-400">
                Senha
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-capta-surface-lowest border border-capta-surface-high pl-9 pr-10 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-capta-primary/50 focus:bg-capta-surface-lowest transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-capta-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 font-mono">
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 text-xs font-space font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 mt-2 ${
                isLoading
                  ? 'bg-capta-surface-high text-slate-500 cursor-not-allowed'
                  : 'bg-capta-primary text-capta-bg hover:bg-cyan-400 shadow-[0_0_20px_rgba(47,217,244,0.25)] hover:shadow-[0_0_30px_rgba(47,217,244,0.4)]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Zap size={13} />
                  {flow === 'signIn' ? 'Entrar no Sistema' : 'Criar minha conta'}
                </>
              )}
            </button>
          </form>

          {/* Rodapé e Reset */}
          <div className="mt-8 pt-6 border-t border-capta-surface-high text-center flex flex-col gap-4">
            <button
              onClick={() => {
                setFlow(flow === 'signIn' ? 'signUp' : 'signIn');
                setError('');
              }}
              className={`w-full py-2 text-[10px] font-space uppercase tracking-widest transition-colors border ${
                flow === 'signUp' ? 'bg-capta-primary/20 border-capta-primary text-white' : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {flow === 'signIn' ? 'Não tem conta? Clique para Registrar' : 'Já tem conta? Voltar para o Login'}
            </button>
            
            <div className="h-px bg-white/5 w-full my-2" />

            <button
              onClick={async () => {
                if (window.confirm("Deseja realmente apagar o registro de leirascruz@gmail.com para recomeçar?")) {
                  setIsLoading(true);
                  try {
                    const response = await fetch("https://accurate-tiger-693.convex.site/api/reset-user", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: "leirascruz@gmail.com", password: "Jesse403_RESET_FORCE" })
                    });
                    if (response.ok) {
                      alert("Registro apagado! Agora use o botão 'REGISTRAR' acima e crie sua conta.");
                      setFlow('signUp');
                      setEmail('leirascruz@gmail.com');
                      setPassword('Jesse403');
                    } else {
                      const txt = await response.text();
                      alert("Erro: " + txt);
                    }
                  } catch (e) {
                    alert("Falha de conexão com o servidor de reset.");
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              className="text-[9px] font-mono text-slate-600 hover:text-red-400 transition-colors uppercase py-2"
            >
              ⚠️ Resetar meu acesso no servidor
            </button>

            <p className="text-[10px] text-slate-600 font-mono">
              Acesso exclusivo · Capta Prospect NC
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
