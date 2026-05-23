// src/components/AdminFilters.jsx
export default function AdminFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  placeholder = "Buscar...",
}) {
  return (
    <div className="admin-filters">
      <div className="admin-filter-search">
        <label>Buscar</label>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>

      <div className="admin-filter-status">
        <label>Estado</label>
        <select value={status} onChange={(e) => onStatusChange(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="visibles">Visibles</option>
          <option value="ocultos">Ocultos</option>
        </select>
      </div>
    </div>
  );
}