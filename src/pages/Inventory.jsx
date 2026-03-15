import { useState, useEffect } from 'react'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  X,
  Edit2,
  Trash2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Inventory() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    stock_actual: 0,
    stock_minimo: 5,
    unidad: 'unidades'
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('inventario')
          .update({
            ...formData,
            actualizado_por: profile.id,
            ultima_actualizacion: new Date().toISOString()
          })
          .eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('inventario')
          .insert([{
            ...formData,
            actualizado_por: profile.id
          }])
        if (error) throw error
      }
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({ nombre: '', categoria: '', stock_actual: 0, stock_minimo: 5, unidad: 'unidades' })
      fetchInventory()
    } catch (error) {
      console.error('Error saving item:', error)
    }
  }

  const handleUpdateStock = async (id, current, delta) => {
    try {
      const { error } = await supabase
        .from('inventario')
        .update({ 
          stock_actual: Math.max(0, current + delta),
          ultima_actualizacion: new Date().toISOString(),
          actualizado_por: profile.id
        })
        .eq('id', id)
      if (error) throw error
      fetchInventory()
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este artículo?')) return
    try {
      const { error } = await supabase.from('inventario').delete().eq('id', id)
      if (error) throw error
      fetchInventory()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    if (filter === 'low') return matchesSearch && item.stock_actual <= item.stock_minimo
    return matchesSearch
  })

  const categories = [...new Set(items.map(i => i.categoria))]

  return (
    <div className="inventory-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario y Suministros</h1>
          <p className="page-subtitle">Control de stock de artículos operativos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Añadir Artículo</span>
        </button>
      </div>

      <div className="inventory-toolbar glass-card mb-lg px-lg py-md flex justify-between items-center gap-md">
        <div className="search-bar relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            className="input pl-10" 
            placeholder="Buscar por nombre o categoría..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-sm">
          <button 
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button 
            className={`btn btn-sm ${filter === 'low' ? 'btn-danger' : 'btn-ghost'}`}
            onClick={() => setFilter('low')}
          >
            Stock Bajo
          </button>
          <button className="btn btn-ghost btn-sm" onClick={fetchInventory}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="inventory-grid">
        {filteredItems.map(item => (
          <div key={item.id} className={`inventory-card glass-card ${item.stock_actual <= item.stock_minimo ? 'border-danger/30' : ''}`}>
            <div className="flex justify-between items-start mb-md">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted font-bold mb-xs">{item.categoria}</span>
                <h3 className="font-semibold text-lg">{item.nombre}</h3>
              </div>
              <div className="flex gap-xs">
                <button className="btn-icon btn-ghost btn-xs" onClick={() => {
                  setEditingItem(item)
                  setFormData({ ...item })
                  setIsModalOpen(true)
                }}><Edit2 size={14} /></button>
                <button className="btn-icon btn-ghost btn-xs text-danger" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="stock-display flex items-center justify-between p-md glass rounded-xl mb-lg">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted uppercase font-bold">En Stock</span>
                <div className="flex items-baseline gap-xs">
                  <span className={`text-2xl font-black ${item.stock_actual <= item.stock_minimo ? 'text-danger' : 'text-primary'}`}>
                    {item.stock_actual}
                  </span>
                  <span className="text-xs text-muted">{item.unidad}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted uppercase font-bold">Mínimo</span>
                <span className="text-sm font-semibold">{item.stock_minimo} {item.unidad}</span>
              </div>
            </div>

            <div className="card-footer flex justify-between items-center">
              <div className="flex gap-xs">
                <button className="btn-icon btn-secondary h-8 w-8" onClick={() => handleUpdateStock(item.id, item.stock_actual, -1)}>
                  <ArrowDownRight size={16} />
                </button>
                <button className="btn-icon btn-secondary h-8 w-8" onClick={() => handleUpdateStock(item.id, item.stock_actual, 1)}>
                  <ArrowUpRight size={16} />
                </button>
              </div>
              {item.stock_actual <= item.stock_minimo && (
                <div className="flex items-center gap-xs text-danger animate-pulse">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-bold uppercase">Reposición</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
              <button className="btn-icon btn-ghost" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-cols-2 gap-md">
                  <div className="input-group col-span-2">
                    <label className="input-label">Nombre del artículo</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={formData.nombre}
                      onChange={e => setFormData({...formData, nombre: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Categoría</label>
                    <input 
                      type="text" 
                      className="input" 
                      list="categories"
                      value={formData.categoria}
                      onChange={e => setFormData({...formData, categoria: e.target.value})}
                      required 
                    />
                    <datalist id="categories">
                      {categories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Unidad (ej. bolsas, litros)</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={formData.unidad}
                      onChange={e => setFormData({...formData, unidad: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Stock Actual</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={formData.stock_actual}
                      onChange={e => setFormData({...formData, stock_actual: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Stock Mínimo</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={formData.stock_minimo}
                      onChange={e => setFormData({...formData, stock_minimo: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Guardar Cambios' : 'Crear Artículo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .inventory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--spacing-lg);
        }
        .inventory-card {
          padding: var(--spacing-lg);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .inventory-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.3);
        }
        .stock-display {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: var(--spacing-md); }
        .text-primary { color: var(--color-accent); }
      `}</style>
    </div>
  )
}
