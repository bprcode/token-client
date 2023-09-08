import {
  styled,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

const StyledAlternateCell = styled(TableCell)(({ theme }) => ({
  '&:nth-of-type(odd)': { backgroundColor: '#0004' },
  '&:hover': { backgroundColor: theme.palette.action.hover },
}))

export function ExpandedWeekHeader({ sunday }) {
  const headingCells = []
  const endOfWeek = sunday.endOf('week')
  let d = sunday

  while (d.isBefore(endOfWeek)) {
    headingCells.push(
      <StyledAlternateCell align="center" key={d.format('D')}>
        <Typography variant="caption">{d.format('ddd')}</Typography>
        <Typography variant="h5">{d.format('D')}</Typography>
      </StyledAlternateCell>
    )
    d = d.add(1, 'day')
  }

  return (
    <TableHead>
      <TableRow>{headingCells}</TableRow>
    </TableHead>
  )
}
