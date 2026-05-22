import type { ReactNode } from 'react';

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title = 'Không có dữ liệu',
  description = 'Hiện chưa có nội dung để hiển thị.',
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`mochi-empty ${className}`}>
      <h3 className="mochi-empty-title">{title}</h3>
      <p className="mochi-empty-desc">{description}</p>
      {action ? <div style={{ marginTop: 18 }}>{action}</div> : null}
    </div>
  );
}