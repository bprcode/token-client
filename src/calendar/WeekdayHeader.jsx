import { TableCell, TableHead, TableRow } from '@mui/material'
import { weekdayAbbreviations } from './dateLogic.mjs'

export function WeekdayHeader() {
  return (
    <TableHead>
      <TableRow>
        {weekdayAbbreviations.map(d => (
          <TableCell key={d}>{d}</TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}
