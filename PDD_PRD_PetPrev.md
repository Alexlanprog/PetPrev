# PDD / PRD — PetPrev Saúde Preventiva Domiciliar

**Produto:** PetPrev  
**Versão:** 4.3 (Especificação Definitiva de Produto, Rastreável e Auditada)  
**Tipo:** Plataforma digital de saúde preventiva veterinária por assinatura  
**Modelo:** B2C / Assinatura recorrente  
**Plataformas:** Aplicativo mobile (Tutor e Veterinário) + Painel Web Administrativo/Veterinário  
**Status:** Pronta para Execução & Auditoria Técnica Aprovada

---

# 1. Visão Geral

A **PetPrev** é uma plataforma de saúde preventiva veterinária que conecta tutores de cães e gatos a médicos veterinários credenciados para realização de atendimentos preventivos no domicílio.

O modelo combina:
- Atendimento veterinário domiciliar focado no bem-estar animal;
- Assinatura mensal recorrente com previsibilidade financeira;
- Motor determinístico de protocolos vacinais clínicos por semanas/espécie (baseado em **Versões de Protocolos Aprovadas pelo RT**);
- Trava térmica com auditoria de cadeia de frio (2°C a 8°C);
- Vermifugação e check-up clínico periódico;
- Prontuário digital **legalmente imutável** (Trigger Append-Only + Assinatura Assimétrica ECDSA do Veterinário + Aceite/Evidência do Tutor);
- Alertas automatizados via WhatsApp (Evolution API) e Push Notifications;
- Roteamento inteligente (Uber H3 / DBSCAN) e alocação por Score Ponderado;
- Operação offline nativa no app do veterinário com **Sincronização Versionada (Append-Only) com Flag de Conflito**;
- Teleorientação por Vídeo WebRTC via LiveKit (**Sessões Não Gravadas no MVP**);
- **Infraestrutura em Servidor VPS Único (Docker Compose + MinIO)** com evolução planejada de RPO/RTO por fase;
- **Modelo de Viabilidade Econômica Conservador de Mercado (Margem de Contribuição Realista de 41,2% no Ano 1 e 53,0% no Ano 2+)**.

---

# 2. Análise de Riscos Críticos & Mitigação Operacional

> [!CAUTION]
> ### ⚠️ Resolução de Riscos Críticos (Auditoria de Produto & Engenharia)
> 
> 1. **Risco de Margem Financeira:** O modelo contempla 8,5% de impostos (Simples Nacional), 4,0% de inadimplência, repasse atraente de R$ 65,00 ao veterinário e amortização de CAC (R$ 85,00) no Ano 1.
> 2. **Evolução Arquitetural de RPO/RTO:**
>    - **Fase 1 (MVP VPS Single-Node):** RTO < 2h | RPO < 24h (Backup diário offsite banco + mídias MinIO).
>    - **Fase 2 (Crescimento):** RTO < 30 min | RPO < 4h (Snapshots automatizados).
>    - **Fase 3 (Escala HA):** RTO < 5 min | RPO < 1h (Replicação Streaming Multi-AZ).
> 3. **Risco de Armazenamento:** Todas as mídias salvas via MinIO S3-Compatible local com backup automatizado offsite de mídias e banco.
> 4. **Risco Regulatório de Prontuários (CFMV):** Imutabilidade por Trigger Append-Only no PostgreSQL + Assinatura ECDSA do Veterinário + Tabela de Auditoria Traceável (`audit_logs`) + Coleta de Aceite/Evidência do Tutor.

---

# 3. Jornada End-to-End do Usuário (User Journey)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   JORNADA DO TUTOR PETPREV                                       │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

 [1. DESCOBERTA] ──> Anúncio geolocalizado no Instagram/Google ("Saúde pet em casa por R$ 59,90").
        │
 [2. LANDING PAGE] ─> Tutor simula a economia anual em relação a clínicas e entende o modelo.
        │
 [3. CADASTRO OTP] ─> Criação de conta via número de celular + validação por SMS/WhatsApp.
        │
 [4. PLANO & CHECKOUT] -> Escolha do Plano Essencial/Plus -> Pagamento via Cartão ou PIX Recorrente.
        │
 [5. PERFIL DO PET] ─> Cadastro do pet (Nome, Espécie, Raça, Idade, Foto e Observações).
        │
 [6. UPLOAD CARTEIRA] -> Upload da foto da antiga carteirinha de vacinas física (Armazenada no MinIO local).
        │
 [7. TRIAGEM & ALERTA] -> IA/RT analisa a carteira e gera o protocolo com alerta de vacinas pendentes.
        │
 [8. AGENDAMENTO] ──> Tutor escolhe o dia e a janela de horário disponível para a visita no domicílio.
        │
 [9. ATENDIMENTO] ──> Vet chega na residência com caixa térmica -> Exame físico + Aplicação de vacina.
        │
[10. PRONTUÁRIO] ───> Tutor assina aceite digital -> Prontuário assinado assimetricamente via ECDSA.
        │
[11. RENOVAÇÃO] ────> Lembretes periódicos de vermifugação e renovação automática da assinatura anual.
```

---

# 4. Wireframes & Arquitetura de Informação do Aplicativo

## 4.1 Arquitetura de Navegação da TabBar (App Tutor)

```text
APP TUTOR (Navegação Principal)
├── 🏠 HOME (Próximo atendimento, resumo dos pets, status da vacinação e atalhos rápidos)
├── 🐾 MEUS PETS (Lista de pets cadastrados, botão para adicionar pet e prontuário completo)
├── 📅 AGENDA (Histórico de visitas, solicitação de novo agendamento e rastreio em tempo real)
├── 📋 PRONTUÁRIO (Carteira de vacinação digital, histórico clínico e receitas baixáveis em PDF)
└── 💳 ASSINATURA (Gestão do plano, dados de cobrança, inclusão de dependentes e ajuda)
```

---

# 5. Análise de Viabilidade Econômica Unitária (Unit Economics Realista)

$$\text{Receita Bruta Anual Esperada (12x R\$ 59,90)} = \mathbf{\text{R\$ } 718,80}$$

| Custo / Dedução Direta | Valor Unitário (R$) | % da Receita Bruta | Detalhamento Realista da Operação |
| :--- | :---: | :---: | :--- |
| **RECEITA BRUTA ANUAL (ARR/Pet)** | **R$ 718,80** | **100,0%** | 12 mensalidades de R$ 59,90 pagas pelo tutor |
| (-) Impostos Diretos (Simples Nacional ~8,5%) | (R$ 61,10) | 8,5% | Tributação incidente sobre a nota fiscal de serviços |
| (-) Provisão de Inadimplência / Chargeback (~4%) | (R$ 28,75) | 4,0% | Perdas por não pagamento, cartões recusados e cancelamentos |
| **(=) RECEITA LÍQUIDA REALIZADA** | **R$ 628,95** | **87,5%** | **Receita efetivamente arrecadada em caixa** |
| (-) Repasse ao Veterinário (1 Visita Anual) | (R$ 65,00) | 9,0% | Remuneração competitiva repassada após aprovação do prontuário pelo RT |
| (-) Ajuda de Custo Deslocamento (Km + Pedágio) | (R$ 18,00) | 2,5% | Média de 12 km rodados ida/volta por atendimento em áreas urbanas |
| (-) Grade Vacinal + Insumos de Aplicação | (R$ 85,00) | 11,8% | Vacinas (V10 R$ 38 + Raiva R$ 15 + Gripe R$ 22) + seringas/luvas/descarte biológico |
| (-) Logística de Frio & Frete Distribuidor | (R$ 12,00) | 1,7% | Gelo reciclável, frete frio do distribuidor e calibração de sensores |
| (-) Tarifas do Gateway de Pagamento | (R$ 26,40) | 3,7% | Taxas de cobrança recorrente via Cartão/PIX (12x R$ 2,20) |
| (-) Automação WhatsApp API + SMS | (R$ 12,00) | 1,7% | Notificações, lembretes de vacinas e suporte ao tutor (12x R$ 1,00) |
| (-) Servidor VPS & Armazenamento Local | (R$ 14,40) | 2,0% | Hospedagem em VPS Linux e armazenamento MinIO prorrateado por pet |
| (-) Fundo de Quebra de Frio / Reagendamento | (R$ 15,00) | 2,1% | Reserva de emergência para perdas esporádicas ou reagendamentos |
| **(=) CUSTO OPERACIONAL DIRETO TOTAL (COGS)** | **(R$ 247,80)** | **34,5%** | **Custo operacional anual pé no chão para manter 1 pet** |
| **(=) MARGEM BRUTA OPERACIONAL** | **R$ 381,15** | **53,0%** | **Margem bruta sobre a receita bruta (60,6% s/ Rec. Líquida)** |
| (-) CAC Amortizado (Custo Aquisição no Ano 1) | (R$ 85,00) | 11,8% | Custo de Ads (Meta/Google) + Mídia amortizado no 1º ano de contrato |
| **(=) MARGEM DE CONTRIBUIÇÃO LÍQUIDA (ANO 1)**| **R$ 296,15** | **41,2%** | **Margem real de contribuição líquida no 1º ano do pet** |
| **(=) MARGEM DE CONTRIBUIÇÃO LÍQUIDA (ANO 2+)**| **R$ 381,15** | **53,0%** | **Margem de contribuição no 2º ano (Renovação sem novo CAC)** |

---

# 6. Demonstração dos Custos Operacionais e DRE Mensal

```text
DRE PROJETADA REALISTA — BASE DE 1.000 PETS ASSINANTES (MÊS TÍPICO)
──────────────────────────────────────────────────────────────────────────
RECEITA BRUTA MENSAL (1.000 x R$ 59,90)                      R$ 59.900,00
(-) Impostos Diretos (Simples Nacional ~ 8,5%)               (R$ 5.091,50)
(-) Provisão para Inadimplência / Chargebacks (~ 4%)         (R$ 2.396,00)
──────────────────────────────────────────────────────────────────────────
(=) RECEITA LÍQUIDA REALIZADA                                R$ 52.412,50

(-) CUSTOS OPERACIONAIS DIRETO (COGS Realista)
    - Repasses a Veterinários (Visitas prorrateadas)         (R$ 5.416,00)
    - Ajuda de Custo Deslocamento (Km Auditado)              (R$ 1.500,00)
    - Insumos Vacinais + Lixo Biológico                      (R$ 7.083,00)
    - Logística de Frio & Frete Distribuidor                 (R$ 1.000,00)
    - Tarifas Gateway de Pagamento                           (R$ 2.200,00)
    - Automação WhatsApp API + SMS                           (R$ 1.000,00)
    - Servidor VPS & Licenças Software                       (R$ 1.200,00)
    - Fundo de Quebra de Frio / Reagendamento                  (R$ 1.250,00)
──────────────────────────────────────────────────────────────────────────
(=) LUCRO BRUTO OPERACIONAL                                  R$ 31.763,50 (53,0% s/ Bruta)

(-) DESPESAS OPERACIONAIS FIXAS (OPEX)
    - Responsável Técnico Veterinário (RT)                     (R$ 4.000,00)
    - Equipe de Suporte e Operador de Rotas                    (R$ 7.500,00)
    - Softwares, SaaS e Licenças                               (R$ 2.000,00)
    - Contabilidade e Jurídico                                 (R$ 1.500,00)
──────────────────────────────────────────────────────────────────────────
(=) EBITDA CONSERVADOR (ANTES DE AMORTIZAÇÃO DE CAC)          R$ 16.763,50 (28,0% s/ Bruta)
```

---

# 7. Modelo Comercial, Planos e Regras de Fidelidade

## 7.1 Matriz de Planos

| Característica | Plano PetPrev Essencial | Plano PetPrev Plus / Família |
| :--- | :--- | :--- |
| **Valor Mensal** | **R$ 59,90 / mês por pet** | **R$ 99,90 / mês (até 2 pets)** |
| **Pets Incluídos** | 1 Cão ou 1 Gato | 2 Pets (Cães e/ou Gatos) |
| **Visita Check-up Clínico** | 1 visita clínica anual inclusa | 2 visitas clínicas anuais inclusas (1 por pet) |
| **Vacinas Incluídas** | Grade Anual Completa (V8/V10 ou V4/V5 + Antirrábica + Gripe) | Grade Anual Completa para ambos os pets |
| **Vermifugação** | Orientação + Lembretes (insumo com 15% desc.) | Lembretes + 2 doses de vermífugo/ano inclusas por pet |
| **Teleorientação Vet** | Não incluso | Ilimitada via Videochamada WebRTC (**Não Gravada no MVP**) |

---

# 8. Matriz RBAC Unificada (Harmonizada PDD x SDD)

| Módulo / Funcionalidade | ADMIN_GERAL | OPERADOR_ROTAS | VET_RESPONSAVEL_TECNICO | SUPORTE |
| :--- | :---: | :---: | :---: | :---: |
| **Gestão de Usuários & Roles** | **CRUD** | R | R | R |
| **Gestão de Tutores & Pets** | **CRUD** | R | **CRUD** | R |
| **Prontuários Clínicos & Assinatura** | R | — | **CRUD** | R (Leitura) |
| **Credenciamento de Veterinários** | **CRUD** | R | **CRUD (Aprovação)** | R |
| **Estoque de Vacinas & Lotes** | **CRUD** | R | **CRUD** | — |
| **Agendamentos & Rotas (H3)** | **CRUD** | **CRUD** | R | — |
| **Faturamento, PIX Batch & Repasses** | **CRUD** | R | — | R |
| **Planos & Regras Comerciais** | **CRUD** | R | — | R |
| **Protocolos Clínicos Vacinais** | R | — | **CRUD (Versões)** | — |

---

# 9. Definição Final do Produto em Uma Frase

> **A PetPrev é a plataforma de saúde preventiva veterinária domiciliar que alinha conveniência e tecnologia a um modelo financeiro realista, operação VPS containerizada com Docker Compose e segurança jurídica total de prontuários imutáveis e auditados.**
