import { TokenId } from '../types/Game';

interface CollectedTokensProps {
  tokenIds: TokenId[];
}

export function CollectedTokens({ tokenIds }: CollectedTokensProps) {
  const sorted = [...tokenIds].sort((a, b) => a - b);
  return (
    <div className="collected-tokens-grid">
      {sorted.map(id => {
        const value = id <= 19 ? id + 1 : 25;
        return (
          <svg key={id} width={36} height={36}>
            <circle cx={18} cy={18} r={16} fill="white" stroke="black" strokeWidth={2} />
            <text x={18} y={18} textAnchor="middle" dominantBaseline="central"
              fontSize={12} fontWeight="bold" fill="black" fontFamily="Arial, sans-serif">
              {value}
            </text>
          </svg>
        );
      })}
    </div>
  );
}
