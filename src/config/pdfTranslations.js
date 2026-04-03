const translations = {
  pt: {
    statusLabel: s => s === 'DISPONIVEL' ? 'Disponível' : s === 'EM_USO' ? 'Em Uso' : s === 'MANUTENCAO' ? 'Manutenção' : s || '-',
    geradoEm: 'Gerado em',
    total: 'Total',
    registros: 'registros',
    nenhumRegistro: 'Nenhum registro encontrado.',
    rodape: 'Tech Refresh · Documento gerado automaticamente',

    titulos: {
      geral: 'Todos os Equipamentos',
      disponiveis: 'Equipamentos Disponíveis',
      colaboradores: 'Todos os Colaboradores',
      vinculacoes: 'Vinculações Ativas',
      porUnidade: 'Equipamentos por Unidade',
      colabSemEquip: 'Colaboradores sem Equipamento',
      equipSemColab: 'Equipamentos sem Colaborador',
      preparacao: 'Preparação de Equipamentos',
      agendamentos: 'Agendamentos da Semana',
    },

    headers: {
      geral:        ['Marca / Modelo', 'Tipo', 'Serial', 'Unidade', 'Status', 'Colaborador'],
      disponiveis:  ['Marca / Modelo', 'Tipo', 'Serial', 'Unidade', 'Status', 'Colaborador'],
      colaboradores:['Nome', 'Função', 'Email', 'Unidade', 'Equipamento'],
      vinculacoes:  ['Colaborador', 'Função', 'Unidade', 'Equipamento', 'Serial', 'Desde'],
      porUnidade:   ['Unidade', 'Equipamento', 'Tipo', 'Serial', 'Status'],
      colabSemEquip:['Nome', 'Função', 'Email', 'Unidade'],
      equipSemColab:['Equipamento', 'Tipo', 'Serial', 'Status', 'Unidade'],
      preparacao:   ['Equipamento', 'Serial', 'Unidade', 'Etapa', 'Técnico', 'Dias'],
      agendamentos: ['Equipamento', 'Serial', 'Unidade', 'Destinatário', 'Técnico'],
    },
  },

  en: {
    statusLabel: s => s === 'DISPONIVEL' ? 'Available' : s === 'EM_USO' ? 'In Use' : s === 'MANUTENCAO' ? 'Maintenance' : s || '-',
    geradoEm: 'Generated on',
    total: 'Total',
    registros: 'records',
    nenhumRegistro: 'No records found.',
    rodape: 'Tech Refresh · Automatically generated document',

    titulos: {
      geral: 'All Equipment',
      disponiveis: 'Available Equipment',
      colaboradores: 'All Employees',
      vinculacoes: 'Active Assignments',
      porUnidade: 'Equipment by Unit',
      colabSemEquip: 'Employees without Equipment',
      equipSemColab: 'Equipment without Employee',
      preparacao: 'Equipment Preparation',
      agendamentos: 'This Week\'s Schedules',
    },

    headers: {
      geral:        ['Brand / Model', 'Type', 'Serial', 'Unit', 'Status', 'Employee'],
      disponiveis:  ['Brand / Model', 'Type', 'Serial', 'Unit', 'Status', 'Employee'],
      colaboradores:['Name', 'Role', 'Email', 'Unit', 'Equipment'],
      vinculacoes:  ['Employee', 'Role', 'Unit', 'Equipment', 'Serial', 'Since'],
      porUnidade:   ['Unit', 'Equipment', 'Type', 'Serial', 'Status'],
      colabSemEquip:['Name', 'Role', 'Email', 'Unit'],
      equipSemColab:['Equipment', 'Type', 'Serial', 'Status', 'Unit'],
      preparacao:   ['Equipment', 'Serial', 'Unit', 'Stage', 'Technician', 'Days'],
      agendamentos: ['Equipment', 'Serial', 'Unit', 'Recipient', 'Technician'],
    },
  },

  es: {
    statusLabel: s => s === 'DISPONIVEL' ? 'Disponible' : s === 'EM_USO' ? 'En Uso' : s === 'MANUTENCAO' ? 'Mantenimiento' : s || '-',
    geradoEm: 'Generado el',
    total: 'Total',
    registros: 'registros',
    nenhumRegistro: 'No se encontraron registros.',
    rodape: 'Tech Refresh · Documento generado automáticamente',

    titulos: {
      geral: 'Todos los Equipos',
      disponiveis: 'Equipos Disponibles',
      colaboradores: 'Todos los Colaboradores',
      vinculacoes: 'Asignaciones Activas',
      porUnidade: 'Equipos por Unidad',
      colabSemEquip: 'Colaboradores sin Equipo',
      equipSemColab: 'Equipos sin Colaborador',
      preparacao: 'Preparación de Equipos',
      agendamentos: 'Programaciones de la Semana',
    },

    headers: {
      geral:        ['Marca / Modelo', 'Tipo', 'Serial', 'Unidad', 'Estado', 'Colaborador'],
      disponiveis:  ['Marca / Modelo', 'Tipo', 'Serial', 'Unidad', 'Estado', 'Colaborador'],
      colaboradores:['Nombre', 'Función', 'Email', 'Unidad', 'Equipo'],
      vinculacoes:  ['Colaborador', 'Función', 'Unidad', 'Equipo', 'Serial', 'Desde'],
      porUnidade:   ['Unidad', 'Equipo', 'Tipo', 'Serial', 'Estado'],
      colabSemEquip:['Nombre', 'Función', 'Email', 'Unidad'],
      equipSemColab:['Equipo', 'Tipo', 'Serial', 'Estado', 'Unidad'],
      preparacao:   ['Equipo', 'Serial', 'Unidad', 'Etapa', 'Técnico', 'Días'],
      agendamentos: ['Equipo', 'Serial', 'Unidad', 'Destinatario', 'Técnico'],
    },
  },
};

const getT = (lang) => translations[lang] || translations['pt'];

module.exports = { getT };
