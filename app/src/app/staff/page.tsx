'use client';

import { useEffect, useState } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff } from '@/lib/db/queries';
import type { StaffMember, StaffMemberInsert, ServiceCategory, StaffRole } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { STAFF_ROLE_LABELS, SERVICE_CATEGORY_LABELS } from '@/types/database';
import { UserRound, Plus, Search, Phone, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffPage() {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<StaffMemberInsert>({
    name: '', phone: '', role: 'nail_artist', specialties: [], commission_pct: 0, schedule: '', photo_url: null, active: true, last_commission_paid: null,
  });
  const [specialtySelections, setSpecialtySelections] = useState<ServiceCategory[]>([]);

  async function load() {
    try {
      const data = await getStaff(true);
      setMembers(data as unknown as StaffMember[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      if (editingMember) {
        await updateStaff(editingMember.id, { ...form, specialties: specialtySelections });
        toast.success('Miembro actualizado');
      } else {
        await createStaff({ ...form, specialties: specialtySelections });
        toast.success('Miembro del staff creado');
      }
      setShowModal(false);
      setEditingMember(null);
      setForm({ name: '', phone: '', role: 'nail_artist', specialties: [], commission_pct: 0, schedule: '', photo_url: null, active: true, last_commission_paid: null });
      setSpecialtySelections([]);
      load();
    } catch (e) {
      toast.error(editingMember ? 'Error al actualizar' : 'Error al crear');
    }
  }

  function openEdit(member: StaffMember) {
    setEditingMember(member);
    setForm({
      name: member.name,
      phone: member.phone || '',
      role: member.role,
      specialties: member.specialties || [],
      commission_pct: member.commission_pct,
      schedule: member.schedule || '',
      photo_url: member.photo_url,
      active: member.active,
      last_commission_paid: member.last_commission_paid,
    });
    setSpecialtySelections(member.specialties || []);
    setShowModal(true);
  }

  function openNew() {
    setEditingMember(null);
    setForm({ name: '', phone: '', role: 'nail_artist', specialties: [], commission_pct: 0, schedule: '', photo_url: null, active: true, last_commission_paid: null });
    setSpecialtySelections([]);
    setShowModal(true);
  }

  async function toggleActive(member: StaffMember) {
    if (!confirm(`¿Eliminar a ${member.name}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteStaff(member.id);
      toast.success('Staff eliminado');
      load();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  }

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.phone || '').includes(search) ||
    STAFF_ROLE_LABELS[m.role].toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header title="Staff / Artists" action={
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o rol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <UserRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay miembros del staff {search ? 'que coincidan' : 'registrados'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((member) => (
              <Card key={member.id} className={`relative ${!member.active ? 'opacity-60' : ''}`}>
                <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                  <button
                    type="button"
                    onClick={() => toggleActive(member)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(member)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                <CardContent className="py-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 font-bold text-lg flex-shrink-0">
                      {member.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="font-semibold">{member.name}</p>
                      <Badge variant="purple" className="mt-1">{STAFF_ROLE_LABELS[member.role]}</Badge>
                      {member.phone && (
                        <p className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                          <Phone className="w-3 h-3" />{member.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {member.specialties && member.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {member.specialties.map((spec, i) => (
                        <Badge key={i} variant="default" className="text-[10px]">
                          {SERVICE_CATEGORY_LABELS[spec]}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {member.staff_stats && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span>{member.staff_stats.total_appointments} citas</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />{formatCurrency(member.staff_stats.total_revenue)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">Comisión: {member.commission_pct}%</span>
                    {!member.active && <Badge variant="danger">Inactivo</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingMember(null); }} title={editingMember ? 'Editar Miembro' : 'Nuevo Miembro del Staff'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" />
          <Input label="Teléfono" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+51 ..." />
          <Select label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })} options={
            Object.entries(STAFF_ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))
          } />
          <Input label="Comisión (%)" type="number" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: parseFloat(e.target.value) || 0 })} />
          <Textarea label="Horario" value={form.schedule || ''} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Ej: Lun-Sáb 9:00-18:00" />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Especialidades</label>
            <div className="space-y-1.5">
              {Object.entries(SERVICE_CATEGORY_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={specialtySelections.includes(value as ServiceCategory)}
                    onChange={(e) => {
                      setSpecialtySelections(e.target.checked
                        ? [...specialtySelections, value as ServiceCategory]
                        : specialtySelections.filter(s => s !== value)
                      );
                    }}
                    className="rounded border-gray-300 text-salon-600 focus:ring-salon-500"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingMember(null); }}>Cancelar</Button>
            <Button type="submit" className="flex-1">{editingMember ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
