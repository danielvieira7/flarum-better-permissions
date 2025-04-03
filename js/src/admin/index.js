import { extend, override } from 'flarum/common/extend';
import app from 'flarum/admin/app';
import PermissionGrid from 'flarum/admin/components/PermissionGrid';
import GroupSelectionSidebar from './components/GroupSelectionSidebar';
import Group from 'flarum/common/models/Group';

app.initializers.add('acme-better-permissions', () => {
  // Estado compartilhado para grupos selecionados
  // Inicializa com Admin e Mod (IDs 1 e 2 geralmente)
  // Poderia ser mais robusto buscando por nome ou usando constantes do Flarum
  const selectedGroupIds = new Set([Group.ADMINISTRATOR_ID, Group.MODERATOR_ID]);

  override(PermissionGrid.prototype, 'view', function (originalView) {
    // Guarda a referência 'this' original
    const gridInstance = this;

    // Chame a lógica original para obter o Vnode da grade padrão (se necessário internamente)
    // Não vamos renderizar diretamente o originalView() completo ainda.

    // Obtenha todos os grupos, exceto "Guest" (ID 3 geralmente)
    const allGroups = app.store.all('group').filter(group => group.id() !== Group.GUEST_ID);

    // Filtra os grupos que serão realmente exibidos nas colunas
    const groupsToDisplay = allGroups.filter(group => selectedGroupIds.has(group.id()));

    // Ordena os grupos para exibição (opcional, mas bom)
    groupsToDisplay.sort((a, b) => {
       // Coloca Admin e Mod primeiro
      if (a.id() === Group.ADMINISTRATOR_ID) return -1;
      if (b.id() === Group.ADMINISTRATOR_ID) return 1;
      if (a.id() === Group.MODERATOR_ID) return -1;
      if (b.id() === Group.MODERATOR_ID) return 1;
      // Ordena os outros alfabeticamente (ou como preferir)
      return a.nameSingular().localeCompare(b.nameSingular());
    });


    // Cria a nova estrutura de layout
    return (
      <div className="PermissionsPageLayout">
        {/* Renderiza a Sidebar, passando a lista completa, o estado de seleção e um callback */}
        <GroupSelectionSidebar
          allGroups={allGroups}
          selectedGroupIds={selectedGroupIds}
          onGroupSelectionChange={(groupId, isSelected) => {
            if (isSelected) {
              selectedGroupIds.add(groupId);
            } else {
              // Não permite desmarcar Admin/Mod (opcional)
              if (groupId !== Group.ADMINISTRATOR_ID && groupId !== Group.MODERATOR_ID) {
                 selectedGroupIds.delete(groupId);
              } else {
                  // Força redraw para reverter o checkbox visualmente se tentou desmarcar Admin/Mod
                  m.redraw();
                  return; // Impede a desmarcação
              }
            }
            // Força o redraw do PermissionGrid para atualizar as colunas
            m.redraw();
          }}
        />

        {/* Renderiza a grade de permissões modificada */}
        <div className="PermissionsPageGridContainer">
            {/* Reimplementação parcial ou chamada de métodos internos do PermissionGrid */}
            {/* Esta é a parte mais complexa. Precisamos renderizar a estrutura da tabela */}
            {/* baseada nos 'groupsToDisplay' e nas permissões ('this.props.items') */}
            {/* Exemplo muito simplificado: */}

            <table className="PermissionGrid">
              <thead>
                <tr>
                  <th>{/* Coluna de Nome da Permissão */}</th>
                  {/* Coluna Global (convidado/membro) */}
                   {gridInstance.scopeItems().map((scope) => (
                        <th key={scope.label} onclick={gridInstance.grid.setPermission.bind(gridInstance.grid, null, scope.permission, gridInstance.permissionType())}>
                            {gridInstance.scopeIcon(scope)} {scope.label}
                        </th>
                    ))}
                  {/* Colunas dos Grupos Selecionados */}
                  {groupsToDisplay.map(group => (
                    <th key={group.id()}>
                      {gridInstance.groupIcon(group)} {group.namePlural()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Itera sobre as categorias de permissão e permissões */}
                {gridInstance.permissionItems().toArray().map(item => {
                    // item pode ser um cabeçalho ou uma permissão
                    if (!item.render) { // É um cabeçalho/separador
                        return (
                            <tr className="PermissionGrid-section">
                                <td colSpan={2 + groupsToDisplay.length + gridInstance.scopeItems().length}>
                                    <h3>{item.label}</h3>
                                    {item.description ? <p>{item.description}</p> : null}
                                </td>
                            </tr>
                        );
                    }
                    // É uma permissão
                    return item.render(); // DEVERIA renderizar a linha completa (<tr>)
                                         // A implementação padrão do 'item.render()' pode precisar
                                         // ser ajustada ou estendida para usar 'groupsToDisplay'
                                         // em vez de todos os grupos. Isso pode exigir
                                         // estender a classe que define esses 'items'.
                                         // *** ESTA É A PARTE MAIS DELICADA E PROPENSA A ERROS ***
                                         // Para um exemplo funcional, seria necessário replicar
                                         // ou estender a lógica de renderização de linhas do Flarum Core,
                                         // garantindo que ela use 'groupsToDisplay'.

                                         // Exemplo conceitual de como a linha seria (simplificado):
                                        // return (
                                        //     <tr>
                                        //         <td>
                                        //             {gridInstance.permissionIcon(item)} {item.label}
                                        //         </td>
                                        //         {/* Células Globais */}
                                        //         {gridInstance.scopeItems().map(scope => (
                                        //             <td key={scope.label} onclick={() => gridInstance.togglePermission(null, scope.permission, item.permission)}>
                                        //                 {gridInstance.renderPermission(null, scope.permission, item.permission)}
                                        //             </td>
                                        //         ))}
                                        //         {/* Células dos Grupos Selecionados */}
                                        //         {groupsToDisplay.map(group => (
                                        //             <td key={group.id()} onclick={() => gridInstance.togglePermission(group.id(), null, item.permission)}>
                                        //                 {gridInstance.renderPermission(group.id(), null, item.permission)}
                                        //             </td>
                                        //         ))}
                                        //     </tr>
                                        // );
                                        // ** O código acima é apenas ilustrativo da estrutura **
                                        // ** Use 'item.render()' se possível, ou reimplemente/estenda cuidadosamente **
                })}
              </tbody>
            </table>
        </div>
      </div>
    );
  });
});

