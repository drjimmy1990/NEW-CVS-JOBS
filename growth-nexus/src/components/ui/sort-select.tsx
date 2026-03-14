'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface SortSelectProps {
    defaultValue?: string;
}

export function SortSelect({ defaultValue = '' }: SortSelectProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams.toString());
        const val = e.target.value;
        if (val) {
            params.set('sort', val);
        } else {
            params.delete('sort');
        }
        router.push(`?${params.toString()}`);
    };

    return (
        <select
            value={defaultValue}
            onChange={handleChange}
            className="bg-transparent text-cream border-b border-gold/20 focus:outline-none focus:border-gold pb-1"
        >
            <option value="" className="bg-navy">الأكثر صلة</option>
            <option value="newest" className="bg-navy">الأحدث</option>
        </select>
    );
}
