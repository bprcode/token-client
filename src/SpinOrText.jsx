import { CircularProgress } from '@mui/material'

export default function SpinOrText({ spin, text }) {
  return spin ? <CircularProgress size="1.5rem" /> : text
}
