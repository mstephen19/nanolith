import { Menu } from 'antd';
import { useState, useEffect } from 'react';

import type { Pages } from '../utils';

export const Nav = () => {
    const [pages, setPages] = useState<Pages>([]);

    useEffect(() => {
        (async () => {
            const res = await fetch('/api/pages');

            setPages(await res.json());
        })();
    }, []);

    return (
        <div>
            <Menu
                items={pages.map((page) => {
                    return { label: page.data.title, key: page.data.slug };
                })}
            />
        </div>
    );
};
