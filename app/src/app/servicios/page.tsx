'use client';

import { useEffect, useState } from 'react';
import { getServices, createService, updateService, deleteService } from '@/lib/db/queries';
import type { Service, ServiceInsert, ServiceCategory } from '@/types/database';
import { Header } from '@/components/layout/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { SERVICE_CATEGORY_LABELS } from '@/types/database';
import { Palette, Plus, Search, Clock, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const categoryColors: Record<string, 'purple' | 'info' | 'pink' | 'warning' | 'success'> = {
  sistema_unas: 'purple',
  pedicura: 'info',
  makeup: 'pink',
  pestanas: 'warning',
  cejas: 'success',
};

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ServiceInsert>({
    name: '', category: 'sistema_unas', duration_min: 30, price: 0, description: '', image_url: null, active: true,
  });

  async function load() {
    try {
      const data = await getServices(true);
      setServices(data as Service[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.price <= 0) {
      toast.error('Nombre y precio son obligatorios');
      return;
    }
    try {
      if (editingService) {
        await updateService(editingService.id, form);
        toast.success('Servicio actualizado');
      } else {
        await createService(form);
        toast.success('Servicio creado');
      }
      setShowModal(false);
      setEditingService(null);
      setForm({ name: '', category: 'sistema_unas', duration_min: 30, price: 0, description: '', image_url: null, active: true });
      load();
    } catch (e) {
      toast.error(editingService ? 'Error al actualizar' : 'Error al crear');
    }
  }

  function openEdit(svc: Service) {
    setEditingService(svc);
    setForm({
      name: svc.name,
      category: svc.category,
      duration_min: svc.duration_min,
      price: Number(svc.price),
      description: svc.description || '',
      image_url: svc.image_url,
      active: svc.active,
    });
    setShowModal(true);
  }

  function openNew() {
    setEditingService(null);
    setForm({ name: '', category: 'sistema_unas', duration_min: 30, price: 0, description: '', image_url: null, active: true });
    setShowModal(true);
  }

  async function toggleActive(svc: Service) {
    if (!confirm(`¿Eliminar "${svc.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteService(svc.id);
      toast.success('Servicio eliminado');
      load();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  }

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    SERVICE_CATEGORY_LABELS[s.category].toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, svc) => {
    const cat = SERVICE_CATEGORY_LABELS[svc.category];
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <>
      <Header title="Servicios" action={
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      } />

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-salon-500"
          />
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{filtered.length} servicios</span>
          <span>·</span>
          <span>{services.filter(s => s.active).length} activos</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <Palette className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay servicios {search ? 'que coincidan' : 'registrados'}</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([category, svcs]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Badge variant={categoryColors[category]}>{category}</Badge>
                <span className="text-xs text-gray-400">({svcs.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {svcs.map((svc) => (
                  <Card key={svc.id} className={`hover:shadow-md transition-all ${!svc.active ? 'opacity-60' : ''}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{svc.name}</p>
                          {svc.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{svc.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => openEdit(svc)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(svc)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{svc.duration_min} min</span>
                        <span className="flex items-center gap-1 font-semibold text-salon-600"><DollarSign className="w-4 h-4" />{formatCurrency(svc.price)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingService(null); }} title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Manicure semipermanente" />
          <Select label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })} options={
            Object.entries(SERVICE_CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))
          } />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duración (min) *" type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) || 0 })} />
            <Input label="Precio (S/) *" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
          </div>
          <Textarea label="Descripción" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción del servicio..." />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditingService(null); }}>Cancelar</Button>
            <Button type="submit" className="flex-1">{editingService ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
