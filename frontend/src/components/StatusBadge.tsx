interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}

const StatusBadge = ({ status, variant = "neutral" }: StatusBadgeProps) => {
  return <span className={`status-badge status-badge-${variant}`}>{status}</span>;
};

export default StatusBadge;
