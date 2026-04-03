// api/grecha.js
import fetch from 'node-fetch';

const BASE_URL = 'https://api.sendler.xyz/history/ft-transfers/';
const NFT_URL  = 'https://api.sendler.xyz/nft/by-owner-contract/';
const DEFAULT_LIMIT_FT = 200; // Для FT максимум 200
const DEFAULT_LIMIT_NFT = 5000; // Для NFT максимум 5000
const DEFAULT_SKIP  = 0;

const API_KEY = '';

export default async function handler(req, res) {
    const {
        wallet_id,
        symbol,
        owner_id,
        contract_address,
        limit,
        skip  = DEFAULT_SKIP
    } = req.query;

    const headers = {
        'accept': 'application/json',
        'X-API-Key': process.env.SENDLER_API_KEY || API_KEY
    };

    // 1) Проксирование запроса за NFT
    if (owner_id && contract_address) {
        const upstreamUrl = new URL(NFT_URL);
        upstreamUrl.searchParams.set('owner_id', owner_id);
        upstreamUrl.searchParams.set('contract_address', contract_address);
        // Если лимит не передан с фронта, ставим максимальный
        upstreamUrl.searchParams.set('limit', limit ? Number(limit) : DEFAULT_LIMIT_NFT);
        upstreamUrl.searchParams.set('skip', Number(skip));

        try {
            const upstream = await fetch(upstreamUrl.toString(), { headers });
            if (!upstream.ok) {
                const text = await upstream.text().catch(() => '');
                return res
                    .status(upstream.status)
                    .json({ error: `Upstream ${upstream.status}: ${text}` });
            }
            const json = await upstream.json();
            return res.status(200).json(json);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // 2) Старый функционал по FT-трансферам
    if (!wallet_id || !symbol) {
        return res
            .status(400)
            .json({ error: 'Parameters not set: wallet_id & symbol, or owner_id & contract_address' });
    }

    const transfersUrl = new URL(BASE_URL);
    transfersUrl.searchParams.set('wallet_id', wallet_id);
    transfersUrl.searchParams.set('direction', 'in');
    transfersUrl.searchParams.set('symbol', symbol);
    transfersUrl.searchParams.set('limit',  limit ? Number(limit) : DEFAULT_LIMIT_FT);
    transfersUrl.searchParams.set('skip',   Number(skip));

    try {
        const upstream = await fetch(transfersUrl.toString(), { headers });
        if (!upstream.ok) {
            const text = await upstream.text().catch(() => '');
            return res
                .status(upstream.status)
                .json({ error: `Upstream ${upstream.status}: ${text}` });
        }
        const json = await upstream.json();
        return res.status(200).json(json);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}