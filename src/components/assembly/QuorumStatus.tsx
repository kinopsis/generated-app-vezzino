import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
interface QuorumStatusProps {
  presentCoefficient: number;
  totalCoefficient: number;
  quorumRequired: number; // e.g., 0.5 for 50%
}
export function QuorumStatus({ presentCoefficient, totalCoefficient, quorumRequired }: QuorumStatusProps) {
  const quorumPercentage = totalCoefficient > 0 ? (presentCoefficient / totalCoefficient) * 100 : 0;
  const isQuorumMet = quorumPercentage >= quorumRequired * 100;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quorum Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-baseline mb-1">
          <span className={`text-2xl font-bold ${isQuorumMet ? 'text-green-600' : 'text-blue-600'}`}>
            {quorumPercentage.toFixed(2)}%
          </span>
          <span className="text-sm text-muted-foreground">Required: {(quorumRequired * 100).toFixed(0)}%</span>
        </div>
        <Progress value={quorumPercentage} className="w-full" />
        <div className="text-xs text-muted-foreground mt-2 text-center">
          {presentCoefficient.toFixed(2)} / {totalCoefficient.toFixed(2)} total coefficients present
        </div>
      </CardContent>
    </Card>);
}