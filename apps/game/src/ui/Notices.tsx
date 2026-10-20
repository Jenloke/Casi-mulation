import { useClientState } from './GameContext.tsx';

/** Short-lived messages for commands the server turned down. */
export function Notices() {
  const { notices } = useClientState();
  return (
    <div className="notices" aria-live="polite">
      {notices.map((notice) => (
        <p key={notice.id} className="notice">
          {notice.text}
        </p>
      ))}
    </div>
  );
}
