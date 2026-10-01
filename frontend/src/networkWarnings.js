const NETWORK_WARNINGS = {
  usdt_trc20: 'Netzwerk: Tron (TRC-20). Sende nur USDT auf Tron – nicht ERC-20 oder BEP-20!',
  usdt_erc20: 'Netzwerk: Ethereum (ERC-20). Sende nur USDT auf Ethereum Mainnet.',
  usdt_polygon: 'Netzwerk: Polygon. Sende nur USDT auf Polygon.',
  usdc_polygon: 'Netzwerk: Polygon. Sende nur USDC auf Polygon – nicht Ethereum!',
  usdc_erc20: 'Netzwerk: Ethereum. Sende nur USDC auf Ethereum Mainnet.',
  usdc_base: 'Netzwerk: Base (L2). Sende nur USDC auf Base.',
  usdc_arbitrum: 'Netzwerk: Arbitrum. Sende nur USDC auf Arbitrum.',
  usdc_solana: 'Netzwerk: Solana. Sende nur USDC auf Solana.',
  eth_base: 'Netzwerk: Base (Layer 2). Nicht Ethereum Mainnet verwenden!',
  eth_arbitrum: 'Netzwerk: Arbitrum. Nicht Ethereum Mainnet verwenden!',
  lightning: 'Lightning-Rechnung (BOLT11) – kein On-Chain-Bitcoin senden.',
  bitcoin: 'On-Chain Bitcoin. Bestätigung dauert ca. 10–60 Minuten.',
  solana: 'Netzwerk: Solana. Sende nur SOL – keine SPL-Token an diese Adresse.',
};

export function getNetworkWarning(method) {
  return NETWORK_WARNINGS[method] || null;
}

export function renderNetworkWarning(method) {
  const warn = getNetworkWarning(method);
  if (!warn) return '';
  return `
    <div class="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <strong>Wichtig:</strong> ${warn}
    </div>`;
}
