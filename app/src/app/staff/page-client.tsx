'use client';

import { useEffect, useState, useRef, useReducer, useCallback, lazy, Suspense } from 'react';
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getRoles,
  getCategories,
  getServices,
  updateStaffSpecialties,
  getCommissionOverrides,
  upsertCommissionOverride,
  deleteCommissionOverride,
} from '@/lib/db/queries';
import type { Role, Category, Service } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { normalizePeruPhone, formatPeruPhoneForInput } from '@/lib/utils';
import { useConfirm } from '@/context/confirm-context';

import type { StaffModalTab, StaffWithDetails, StaffFormState, FormAction } from '@/components/staff/types';
import { FORM_INIT, formReducer, isOwnerMember, isOwnerRoleName } from '@/components/staff/types';
import { StaffFilters } from '@/components/staff/StaffFilters';
import { StaffListContent } from '@/components/staff/StaffListContent';

const StaffFormModal = lazy(() =>
  import('@/components/staff/StaffFormModal').then(m => ({ default: m.StaffFormModal }))
);

interface DataState {
  members: StaffWithDetails[];
  roles: Role[];
  categories: Category[];
  services: Service[];
  loading: boolean;
}

const DATA_INIT: DataState = {
  members: [], roles: [], categories: [], services: [], loading: true,
};

function dataReducer(state: DataState, action: Partial<DataState>): DataState {
  return { ...state, ...action };
}

interface UIState {
  submitting: boolean;
  deletingId: string | null;
  showModal: boolean;
  editingMember: StaffWithDetails | null;
  search: string;
  activeTab: StaffModalTab;
  specialtySelections: string[];
  overrides: Record<string, number | null>;
}

const UI_INIT: UIState = {
  submitting: false, deletingId: null, showModal: false,
  editingMember: null, search: '', activeTab: 'basicos',
  specialtySelections: [], overrides: {},
};

function uiReducer(state: UIState, action: Partial<UIState>): UIState {
  return { ...state, ...action };
}

export default function StaffPage({ initialData }: {
  initialData?: { members: StaffWithDetails[]; roles: Role[]; categories: Category[]; services: Service[] };
}) {
  const { confirm } = useConfirm();
  const [data, dispatchData] = useReducer(
    dataReducer,
    initialData ? { ...initialData, loading: false } : DATA_INIT,
  );
  const [ui, dispatchUI] = useReducer(uiReducer, UI_INIT);
  const [form, dispatch] = useReducer(formReducer, FORM_INIT);
  const [initialForm, setInitialForm] = useState<StaffFormState>(FORM_INIT);
  const [initialSpecialties, setInitialSpecialties] = useState<string[]>([]);
  const [initialOverrides, setInitialOverrides] = useState<Record<string, number | null>>({});
  const skipInitialLoad = useRef(!!initialData);

  const load = useCallback(async () => {
    try {
      const [staffData, rolesData, categoriesData, servicesData] = await Promise.all([
        getStaff(false),
        getRoles(false),
        getCategories(true),
        getServices(true),
      ]);
      dispatchData({
        members: staffData as StaffWithDetails[],
        roles: rolesData as Role[],
        categories: categoriesData as Category[],
        services: servicesData as Service[],
        loading: false,
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSearchChange = useCallback((v: string) => dispatchUI({ search: v }), []);

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      return;
    }
    load();
  }, [load]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = setInterval(load, 60000);

    function handleVisibility() {
      if (document.hidden && interval) {
        clearInterval(interval);
        interval = null;
      } else if (!document.hidden && !interval) {
        interval = setInterval(load, 60000);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [load]);

  // Prefetch modal chunk after page load
  useEffect(() => {
    const id = setTimeout(() => {
      import('@/components/staff/StaffFormModal');
    }, 500);
    return () => clearTimeout(id);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (ui.submitting) return;
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!form.role_id) { toast.error('Selecciona un rol'); return; }
    if (form.commission_pct < 0 || form.commission_pct > 100) { toast.error('La comisión debe estar entre 0% y 100%'); return; }
    if (form.phone && form.phone.replace(/\s/g, '').length < 9) { toast.error('Teléfono inválido — debe tener al menos 9 dígitos'); return; }

    const normalizedPhone = normalizePeruPhone(form.phone);
    const formToSave = { ...form, phone: normalizedPhone };

    dispatchUI({ submitting: true });
    try {
      let staffId: string;

      if (ui.editingMember) {
        staffId = ui.editingMember.id;
        let formToSaveProtected = { ...formToSave };
        if (isOwnerMember(ui.editingMember)) {
          formToSaveProtected = {
            ...formToSaveProtected,
            role_id: ui.editingMember.role_id,
            active: true,
          };
        }
        await updateStaff(staffId, formToSaveProtected);
        await updateStaffSpecialties(staffId, ui.specialtySelections);
      } else {
        const formToCreate = { ...formToSave, active: true };
        const newMember = await createStaff(formToCreate);
        if (!newMember?.id) {
          toast.error('Error al crear miembro');
          return;
        }
        staffId = newMember.id;
        if (ui.specialtySelections.length > 0) {
          await updateStaffSpecialties(staffId, ui.specialtySelections);
        }
      }

      await Promise.all(
        Object.entries(ui.overrides).map(([serviceId, fixedAmount]) =>
          fixedAmount !== null && fixedAmount >= 0
            ? upsertCommissionOverride({ staff_id: staffId, service_id: serviceId, founder_fixed_amount: fixedAmount })
            : deleteCommissionOverride(staffId, serviceId)
        ),
      );

      toast.success(ui.editingMember ? 'Miembro actualizado' : 'Miembro del staff creado');
      dispatchUI({ showModal: false, editingMember: null });
      load();
    } catch {
      toast.error(ui.editingMember ? 'Error al actualizar' : 'Error al crear');
    } finally {
      dispatchUI({ submitting: false });
    }
  }, [ui.submitting, ui.editingMember, ui.specialtySelections, ui.overrides, form, load]);

  const openEdit = useCallback(async (member: StaffWithDetails) => {
    const newForm = {
      name: member.name,
      phone: formatPeruPhoneForInput(member.phone),
      role_id: member.role_id,
      commission_pct: member.commission_pct,
      schedule: member.schedule || '',
      photo_url: member.photo_url,
      active: member.active,
      last_commission_paid: member.last_commission_paid,
      birthday_date: member.birthday_date || null,
    };

    dispatch({ type: 'SET', payload: newForm });

    const currentSpecIds = member.staff_specialties?.map(s => s.category_id) || [];
    const overridesData = await getCommissionOverrides(member.id);
    const map: Record<string, number | null> = {};
    for (const o of overridesData) {
      if (o.service_id) map[o.service_id] = o.founder_fixed_amount;
    }

    setInitialForm({ ...newForm });
    setInitialSpecialties([...currentSpecIds]);
    setInitialOverrides({ ...map });

    dispatchUI({
      editingMember: member,
      specialtySelections: currentSpecIds,
      overrides: map,
      activeTab: 'basicos',
      showModal: true,
    });
  }, []);

  const openNew = useCallback(() => {
    const activeRoles = data.roles.filter(r => r.active && !isOwnerRoleName(r.name));
    const firstRole = activeRoles[0];
    const emptyForm = { ...FORM_INIT, role_id: firstRole?.id || '' };

    dispatch({ type: 'SET', payload: emptyForm });
    setInitialForm(emptyForm);
    setInitialSpecialties([]);
    setInitialOverrides({});

    dispatchUI({
      editingMember: null,
      specialtySelections: [],
      overrides: {},
      activeTab: 'basicos',
      showModal: true,
    });
  }, [data.roles]);

  const handleDelete = useCallback(async (member: StaffWithDetails) => {
    if (isOwnerMember(member)) {
      toast.error('No se puede eliminar a la Dueña');
      return;
    }
    if (ui.deletingId) return;

    const confirmed = await confirm({
      title: 'Eliminar miembro',
      message: `¿Eliminar a ${member.name}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmed) return;

    dispatchUI({ deletingId: member.id });
    try {
      await deleteStaff(member.id);
      toast.success('Staff eliminado');
      load();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      dispatchUI({ deletingId: null });
    }
  }, [ui.deletingId, confirm, load]);

  const filtered = data.members.filter((m) => {
    const s = ui.search.toLowerCase();
    return m.name.toLowerCase().includes(s) ||
      (m.phone || '').includes(s) ||
      m.role?.name.toLowerCase().includes(s);
  });

  return (
    <>
      <Header title="Staff / Artists" action={
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4 mr-1" /> Nuevo
        </Button>
      } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
        <StaffFilters search={ui.search} onSearchChange={handleSearchChange} />
        <StaffListContent
          loading={data.loading}
          members={filtered}
          search={ui.search}
          onEdit={openEdit}
          onNew={openNew}
        />
      </div>

      <Suspense fallback={null}>
        <StaffFormModal
          open={ui.showModal}
        onClose={() => dispatchUI({ showModal: false, editingMember: null })}
        editingMember={ui.editingMember}
        form={form}
        dispatch={dispatch}
        roles={data.roles}
        categories={data.categories}
        services={data.services}
        specialtySelections={ui.specialtySelections}
        setSpecialtySelections={(v) => dispatchUI({
          specialtySelections: typeof v === 'function' ? v(ui.specialtySelections) : v,
        })}
        overrides={ui.overrides}
        setOverrides={(v) => dispatchUI({
          overrides: typeof v === 'function' ? v(ui.overrides) : v,
        })}
        submitting={ui.submitting}
        deletingId={ui.deletingId}
        activeTab={ui.activeTab}
        setActiveTab={(v) => dispatchUI({
          activeTab: typeof v === 'function' ? v(ui.activeTab) : v,
        })}
        initialForm={initialForm}
        initialSpecialties={initialSpecialties}
        initialOverrides={initialOverrides}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        isOwner={isOwnerMember}
      />
      </Suspense>
    </>
  );
}
