type Props = {
  num: number;
  title: string;
  children: React.ReactNode;
};

// Paso numerado usado por las páginas de guía.
export function GuideStep({ num, title, children }: Props) {
  return (
    <div className="guide-step">
      <span className="step-num">{num}</span>
      <div className="step-body">
        <h4>{title}</h4>
        {children}
      </div>
    </div>
  );
}
