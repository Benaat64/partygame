import { useState } from 'react';
import { UserRound, BriefcaseBusiness } from 'lucide-react';

export default function PlayerPhoto({ player, className = '' }) {
  const [failed, setFailed] = useState([]);
  const urls = [
    ...new Set(
      [player?.cutoutUrl, player?.photoUrl, player?.portraitUrl].filter(
        Boolean,
      ),
    ),
  ];
  const src = urls.find((url) => !failed.includes(url));
  const Icon = player?.position === 'Coach' ? BriefcaseBusiness : UserRound;
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/5 ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-contain object-bottom"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed((previous) => [...previous, src])}
        />
      ) : (
        <Icon aria-hidden="true" className="h-1/2 w-1/2 text-primary/70" />
      )}
    </div>
  );
}
