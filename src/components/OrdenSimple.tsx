'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type Option = { value: string; label: string };

export default function OrdenSimple({
  paramName = 'orden',
  options,
  initialValue,
  className,
}: {
  paramName?: string;
  options: Option[];
  initialValue?: string;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = initialValue || searchParams?.get(paramName) || options[0]?.value || '';

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams?.toString() || '');
    const val = e.target.value;
    if (val) params.set(paramName, val);
    else params.delete(paramName);
    params.delete('page');
    router.push(`?${params.toString()}`);
  }

  return (
    <select className={className} defaultValue={current} onChange={onChange}>
      {options.map((op) => (
        <option key={op.value} value={op.value}>
          {op.label}
        </option>
      ))}
    </select>
  );
}
