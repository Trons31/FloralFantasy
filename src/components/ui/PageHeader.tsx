interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

/** Titulo de cada pagina del panel, igual que en CliqCut. */
export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 mt-2 block min-w-0 items-start justify-between gap-4 md:mt-0 md:flex">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-0.5 break-words text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action && <div className="mt-4 flex shrink-0 flex-wrap justify-end gap-2 md:mt-0">{action}</div>}
    </div>
  );
}
