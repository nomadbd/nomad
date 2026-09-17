import React from 'react';
import { cardStyle, numberStyle, benefitTitleStyle, benefitDescStyle } from './styles';

interface BenefitCardProps {
  number: string;
  title: string;
  description: string;
}

export const BenefitCard: React.FC<BenefitCardProps> = ({ number, title, description }) => {
  return (
    <div style={cardStyle}>
      <span style={numberStyle}>{number}</span>
      <div style={benefitTitleStyle}>{title}</div>
      <p style={benefitDescStyle}>{description}</p>
    </div>
  );
};
