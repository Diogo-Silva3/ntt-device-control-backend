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

### Implementação
- Use middleware de validação em todas as rotas que modificam agendamento
- Valide ANTES de salvar no banco
- Retorne erro claro se validação falhar

```javascript
// Middleware validarAgendamento verifica:
if (agendamento && statusProcesso !== 'Agendado para Entrega') {
  return res.status(400).json({ error: 'Inconsistência detectada' });
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

---

**Última atualização**: 20/04/2026
**Responsável**: Sistema de Inventário TI
