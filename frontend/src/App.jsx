import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppStateProvider } from "@/lib/AppState";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Home from "@/pages/Home";
import Empresas from "@/pages/Empresas";
import EmpresaDetalhe from "@/pages/EmpresaDetalhe";
import ChatNR from "@/pages/ChatNR";
import Documentos from "@/pages/Documentos";
import EspacoZela from "@/pages/EspacoZela";
import Normas from "@/pages/Normas";
import TextosTecnicos from "@/pages/TextosTecnicos";
import AssistenteIA from "@/pages/AssistenteIA";
import Indicadores from "@/pages/Indicadores";
import Acidentes from "@/pages/Acidentes";
import Autos from "@/pages/Autos";
import Treinamentos from "@/pages/Treinamentos";
import Planos from "@/pages/Planos";
import Programas from "@/pages/Programas";
import Atestados from "@/pages/Atestados";
import ImprimirRelatorioSaude from "@/pages/ImprimirRelatorioSaude";
import ImprimirSimulacaoFap from "@/pages/ImprimirSimulacaoFap";
import ImprimirPrograma from "@/pages/ImprimirPrograma";
import TrabalhadorDetalhe from "@/pages/TrabalhadorDetalhe";
import Manual from "@/pages/Manual";
import Recusas from "@/pages/Recusas";
import Esocial from "@/pages/Esocial";
import Terceiros from "@/pages/Terceiros";
import Funcionarios from "@/pages/Funcionarios";
import Epi from "@/pages/Epi";
import FichaEpi from "@/pages/FichaEpi";
import Cipa from "@/pages/Cipa";
import Inspecoes from "@/pages/Inspecoes";
import ImprimirInspecao from "@/pages/ImprimirInspecao";
import Vencimentos from "@/pages/Vencimentos";
import Consumo from "@/pages/Consumo";
import Clinica from "@/pages/Clinica";
import Organizacao from "@/pages/Organizacao";
import Psicossocial from "@/pages/Psicossocial";
import Importacao from "@/pages/Importacao";
import PainelNegocio from "@/pages/PainelNegocio";
import Dossie from "@/pages/Dossie";
import ImprimirPpp from "@/pages/ImprimirPpp";
import Assinaturas from "@/pages/Assinaturas";
import AtendimentoClinico from "@/pages/AtendimentoClinico";
import ImprimirAso from "@/pages/ImprimirAso";
import DemonstrativoConsumo from "@/pages/DemonstrativoConsumo";
import Financeiro from "@/pages/Financeiro";
import DashboardFinanceiro from "@/pages/DashboardFinanceiro";
import Suporte from "@/pages/Suporte";
import SuporteN2 from "@/pages/SuporteN2";
import PlanosPublico from "@/pages/PlanosPublico";
import CatalogosSst from "@/pages/CatalogosSst";
import Relatorios from "@/pages/Relatorios";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F6F9FB]">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
  );
  }

  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    } else if (authError.type === "auth_required") {
      navigateToLogin();
      return null;
    }
  }

  return (
    <AppStateProvider>
      <Routes>
        <Route
          element={
            <ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />
          }
        >
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/empresas" element={<Empresas />} />
            <Route path="/empresas/:id" element={<EmpresaDetalhe />} />
            <Route path="/funcionarios" element={<Funcionarios />} />
            <Route path="/trabalhadores/:id" element={<TrabalhadorDetalhe />} />
            <Route path="/assistente-ia" element={<AssistenteIA />} />
            <Route path="/chat" element={<ChatNR />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/normas" element={<Normas />} />
            <Route path="/textos-tecnicos" element={<TextosTecnicos />} />
            <Route path="/indicadores" element={<Indicadores />} />
            <Route path="/acidentes" element={<Acidentes />} />
            <Route path="/autos" element={<Autos />} />
            <Route path="/treinamentos" element={<Treinamentos />} />
            <Route path="/planos" element={<Navigate to="/consumo" replace />} />
            <Route path="/programas" element={<Programas />} />
            <Route path="/catalogos-sst" element={<CatalogosSst />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/atestados" element={<Atestados />} />
            <Route path="/manual" element={<Manual />} />
            <Route path="/recusas" element={<Recusas />} />
            <Route path="/esocial" element={<Esocial />} />
            <Route path="/terceiros" element={<Terceiros />} />
            <Route path="/epi" element={<Epi />} />
            <Route path="/cipa" element={<Cipa />} />
            <Route path="/inspecoes" element={<Inspecoes />} />
            <Route path="/vencimentos" element={<Vencimentos />} />
            <Route path="/consumo" element={<Consumo />} />
            <Route path="/clinica" element={<Clinica />} />
            <Route path="/organizacao" element={<Organizacao />} />
            <Route path="/psicossocial" element={<Psicossocial />} />
            <Route path="/importacao" element={<Importacao />} />
            <Route path="/painel-negocio" element={<PainelNegocio />} />
            <Route path="/assinaturas" element={<Assinaturas />} />
            <Route path="/clinica/atendimento" element={<AtendimentoClinico />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/dashboard-financeiro" element={<DashboardFinanceiro />} />
            <Route path="/suporte" element={<Suporte />} />
            <Route path="/suporte-n2" element={<SuporteN2 />} />
          </Route>
          <Route path="/programas/imprimir" element={<ImprimirPrograma />} />
          <Route path="/epi/ficha" element={<FichaEpi />} />
          <Route path="/consumo/demonstrativo" element={<DemonstrativoConsumo />} />
          <Route path="/clinica/aso" element={<ImprimirAso />} />
          <Route path="/ppp" element={<ImprimirPpp />} />
          <Route path="/dossie" element={<Dossie />} />
          <Route path="/inspecoes/relatorio" element={<ImprimirInspecao />} />
          <Route path="/atestados/relatorio" element={<ImprimirRelatorioSaude />} />
          <Route path="/atestados/fap-simulacao" element={<ImprimirSimulacaoFap />} />
          <Route path="/espaco-zela" element={<EspacoZela />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/assinar" element={<PlanosPublico />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AppStateProvider>
);
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
);
}

export default App;