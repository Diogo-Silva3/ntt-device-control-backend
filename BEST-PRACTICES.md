# Melhores Práticas - Sistema de Inventário TI

## 1. Sincronização de Queries

### Problema Identificado
Queries diferentes retornando valores diferentes para o mesmo dado (ex: `agendados` vs `maquinasAgendadas`).

### Solução
- **Sempre use a mesma query** para o mesmo dado em diferentes partes do código
- Se precisar de variações, documente claramente a diferença
- Use constantes para queries críticas

```javascript
// ✓ BOM: Query centralizada
const QUERY_AGENDADOS = {
  where: {
    empresaId,
    status: { not: 'DESCARTADO' },
    statusProcesso: 'Agendado para Entrega'
  }
};

const agendados = await prisma.equipamento.count(QUERY_AGENDADOS);
const maquinasAgendadas = await prisma.equipamento.count(QUERY_AGENDADOS);
```

## 2. Validação de Dados

### Regra: Integridade Referencial
Quando um equipamento tem `agendamento` preenchido, DEVE ter `statusProcesso: 'Agendado para Entrega'`.

### Regras de Agendamento (CRÍTICO)
**Nenhum equipamento pode ser agendado sem:**
1. ✓ `agendamento.colaboradorId` - Colaborador selecionado
2. ✓ `agendamento.data` - Data de entrega
3. ✓ `statusProcesso: 'Agendado para Entrega'` - Status correto

### Implementação
- Use middleware de validação em todas as rotas que modificam agendamento
- Valide ANTES de salvar no banco
- Retorne erro claro se validação falhar
- Frontend também valida ANTES de enviar

```javascript
// Middleware validarAgendamento verifica:
if (agendamento && !agendamento.colaboradorId) {
  return res.status(400).json({ error: 'Agendamento requer um colaborador selecionado' });
}
if (agendamento && !agendamento.data) {
  return res.status(400).json({ error: 'Agendamento requer uma data' });
}
if (agendamento && statusProcesso !== 'Agendado para Entrega') {
  return res.status(400).json({ error: 'Inconsistência detectada' });
}
```

### Frontend Validation
```javascript
// Em EquipamentoDetalhePage.jsx - função avancar()
if (etapaAtual.temAgendamento) {
  if (!agendamento.colaboradorId) {
    alert('Selecione um colaborador para agendar');
    return;
  }
  if (!agendamento.data) {
    alert('Selecione uma data para agendar');
    return;
  }
}
```

## 3. Testes Automatizados

### Executar Regularmente
```bash
node backend/tests/dashboard.test.js
```

### O que Testa
- Sincronização entre queries do pipeline e Tech Refresh
- Integridade de dados (agendamento vs statusProcesso)
- Equipamentos com problemas

## 4. Logs e Monitoramento

### Adicionar Logs em Operações Críticas
```javascript
console.log(`[AGENDAMENTO] Equipamento ${id} agendado para ${data}`);
console.log(`[DASHBOARD] Contagem: agendados=${agendados}, maquinasAgendadas=${maquinasAgendadas}`);
```

### Alertas
Se `agendados !== maquinasAgendadas`, investigar imediatamente.

## 5. Deploy Seguro

### Checklist Antes de Deploy
- [ ] Executar testes: `node backend/tests/dashboard.test.js`
- [ ] Verificar se queries estão sincronizadas
- [ ] Fazer backup do banco de dados
- [ ] Testar em staging antes de produção
- [ ] Monitorar logs após deploy

### Comando de Deploy
```bash
git add -A
git commit -m "descrição clara"
git push origin main
ssh root@187.127.8.112 "cd /var/www/backend && git reset --hard origin/main && npm install && pm2 restart ntt-backend"
```

## 6. Estrutura de Dados

### Equipamento com Agendamento
```javascript
{
  id: 1,
  serialNumber: 'H45C9H4',
  statusProcesso: 'Agendado para Entrega', // OBRIGATÓRIO quando agendado
  status: 'DISPONIVEL', // Sincronizado automaticamente
  agendamento: {
    colaboradorId: 123,
    data: '2026-04-25',
    horario: '14:00',
    local: 'Sala TI'
  },
  dataEntrega: '2026-04-25' // Sincronizado com agendamento.data
}
```

## 7. Correção de Inconsistências

### Se Encontrar Problema
1. Executar teste: `node backend/tests/dashboard.test.js`
2. Identificar equipamentos problemáticos
3. Usar função `corrigirInconsistencias()` para corrigir automaticamente
4. Verificar logs para entender causa raiz

## 8. Documentação de Queries

### Sempre Documentar
```javascript
// Conta equipamentos agendados para entrega
// Usado em: Pipeline "Ag. Entrega" e Tech Refresh "AGENDADAS"
// IMPORTANTE: Manter sincronizado com maquinasAgendadas
const agendados = await prisma.equipamento.count({
  where: {
    ...whereEq,
    status: { not: 'DESCARTADO' },
    statusProcesso: 'Agendado para Entrega'
  }
});
```

## 9. Versionamento de Schema

### Quando Alterar Schema
- Criar migration com Prisma
- Testar em staging
- Documentar mudanças
- Atualizar queries se necessário

```bash
npx prisma migrate dev --name descricao_mudanca
```

## 10. Monitoramento em Produção

### Verificar Regularmente
```bash
# SSH na VPS
ssh root@187.127.8.112

# Ver logs do backend
pm2 logs ntt-backend

# Executar teste
node /var/www/backend/tests/dashboard.test.js
```

## 11. Fluxo de Agendamento (Lançamentos Futuros)

### Regra de Ouro: Agendamento SÓ em PREPARAÇÃO
**NUNCA** permitir agendamento em Atribuições. Razões:
- ✓ Evita inconsistência de dados
- ✓ Histórico claro e rastreável
- ✓ Validação centralizada
- ✓ Fluxo único e sem confusão
- ✓ Previne bugs futuros

### Técnico Automático
**Se técnico está logado:**
- ✓ Seu ID é atribuído automaticamente
- ✓ Select de técnico fica DESABILITADO
- ✓ Não pode selecionar outro técnico
- ✓ Mensagem: "Seu técnico é atribuído automaticamente"

**Se admin está logado:**
- ✓ Pode selecionar qualquer técnico
- ✓ Select de técnico fica HABILITADO

### Passo a Passo Correto
1. **Técnico prepara equipamento** → StatusProcesso: "Asset Registrado"
2. **Técnico clica "Documentos enviados — Avançar"** → Vai para etapa "Agendado p/ Entrega"
3. **Sistema exibe:**
   - Técnico responsável: Seu nome (desabilitado)
   - Colaborador: Selecionar (obrigatório)
   - Data: Selecionar (obrigatório)
   - Horário: Selecionar (opcional)
   - Local: Selecionar (opcional)
4. **Se não preencher colaborador ou data:**
   - Frontend mostra alert: "Selecione um colaborador para agendar"
   - Não envia para backend
5. **Se preencher tudo corretamente:**
   - Frontend envia: `PUT /equipamentos/{id}` com agendamento
   - Backend valida com middleware
   - Se válido: Salva agendamento + muda statusProcesso
   - Dashboard atualiza automaticamente
   - Card "AGENDADAS" incrementa +1

### Validação em Dois Níveis
```
Frontend (UX) → Backend (Segurança)
   ↓                ↓
Alert se vazio  Rejeita se vazio
   ↓                ↓
Não envia      Retorna erro 400
```

### Atribuições (Vinculações) - SÓ Gerenciamento
Em Atribuições, o técnico pode:
- ✓ Reagendar (mudar data de agendamento já feito)
- ✓ Marcar como entregue
- ✓ Marcar como não compareceu
- ✓ Transferir para outro técnico
- ✗ **NUNCA** criar novo agendamento

### Proteção Implementada
```javascript
// Em vinculacao.controller.js - função criar()
if (dataAgendamento) {
  return res.status(400).json({ 
    error: 'Agendamento deve ser feito na etapa de PREPARAÇÃO, não em Atribuições' 
  });
}

// Em EquipamentoModal.jsx e EquipamentoDetalhePage.jsx
if (isTecnico) {
  // Select desabilitado, mostra seu próprio nome
  <select disabled={isTecnico} ...>
  {isTecnico && <p>Seu técnico é atribuído automaticamente</p>}
}
```

### Resultado Esperado
- ✓ Equipamento com `statusProcesso: 'Agendado para Entrega'`
- ✓ Agendamento com `colaboradorId`, `data`, `horario`, `local`
- ✓ Técnico responsável = técnico logado (se for técnico)
- ✓ Vinculação criada com status `PENDENTE`
- ✓ Dashboard conta corretamente
- ✓ Aba "Agendadas" mostra equipamento
- ✓ Histórico claro e rastreável

### Teste Manual
```bash
# 1. Logar como TÉCNICO
# 2. Ir para Preparação
# 3. Verificar que select de técnico está desabilitado
# 4. Agendar equipamento
# 5. Verificar que técnico responsável é o técnico logado
# 6. Ir para Atribuições
# 7. Tentar criar nova atribuição com dataAgendamento
#    → Deve retornar erro: "Agendamento deve ser feito na etapa de PREPARAÇÃO"

# 8. Logar como ADMIN
# 9. Ir para Preparação
# 10. Verificar que select de técnico está HABILITADO
# 11. Pode selecionar qualquer técnico
```

---

**Última atualização**: 20/04/2026
**Responsável**: Sistema de Inventário TI
