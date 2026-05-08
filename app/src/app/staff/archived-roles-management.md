/*
  ARCHIVO ARCHIVADO - CÓDIGO DE GESTIÓN DE ROLES
  ==============================================
  
  Este código fue removido de staff/page.tsx el 08/05/2026.
  Se mantiene aquí para referencia futura o para implementar en otro módulo.

  Funcionalidades guardadas:
  - Pestaña de Roles en la vista Staff
  - CRUD completo de roles (crear, editar, eliminar, activar/desactivar)
  - Modal de edición/creación de roles
  - Lista de roles con cards
*/

// ==============================================
// IMPORTS NECESARIOS (agregar a los imports):
// ==============================================
// import { 
//   createRole, 
//   updateRole, 
//   deleteRole, 
// } from '@/lib/db/queries';
// import { Layers } from 'lucide-react';

// ==============================================
// ESTADOS NECESARIOS (agregar al componente):
// ==============================================
// const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');
// const [editingRole, setEditingRole] = useState<Role | null>(null);
// const [roleForm, setRoleForm] = useState({ name: '', description: '', color: '#6B7280' });

// ==============================================
// FUNCIONES DE GESTIÓN DE ROLES:
// ==============================================

/**
 * Manejador de submit para crear/actualizar roles
 */
async function handleRoleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!roleForm.name.trim()) { toast.error('El nombre es obligatorio'); return; }
  try {
    if (editingRole) {
      await updateRole(editingRole.id, roleForm);
      toast.success('Rol actualizado');
    } else {
      await createRole(roleForm);
      toast.success('Rol creado');
    }
    setShowRoleModal(false);
    setEditingRole(null);
    setRoleForm({ name: '', description: '', color: '#6B7280' });
    load();
  } catch (e: any) {
    toast.error(e.message || 'Error');
  }
}

/**
 * Abrir modal para editar un rol existente
 */
function openRoleEdit(role: Role) {
  setEditingRole(role);
  setRoleForm({ name: role.name, description: role.description || '', color: role.color });
  setShowRoleModal(true);
}

/**
 * Abrir modal para crear un nuevo rol
 */
function openRoleNew() {
  setEditingRole(null);
  setRoleForm({ name: '', description: '', color: '#6B7280' });
  setShowRoleModal(true);
}

/**
 * Eliminar un rol (con confirmación)
 */
async function handleDeleteRole(role: Role) {
  if (!confirm(`¿Eliminar el rol "${role.name}"? No se puede si hay staff asignado.`)) return;
  try {
    await deleteRole(role.id);
    toast.success('Rol eliminado');
    load();
  } catch (e: any) {
    toast.error(e.message || 'Error al eliminar');
  }
}

/**
 * Toggle activar/desactivar un rol
 */
async function toggleRoleActive(role: Role) {
  try {
    await updateRole(role.id, { active: !role.active });
    toast.success(`Rol ${role.active ? 'desactivado' : 'activado'}`);
    load();
  } catch (e) {
    toast.error('Error al actualizar');
  }
}

// ==============================================
// ESTRUCTURA UI (agregar dentro del return):
// ==============================================

/*
  <Header title="Staff / Artists" action={
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'staff' ? 'bg-salon-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <UserRound className="w-4 h-4 inline mr-1" /> Equipo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === 'roles' ? 'bg-salon-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Layers className="w-4 h-4 inline mr-1" /> Roles
        </button>
      </div>
      {activeTab === 'staff' ? (
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      ) : (
        <Button size="sm" onClick={openRoleNew}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo Rol
        </Button>
      )}
    </div>
  } />

  <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
    {activeTab === 'staff' ? (
      // ... TODO: contenido actual de staff (cards, búsqueda, etc.)
      <></>
    ) : (
      // VISTA DE ROLES
      <>
        {roles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay roles creados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className={!role.active ? 'opacity-60' : ''}>
                <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                  <button 
                    type="button" 
                    onClick={() => toggleRoleActive(role)} 
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" 
                    title={role.active ? 'Desactivar' : 'Activar'}
                  >
                    {role.active ? <span className="text-xs font-medium text-green-600">✓</span> : <span className="text-xs font-medium text-gray-400">✗</span>}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => openRoleEdit(role)} 
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteRole(role)} 
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
                <CardContent className="py-5">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: role.color + '20' }}
                    >
                      <div 
                        className="w-full h-full rounded-full flex items-center justify-center text-sm font-bold" 
                        style={{ color: role.color }}
                      >
                        {role.name[0]}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{role.name}</p>
                      {role.description && <p className="text-xs text-gray-400 truncate">{role.description}</p>}
                    </div>
                  </div>
                  {!role.active && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Badge variant="danger">Desactivado</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </>
    )}
  </div>

  // MODAL DE ROLES
  <Modal 
    open={showRoleModal} 
    onClose={() => { setShowRoleModal(false); setEditingRole(null); }} 
    title={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
  >
    <form onSubmit={handleRoleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Nombre <span className="text-red-500">*</span>
        </label>
        <Input 
          value={roleForm.name}
          onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
          placeholder="Ej: Dueña, CEO"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Descripción</label>
        <Input 
          value={roleForm.description}
          onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
          placeholder="Descripción breve"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Color</label>
        <div className="flex items-center gap-3">
          <input 
            type="color" 
            value={roleForm.color}
            onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
          />
          <Input 
            value={roleForm.color}
            onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
            placeholder="#6B7280"
            className="flex-1"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1" 
          onClick={() => { setShowRoleModal(false); setEditingRole(null); }}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {editingRole ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  </Modal>
*/
