

interface Props {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, message, icon, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-secondary-200 bg-white p-8 text-center">
      {icon ? <div className="mb-3 text-3xl">{icon}</div> : null}
      <h3 className="text-base font-semibold text-secondary-900">{title}</h3>
      {message ? <p className="mt-1 max-w-sm text-sm text-secondary-500">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
