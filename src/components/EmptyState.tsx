interface Props { msg: string }

export default function EmptyState({ msg }: Props) {
  return (
    <div className="empty-state">
      <p>{msg}</p>
    </div>
  );
}
