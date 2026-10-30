export default function CampoNumeroCompra({
  titulo,
  value,
  onChange,
  placeholder,
  sufixo = null,
  disabled = false,
}) {
  return (
    <label className="compra-futura-modal-campo">
      <span>{titulo}</span>

      {sufixo ? (
        <div className="compra-futura-modal-numero">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />

          <span>{sufixo}</span>
        </div>
      ) : (
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </label>
  );
}
