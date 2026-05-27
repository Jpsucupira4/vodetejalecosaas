import { type ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
}

export default function InputGroup({ label, children }: Props) {
  return (
    <div className="input-group">
      <label>{label}</label>
      {children}
    </div>
  );
}
