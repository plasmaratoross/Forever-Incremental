# Game Balancing Formulas

## Click Value
$$ \text{Click Value} = \text{Base Click Power} \times \text{Rebirth Multiplier} $$

## Rebirth Formula
- **Minimum Requirement**: $1,000$ Points
- **Rebirth Points Gained**:
  $$ \text{RP} = \lfloor \frac{\text{Current Points}}{1000} \rfloor $$
- **New Rebirth Multiplier**:
  $$ \text{Mult}_{\text{new}} = \text{Mult}_{\text{current}} + (\text{RP} \times 0.5) $$
