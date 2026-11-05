import "./Spinner.css";

/** Anel girando que indica carregamento. */
export default function Spinner({ className = "" }) {
  return <span className={`spinner ${className}`.trim()} aria-hidden="true" />;
}
