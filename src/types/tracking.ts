
export interface TrackingConfiguration {
  id: string;
  name: string;
  itemType: string;
  refreshInterval: number;
  enabled: boolean;
  stats: Record<string, number>;
}
