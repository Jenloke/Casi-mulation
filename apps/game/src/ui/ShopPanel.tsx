import { Button } from '@casino/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@casino/ui/components/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@casino/ui/components/item';
import { CoinsIcon } from 'lucide-react';
import { percent } from './format.ts';
import { useClientState, useSendCommand } from './GameContext.tsx';

export function ShopPanel() {
  const { welcome, state } = useClientState();
  const send = useSendCommand();
  const self = state?.self;
  if (!welcome || !self?.atShop) return null;
  const gameName = (gameId: string) => welcome.games.find((game) => game.id === gameId)?.name;
  return (
    <Card size="sm" data-testid="shop-panel">
      <CardHeader>
        <CardTitle>
          <h2>Shop</h2>
        </CardTitle>
        <CardDescription>Each item lifts one game's odds for a few rounds.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {welcome.items.map((item) => (
            <Item key={item.id} render={<li />} variant="outline" size="sm">
              <ItemContent>
                <ItemTitle>{item.name}</ItemTitle>
                <ItemDescription>
                  {gameName(item.gameId)} · +{percent(item.boost, 0)} luck · {item.uses} uses
                </ItemDescription>
                <ItemDescription className="line-clamp-none">{item.description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Buy ${item.name} for ${item.price} chips`}
                  disabled={self.autoPlay || self.chips < item.price}
                  onClick={() => send({ type: 'buyItem', itemId: item.id })}
                >
                  Buy
                  <CoinsIcon data-icon="inline-end" className="text-primary" />
                  <span className="tabular-nums">{item.price}</span>
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
