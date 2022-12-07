import { getPages } from '../../utils';

import type { Pages } from '../../utils';
import type { NextApiHandler } from 'next';

const handler: NextApiHandler<Pages> = async (req, res) => {
    if (req.method !== 'GET') return;

    const data = await getPages();

    res.json(data);
};

export default handler;
