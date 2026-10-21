import { Button } from '@casino/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@casino/ui/components/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@casino/ui/components/item';
import { useClientState, useSendCommand } from './GameContext.tsx';

export function InventoryPanel() {
  const { welcome, state } = useClientState();
  const send = useSendCommand();
  const self = state?.self;
  if (!welcome || !self) return null;
  return (
    <Card size="sm" data-testid="inventory-panel">
      <CardHeader>
        <CardTitle>
          <h2>Inventory</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {self.inventory.length === 0 ? (
          <p className="text-muted-foreground">Empty. Lucky items are sold at the shop counter.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {self.inventory.map((owned) => {
              const item = welcome.items.find((candidate) => candidate.id === owned.itemId);
              const game = welcome.games.find((candidate) => candidate.id === owned.gameId);
              return (
                <Item key={owned.instanceId} render={<li />} variant="outline" size="sm">
                  <ItemContent>
                    <ItemTitle>{item?.name ?? owned.itemId}</ItemTitle>
                    <ItemDescription>
                      {game?.name} · {owned.usesLeft} uses left
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant={owned.active ? 'default' : 'outline'}
                      size="sm"
                      aria-pressed={owned.active}
                      disabled={self.autoPlay}
                      onClick={() => send({ type: 'toggleItem', instanceId: owned.instanceId })}
                    >
                      {owned.active ? 'Active' : 'Use'}
                    </Button>
                  </ItemActions>
                </Item>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
