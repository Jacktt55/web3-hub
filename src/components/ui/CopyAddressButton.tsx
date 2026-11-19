import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { shortenAddress } from '../../lib/format';

interface CopyAddressButtonProps {
  address: string;
  /** Show the shortened address text next to the icon. */
  showText?: boolean;
}

/** Copies an address to the clipboard; icon flips to a check on success. */
export default function CopyAddressButton({
  address,
  showText = true,
}: CopyAddressButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = address;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={() => void copy()}
      title={copied ? 'Disalin!' : 'Salin alamat'}
      aria-label="Salin alamat wallet"
      className="flex min-h-0 items-center gap-1.5 rounded-lg px-1.5 py-1 font-mono text-xs font-medium text-ink transition-colors hover:text-accent-2"
    >
      {showText && <span>{shortenAddress(address)}</span>}
      {copied ? (
        <Check className="h-3.5 w-3.5 text-profit" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted" />
      )}
    </button>
  );
}
