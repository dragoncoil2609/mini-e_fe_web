type LoadingProps = {
  text?: string;
  className?: string;
};

export default function Loading({
  text = 'Đang tải dữ liệu...',
  className = '',
}: LoadingProps) {
  return (
    <div className={`mochi-loading ${className}`}>
      <span className="mochi-loading-spinner" />
      <p>{text}</p>
    </div>
  );
}