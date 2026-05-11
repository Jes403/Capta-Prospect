window.onerror = function(msg, url, line, col, error) {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '0';
  div.style.left = '0';
  div.style.width = '100%';
  div.style.height = '100%';
  div.style.backgroundColor = '#1a1a1a';
  div.style.color = '#ff4444';
  div.style.padding = '40px';
  div.style.zIndex = '999999';
  div.style.fontFamily = 'monospace';
  div.style.fontSize = '14px';
  div.style.overflow = 'auto';
  div.innerHTML = `
    <h1 style="color: white; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">🔴 Erro de Inicialização Detectado</h1>
    <div style="background: #000; padding: 20px; border-radius: 8px; border: 1px solid #444;">
      <p><strong>Mensagem:</strong> ${msg}</p>
      <p><strong>Arquivo:</strong> ${url}</p>
      <p><strong>Linha/Col:</strong> ${line}:${col}</p>
      <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
      <p><strong>Stack Trace:</strong></p>
      <pre style="white-space: pre-wrap;">${error?.stack || 'Nenhum stack trace disponível.'}</pre>
    </div>
    <p style="margin-top: 20px; color: #888;">Tente rodar 'npm install' novamente ou verifique se o servidor Convex está ativo.</p>
  `;
  document.body.appendChild(div);
  return false;
};

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import './index.css'
import App from './App.jsx'

  // Fallback direto para o seu projeto do Convex caso a Vercel falhe em ler a variável
  const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://accurate-tiger-693.convex.cloud";
  
  if (!convexUrl) {
    throw new Error("VITE_CONVEX_URL não está definida.");
  }
  
  const convex = new ConvexReactClient(convexUrl);
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Elemento #root não encontrado no index.html");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ConvexAuthProvider client={convex}>
        <App />
      </ConvexAuthProvider>
    </StrictMode>,
  )
} catch (e) {
  window.onerror(e.message, 'main.jsx', 0, 0, e);
}
