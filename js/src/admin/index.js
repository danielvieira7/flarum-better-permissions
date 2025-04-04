import { extend, override } from 'flarum/common/extend';
import app from 'flarum/admin/app';
import PermissionsPage from 'flarum/admin/components/PermissionsPage';
import PermissionGrid from 'flarum/admin/components/PermissionGrid';
import GroupSelectionSidebar from './components/GroupSelectionSidebar';
import Group from 'flarum/common/models/Group';
import ItemList from 'flarum/common/utils/ItemList'; // Necessário para manipulação de Vnode

// Não precisa mais importar o LESS aqui se ele já é processado pelo Webpack
// import '../../../resources/less/admin.less';

app.initializers.add('danielvieira7-better-permissions', () => {
  // --- Estado Compartilhado ---
  // Conjunto (Set) para armazenar os IDs dos grupos selecionados para exibição
  const selectedGroupIds = new Set([Group.ADMINISTRATOR_ID, Group.MODERATOR_ID]); // Começa com Admin e Mod

  // --- 1. Adicionar a Sidebar à Página de Permissões ---
  extend(PermissionsPage.prototype, 'view', function (vnode) {
    // 'vnode' aqui é o Vnode original da PermissionsPage (geralmente um div)

    // Obtenha todos os grupos (exceto Convidado) para a sidebar
    const allGroups = app.store.all('group').filter(group => group.id() !== Group.GUEST_ID);

    // Cria o Vnode da nossa Sidebar
    const sidebar = (
      <GroupSelectionSidebar
        allGroups={allGroups}
        selectedGroupIds={selectedGroupIds}
        onGroupSelectionChange={(groupId, isSelected) => {
          if (isSelected) {
            selectedGroupIds.add(groupId);
          } else {
            // Não permite desmarcar Admin/Mod (regra de negócio opcional)
            if (groupId !== Group.ADMINISTRATOR_ID && groupId !== Group.MODERATOR_ID) {
              selectedGroupIds.delete(groupId);
            } else {
              m.redraw(); // Força redraw para reverter o checkbox visualmente
              return; // Impede a desmarcação
            }
          }
          m.redraw(); // Força redraw da página inteira para atualizar a grade
        }}
      />
    );

    // Encontra o container principal dentro do Vnode da página
    // (Pode precisar de ajuste se a estrutura do Flarum mudar)
    const contentContainer = vnode.children.find(child => child?.attrs?.className?.includes('PermissionsPage-content'));

    if (contentContainer) {
      // Adiciona uma classe para layout flexível e insere a sidebar
      contentContainer.attrs.className += ' PermissionsPageLayout--with-sidebar'; // Adiciona classe para CSS
      // Insere a sidebar no início dos filhos do container de conteúdo
      contentContainer.children.unshift(sidebar);
    } else {
      // Fallback: Adiciona a sidebar antes de todo o conteúdo da página se o container não for encontrado
      vnode.children.unshift(sidebar);
      // Adiciona uma classe ao Vnode raiz da página para estilização
      vnode.attrs.className = (vnode.attrs.className || '') + ' PermissionsPageLayout--with-sidebar-fallback';
    }

    // Não precisamos retornar nada aqui, pois 'extend' modifica o vnode original
  });


  // --- 2. Modificar a Grade para Mostrar Apenas Colunas Selecionadas ---
  override(PermissionGrid.prototype, 'view', function (originalView) {
    // Chama a função view ORIGINAL para obter a árvore Vnode padrão da grade
    const originalGridVnode = originalView.call(this);

    // --- Segurança: Verifica se a estrutura básica existe ---
    if (!originalGridVnode || !originalGridVnode.tag === 'table' || !Array.isArray(originalGridVnode.children)) {
      console.error("Estrutura inesperada do Vnode do PermissionGrid original.");
      return <div className="PermissionGrid-Error">Erro ao modificar a grade de permissões.</div>; // Retorna algo seguro
    }

    // Encontra o thead e tbody dentro dos filhos da tabela
    const thead = originalGridVnode.children.find(child => child?.tag === 'thead');
    const tbody = originalGridVnode.children.find(child => child?.tag === 'tbody');

    // --- Segurança: Verifica se thead e tbody existem ---
    if (!thead || !thead.children || !tbody || !tbody.children) {
        console.error("Não foi possível encontrar thead ou tbody no Vnode do PermissionGrid.");
        return originalGridVnode; // Retorna o original se não encontrar
    }

    // Encontra a linha do cabeçalho (assumindo que é a primeira filha do thead)
    const headerRow = thead.children[0];

    // --- Filtrar Cabeçalhos (<th>) ---
    if (headerRow && headerRow.tag === 'tr' && Array.isArray(headerRow.children)) {
      headerRow.children = headerRow.children.filter(thVnode => {
        // Mantém colunas que não são de grupo (ex: nome da permissão, escopos globais)
        // Assumimos que colunas de grupo têm uma 'key' numérica (o ID do grupo)
        // e outras colunas têm 'key' string ou não numérica.
        const key = thVnode?.key;
        const isGroupColumn = typeof key === 'string' && /^\d+$/.test(key); // Verifica se a key é uma string numérica (ID do grupo)

        // Mantém se NÃO for uma coluna de grupo OU se o ID do grupo está selecionado
        return !isGroupColumn || selectedGroupIds.has(key);
      });
    }

    // --- Filtrar Células de Dados (<td>) em cada linha do tbody ---
    tbody.children.forEach(trVnode => {
      // Verifica se é uma linha de dados (<tr>) e tem filhos (<td>)
      if (trVnode && trVnode.tag === 'tr' && Array.isArray(trVnode.children)) {
        // Filtra as células (<td>) da linha atual
        trVnode.children = trVnode.children.filter(tdVnode => {
          // Lógica similar à do cabeçalho para identificar e filtrar colunas de grupo
          const key = tdVnode?.key;
          // A key da célula de dados pode ser mais complexa (ex: 'group-1', 'scope-view')
          // Precisamos de uma forma confiável de identificar células de grupo.
          // Vamos assumir que a key da célula de um grupo começa com 'group-' seguido do ID.
          // Ou, mais robusto, inspecionar os atributos ou classes se o Flarum os adicionar.
          // Tentativa baseada na key:
          let isGroupColumn = false;
          let groupId = null;
          if (typeof key === 'string' && key.startsWith('group-')) {
              groupId = key.split('-')[1];
              isGroupColumn = /^\d+$/.test(groupId);
          }

          // Mantém se NÃO for uma coluna de grupo OU se o ID do grupo está selecionado
          return !isGroupColumn || selectedGroupIds.has(groupId);
        });
      }
      // Ignora linhas que não são <tr> ou não têm filhos (ex: separadores de seção)
    });

    // Retorna a árvore Vnode da grade ORIGINAL, mas agora com colunas filtradas
    return originalGridVnode;
  });

});
