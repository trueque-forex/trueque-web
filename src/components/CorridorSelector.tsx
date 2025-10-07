export default function CorridorSelector({
  onSelect,
  debug = false
}: {
  onSelect: (value: string) => void;
  debug?: boolean;
}) {
  const corridors = [
    { label: 'Brazil ↔ Portugal', value: 'BR-PT', model: 'OM' },
    { label: 'Argentina ↔ Spain', value: 'AR-ES', model: 'OM' },
    { label: 'Brazil ↔ Spain', value: 'BR-ES', model: 'OM' },
    { label: 'Mexico ↔ Spain', value: 'MX-ES', model: 'OM' },
    { label: 'Colombia ↔ Spain', value: 'CO-ES', model: 'OM' },
    { label: 'Guatemala ↔ Mexico', value: 'GT-MX', model: 'TBM' },
    { label: 'Bolivia ↔ Spain', value: 'BO-ES', model: 'OM' },
    { label: 'El Salvador ↔ Guatemala', value: 'SV-GT', model: 'TBM' },
    { label: 'Peru ↔ Spain', value: 'PE-ES', model: 'OM' },
    { label: 'Colombia ↔ Ecuador', value: 'CO-EC', model: 'TBM' },
    { label: 'Colombia ↔ Venezuela', value: 'CO-VE', model: 'TBM' }
  ];

  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Corridor
      </label>
      <select
        className="border rounded px-3 py-2 w-full"
        onChange={(e) => {
          const selected = corridors.find(c => c.value === e.target.value);
          if (debug && selected) {
            console.log('Selected corridor:', selected.value);
            console.log('Execution model:', selected.model);
          }
          onSelect(e.target.value);
        }}
      >
        <option value="">Choose a corridor</option>
        {corridors.map(c => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}