import { TableCell, TableHead, TableRow } from '@mui/material'
import { weekdayAbbreviations } from './dateLogic.mjs'

export function WeekdayHeader() {
  return (
    <TableHead>
      <TableRow>
        {weekdayAbbreviations.map(d => (
          <TableCell key={d} sx={{ px: [0.5, 1] }}>
            {d}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}
