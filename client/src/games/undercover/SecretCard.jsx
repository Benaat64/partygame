import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
const roles = { civil: 'Civil', undercover: 'Undercover' };
const button = 'min-h-12 rounded-xl px-4 py-3 font-semibold';
export default function SecretCard({ revealed, secret, onToggle }) {
  return (
    <div className="secret-envelope my-5">
      {revealed && secret && (
        <div className="secret-reveal mb-4">
          <p className="eyebrow text-primary">{roles[secret.role]}</p>
          <p className="mt-3 break-words text-4xl font-black">{secret.word}</p>
        </div>
      )}
      <Button
        className={button}
        disabled={!secret}
        onClick={onToggle}
        aria-pressed={revealed}
      >
        {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        {revealed ? 'Masquer ma carte' : 'Révéler ma carte'}
      </Button>
    </div>
  );
}
