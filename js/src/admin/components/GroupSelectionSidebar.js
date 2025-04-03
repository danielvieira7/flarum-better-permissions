import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Checkbox from 'flarum/common/components/Checkbox';
import GroupBadge from 'flarum/common/components/GroupBadge';
import Group from 'flarum/common/models/Group';
import ItemList from 'flarum/common/utils/ItemList';
import listItems from 'flarum/common/helpers/listItems';

export default class GroupSelectionSidebar extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.filter = '';

    // Recebe via attrs: allGroups, selectedGroupIds, onGroupSelectionChange
  }

  view() {
    const { allGroups, selectedGroupIds, onGroupSelectionChange } = this.attrs;

    const filteredGroups = allGroups.filter(group => {
        const name = group.nameSingular().toLowerCase();
        return name.includes(this.filter.toLowerCase());
    }).sort((a, b) => {
        // Ordenar: Admin, Mod, depois alfabético
        if (a.id() === Group.ADMINISTRATOR_ID) return -1;
        if (b.id() === Group.ADMINISTRATOR_ID) return 1;
        if (a.id() === Group.MODERATOR_ID) return -1;
        if (b.id() === Group.MODERATOR_ID) return 1;
        return a.nameSingular().localeCompare(b.nameSingular());
    });


    return (
      <div className="GroupSelectionSidebar">
        <h3>{app.translator.trans('core.admin.permissions.select_groups_heading')}</h3> {/* Adicione esta tradução se necessário */}
        <div className="Form-group">
          <input
            type="text"
            className="FormControl"
            placeholder={app.translator.trans('core.admin.permissions.search_groups_placeholder')} // Adicione esta tradução
            value={this.filter}
            oninput={e => {
              this.filter = e.target.value;
              // Não precisa de m.redraw() aqui, o input já causa redraw local
            }}
          />
        </div>
        <ul className="GroupList">
          {filteredGroups.map(group => (
            <li key={group.id()} className="GroupListItem">
              <Checkbox
                state={selectedGroupIds.has(group.id())}
                // Desabilita o checkbox para Admin/Mod para evitar desmarcação (se desejado)
                disabled={group.id() === Group.ADMINISTRATOR_ID || group.id() === Group.MODERATOR_ID}
                onchange={isChecked => {
                   onGroupSelectionChange(group.id(), isChecked);
                }}
              >
                <GroupBadge group={group} />
                <span className="GroupListItem-name">{group.nameSingular()}</span>
              </Checkbox>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
