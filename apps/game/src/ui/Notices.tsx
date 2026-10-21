import { Alert, AlertDescription } from '@casino/ui/components/alert';
import { CircleAlertIcon } from 'lucide-react';
import { useClientState } from './GameContext.tsx';

/** Short-lived messages for commands the server turned down; each Alert announces itself. */
export function Notices() {
  const { notices } = useClientState();
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col gap-1.5">
      {notices.map((notice) => (
        <Alert
          key={notice.id}
          variant="destructive"
          className="border-destructive/40 bg-card/95 shadow-md backdrop-blur-sm"
        >
          <CircleAlertIcon />
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
